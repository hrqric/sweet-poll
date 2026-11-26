-- Três jeitos de pontuar um bolão:
--   flat    → toda categoria vale base_points
--   custom  → cada categoria tem seus pontos; o host pode mudar no painel (set_category_points)
--   dynamic → toda categoria vale base_points × multiplier. O multiplicador mede o quanto o grupo
--             se dividiu nos palpites (entropia normalizada): todo mundo no mesmo indicado = 1.00,
--             grupo totalmente dividido = 2.00. Só é calculado quando os palpites fecham, porque
--             antes disso os palpites alheios são secretos (AD-006) e o cálculo vazaria a tendência.

alter table public.pools
  add column scoring text not null default 'flat' check (scoring in ('flat','custom','dynamic')),
  add column base_points int not null default 10 check (base_points between 1 and 1000);

alter table public.pool_categories
  add column multiplier numeric(4,2) check (multiplier between 1 and 2);

-- bolões que já existem: base = maior pontuação; quem tinha pontos diferentes por categoria vira custom
update public.pools p set
  base_points = coalesce((select max(points) from public.pool_categories c where c.pool_id = p.id), 10),
  scoring = case when (select count(distinct points) from public.pool_categories c where c.pool_id = p.id) > 1
                 then 'custom' else 'flat' end;

-- ───────── multiplicador dinâmico ─────────
create or replace function public.refresh_multipliers(p_pool uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if (select scoring from public.pools where id = p_pool) is distinct from 'dynamic' then
    update public.pool_categories set multiplier = null where pool_id = p_pool and multiplier is not null;
    return;
  end if;

  with counts as (
    select pk.category_id, pk.nominee_id, count(*)::numeric as n
      from public.picks pk where pk.pool_id = p_pool
     group by pk.category_id, pk.nominee_id
  ), per_cat as (
    select c.id,
      coalesce((select sum(n) from counts where counts.category_id = c.id), 0) as total,
      (select count(*) from public.pool_nominees nm where nm.category_id = c.id) as nominees
    from public.pool_categories c where c.pool_id = p_pool
  ), ent as (
    select pc.id, pc.total, least(pc.total, pc.nominees) as slots,
      coalesce((select -sum((n / pc.total) * ln(n / pc.total)) from counts where counts.category_id = pc.id and pc.total > 0), 0) as h
    from per_cat pc
  )
  update public.pool_categories c
     set multiplier = case when e.slots <= 1 then 1.00
                           else round(least(2, 1 + e.h / ln(e.slots))::numeric, 2) end
    from ent e
   where c.id = e.id;
end;
$$;
revoke execute on function public.refresh_multipliers(uuid) from public, anon, authenticated;

-- ───────── create_pool ganha p_scoring e p_catalog_points ─────────
drop function public.create_pool(text, text, text, timestamptz, int, int[], jsonb);

create function public.create_pool(
  p_name text,
  p_description text,
  p_mode text,
  p_lock_at timestamptz,
  p_points int,
  p_catalog_ids int[],
  p_custom jsonb,
  p_scoring text default 'flat',
  p_catalog_points jsonb default '{}'::jsonb
) returns public.pools
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  pool public.pools;
  cat_id uuid;
  rec record;
  c jsonb;
  n jsonb;
  pos int := 0;
  npos int;
  pts int := coalesce(p_points, 10);
  cpts int;
begin
  if uid is null then raise exception 'Faça login primeiro'; end if;
  if p_mode not in ('server','user') then raise exception 'Modo inválido'; end if;
  if p_scoring not in ('flat','custom','dynamic') then raise exception 'Tipo de pontuação inválido'; end if;
  if pts < 1 or pts > 1000 then raise exception 'Pontos por acerto entre 1 e 1000'; end if;

  insert into public.pools (owner_id, name, description, mode, lock_at, scoring, base_points)
  values (uid, trim(p_name), coalesce(trim(p_description), ''), p_mode, p_lock_at, p_scoring, pts)
  returning * into pool;

  if p_mode = 'server' then
    if coalesce(array_length(p_catalog_ids, 1), 0) = 0 then raise exception 'Escolha ao menos uma categoria'; end if;
    for rec in
      select * from public.tga_catalog where id = any(p_catalog_ids) order by position
    loop
      cpts := case when p_scoring = 'custom'
                   then coalesce((p_catalog_points->>rec.id::text)::int, pts) else pts end;
      if cpts < 1 or cpts > 1000 then raise exception 'Pontos de "%" entre 1 e 1000', rec.category; end if;
      insert into public.pool_categories (pool_id, name, position, points)
      values (pool.id, rec.category, pos, cpts) returning id into cat_id;
      pos := pos + 1;
      npos := 0;
      for n in select * from jsonb_array_elements(rec.nominees) loop
        insert into public.pool_nominees (category_id, title, subtitle, position)
        values (cat_id, n->>'title', coalesce(n->>'subtitle', ''), npos);
        npos := npos + 1;
      end loop;
    end loop;
  else
    if jsonb_typeof(p_custom) <> 'array' or jsonb_array_length(p_custom) = 0 then
      raise exception 'Escreva ao menos uma categoria';
    end if;
    if jsonb_array_length(p_custom) > 40 then raise exception 'Máximo de 40 categorias'; end if;
    for c in select * from jsonb_array_elements(p_custom) loop
      if coalesce(trim(c->>'name'), '') = '' then raise exception 'Categoria sem nome'; end if;
      if jsonb_array_length(coalesce(c->'nominees', '[]'::jsonb)) < 2 then
        raise exception 'A categoria "%" precisa de pelo menos 2 indicados', c->>'name';
      end if;
      if jsonb_array_length(c->'nominees') > 12 then
        raise exception 'A categoria "%" tem indicados demais (máx. 12)', c->>'name';
      end if;
      cpts := case when p_scoring = 'custom' then coalesce((c->>'points')::int, pts) else pts end;
      if cpts < 1 or cpts > 1000 then raise exception 'Pontos de "%" entre 1 e 1000', c->>'name'; end if;
      insert into public.pool_categories (pool_id, name, position, points)
      values (pool.id, trim(c->>'name'), pos, cpts) returning id into cat_id;
      pos := pos + 1;
      npos := 0;
      for n in select * from jsonb_array_elements(c->'nominees') loop
        if coalesce(trim(n->>'title'), '') <> '' then
          insert into public.pool_nominees (category_id, title, subtitle, position)
          values (cat_id, trim(n->>'title'), coalesce(trim(n->>'subtitle'), ''), npos);
          npos := npos + 1;
        end if;
      end loop;
    end loop;
  end if;

  if pos = 0 then raise exception 'Nenhuma categoria válida'; end if;

  insert into public.pool_members (pool_id, user_id) values (pool.id, uid);
  return pool;
end;
$$;
revoke execute on function public.create_pool(text, text, text, timestamptz, int, int[], jsonb, text, jsonb) from public, anon;
grant execute on function public.create_pool(text, text, text, timestamptz, int, int[], jsonb, text, jsonb) to authenticated;

-- ───────── host muda os pontos de uma categoria (só no modo custom) ─────────
create or replace function public.set_category_points(p_category uuid, p_points int)
returns void language plpgsql security definer set search_path = '' as $$
declare
  pool public.pools;
begin
  select p.* into pool from public.pools p join public.pool_categories c on c.pool_id = p.id
   where c.id = p_category;
  if pool.id is null or pool.owner_id <> auth.uid() then raise exception 'Só o dono muda os pontos'; end if;
  if pool.status = 'finished' then raise exception 'Bolão já encerrado'; end if;
  if pool.scoring <> 'custom' then raise exception 'Esse bolão usa a mesma pontuação pra todas as categorias'; end if;
  if p_points is null or p_points < 1 or p_points > 1000 then raise exception 'Pontos: de 1 a 1000'; end if;
  update public.pool_categories set points = p_points where id = p_category;
end;
$$;
revoke execute on function public.set_category_points(uuid, int) from public, anon;
grant execute on function public.set_category_points(uuid, int) to authenticated;

-- ───────── recalcula multiplicador ao fechar / reabrir / marcar vencedor ─────────
create or replace function public.set_pool_status(p_pool uuid, p_status text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_status not in ('open','locked') then raise exception 'Status inválido'; end if;
  update public.pools set status = p_status
   where id = p_pool and owner_id = auth.uid() and status <> 'finished';
  if not found then raise exception 'Só o dono pode mudar um bolão em andamento'; end if;
  if p_status = 'locked' then
    perform public.refresh_multipliers(p_pool);
  else
    -- reabriu: palpites podem mudar, multiplicador volta a ser segredo
    update public.pool_categories set multiplier = null where pool_id = p_pool;
  end if;
end;
$$;

create or replace function public.set_winner(p_category uuid, p_nominee uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  pool public.pools;
begin
  select p.* into pool from public.pools p join public.pool_categories c on c.pool_id = p.id
   where c.id = p_category;
  if pool.id is null or pool.owner_id <> auth.uid() then raise exception 'Só o dono marca vencedores'; end if;
  if pool.status = 'finished' then raise exception 'Bolão já encerrado'; end if;
  if p_nominee is not null and not exists (
    select 1 from public.pool_nominees where id = p_nominee and category_id = p_category
  ) then raise exception 'Indicado não pertence à categoria'; end if;
  -- marcar vencedor bloqueia palpites automaticamente
  update public.pools set status = 'locked' where id = pool.id and status = 'open';
  if (select multiplier from public.pool_categories where id = p_category) is null then
    perform public.refresh_multipliers(pool.id);
  end if;
  update public.pool_categories set winner_nominee_id = p_nominee where id = p_category;
end;
$$;

-- ───────── finish_pool soma pontos × multiplicador ─────────
create or replace function public.finish_pool(p_pool uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  pool public.pools;
begin
  select * into pool from public.pools where id = p_pool for update;
  if pool.id is null or pool.owner_id <> auth.uid() then raise exception 'Só o dono encerra o bolão'; end if;
  if pool.status = 'finished' then raise exception 'Bolão já encerrado'; end if;
  if exists (select 1 from public.pool_categories where pool_id = p_pool and winner_nominee_id is null) then
    raise exception 'Marque o vencedor de todas as categorias antes de encerrar';
  end if;

  perform public.refresh_multipliers(p_pool);

  with s as (
    select m.user_id,
      coalesce(sum(round(c.points * coalesce(c.multiplier, 1)))
               filter (where pk.nominee_id = c.winner_nominee_id), 0)::int as score,
      count(*) filter (where pk.nominee_id = c.winner_nominee_id)::int as hits
    from public.pool_members m
    left join public.picks pk on pk.pool_id = m.pool_id and pk.user_id = m.user_id
    left join public.pool_categories c on c.id = pk.category_id
    where m.pool_id = p_pool
    group by m.user_id
  ), r as (
    select s.*, rank() over (order by s.score desc) as rnk from s
  )
  update public.pool_members m
     set score = r.score, hits = r.hits, rank = r.rnk,
         coins_earned = r.score + case when r.score > 0 then
           case r.rnk when 1 then 100 when 2 then 50 when 3 then 25 else 0 end else 0 end
    from r
   where m.pool_id = p_pool and m.user_id = r.user_id;

  update public.profiles pr
     set coins = pr.coins + m.coins_earned
    from public.pool_members m
   where m.pool_id = p_pool and m.user_id = pr.id;

  update public.pools set status = 'finished', finished_at = now() where id = p_pool;
end;
$$;

-- ───────── categorias novas respeitam o modo de pontuação ─────────
create or replace function public.add_category(p_pool uuid, p_name text, p_points int default 10)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  pool public.pools;
  n text := btrim(coalesce(p_name, ''));
  pts int;
  new_id uuid;
begin
  select * into pool from public.pools where id = p_pool for update;
  if pool.id is null or pool.owner_id <> auth.uid() then raise exception 'Só o dono do bolão adiciona categorias'; end if;
  if pool.status = 'finished' then raise exception 'Bolão já encerrado'; end if;
  if char_length(n) < 1 or char_length(n) > 80 then raise exception 'Nome da categoria: 1 a 80 caracteres'; end if;
  pts := case when pool.scoring = 'custom' then p_points else pool.base_points end;
  if pts is null or pts < 1 or pts > 1000 then raise exception 'Pontos: de 1 a 1000'; end if;
  if exists (select 1 from public.pool_categories where pool_id = p_pool and lower(name) = lower(n)) then
    raise exception 'Essa categoria já está no bolão';
  end if;

  insert into public.pool_categories (pool_id, name, position, points)
  values (p_pool, n,
          coalesce((select max(position) + 1 from public.pool_categories where pool_id = p_pool), 0),
          pts)
  returning id into new_id;
  update public.pools set name = name where id = p_pool;
  return new_id;
end;
$$;

create or replace function public.add_catalog_category(p_pool uuid, p_catalog_id int, p_points int default 10)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  pool public.pools;
  rec public.tga_catalog;
  n jsonb;
  npos int := 0;
  pts int;
  new_id uuid;
begin
  select * into pool from public.pools where id = p_pool for update;
  if pool.id is null or pool.owner_id <> auth.uid() then raise exception 'Só o dono do bolão adiciona categorias'; end if;
  if pool.status = 'finished' then raise exception 'Bolão já encerrado'; end if;
  pts := case when pool.scoring = 'custom' then p_points else pool.base_points end;
  if pts is null or pts < 1 or pts > 1000 then raise exception 'Pontos: de 1 a 1000'; end if;

  select * into rec from public.tga_catalog where id = p_catalog_id;
  if rec.id is null then raise exception 'Categoria não existe na lista oficial'; end if;
  if exists (select 1 from public.pool_categories where pool_id = p_pool and lower(name) = lower(rec.category)) then
    raise exception 'Essa categoria já está no bolão';
  end if;

  insert into public.pool_categories (pool_id, name, position, points)
  values (p_pool, rec.category,
          coalesce((select max(position) + 1 from public.pool_categories where pool_id = p_pool), 0),
          pts)
  returning id into new_id;

  for n in select * from jsonb_array_elements(rec.nominees) loop
    insert into public.pool_nominees (category_id, title, subtitle, position)
    values (new_id, n->>'title', coalesce(n->>'subtitle', ''), npos);
    npos := npos + 1;
  end loop;

  update public.pools set name = name where id = p_pool;
  return new_id;
end;
$$;
