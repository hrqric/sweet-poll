-- GOTY Poll: schema principal, RLS e RPCs
-- Regras de moedas/pontos só rodam em funções security definer (AD-005).

-- ───────────── tabelas ─────────────
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  username text unique not null
    check (char_length(username) between 3 and 20 and username ~ '^[A-Za-z0-9_.]+$'),
  coins int not null default 150 check (coins >= 0),
  avatar jsonb,
  created_at timestamptz not null default now()
);

create table public.shop_items (
  id text primary key,
  slot text not null check (slot in ('hat','face','outfit','held','pet','bg')),
  name text not null,
  description text not null default '',
  price int not null check (price > 0),
  rarity text not null check (rarity in ('comum','raro','epico','lendario')),
  sort int not null default 0
);

create table public.inventory (
  user_id uuid not null references public.profiles on delete cascade,
  item_id text not null references public.shop_items on delete cascade,
  acquired_at timestamptz not null default now(),
  primary key (user_id, item_id)
);
create index inventory_item_idx on public.inventory(item_id);

create table public.tga_catalog (
  id serial primary key,
  year int not null,
  position int not null,
  category text not null,
  nominees jsonb not null,
  unique (year, category)
);

create table public.pools (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles on delete cascade,
  name text not null check (char_length(name) between 3 and 60),
  description text not null default '' check (char_length(description) <= 280),
  invite_code text unique not null default upper(substr(md5(gen_random_uuid()::text), 1, 6)),
  mode text not null check (mode in ('server','user')),
  year int not null default 2026,
  status text not null default 'open' check (status in ('open','locked','finished')),
  lock_at timestamptz,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);
create index pools_owner_idx on public.pools(owner_id);

create table public.pool_categories (
  id uuid primary key default gen_random_uuid(),
  pool_id uuid not null references public.pools on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  position int not null,
  points int not null default 10 check (points between 1 and 1000),
  winner_nominee_id uuid
);
create index pool_categories_pool_idx on public.pool_categories(pool_id);

create table public.pool_nominees (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.pool_categories on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  subtitle text not null default '',
  position int not null
);
create index pool_nominees_category_idx on public.pool_nominees(category_id);

alter table public.pool_categories
  add constraint pool_categories_winner_fk foreign key (winner_nominee_id)
  references public.pool_nominees(id) on delete set null;
create index pool_categories_winner_idx on public.pool_categories(winner_nominee_id);

create table public.pool_members (
  pool_id uuid not null references public.pools on delete cascade,
  user_id uuid not null references public.profiles on delete cascade,
  joined_at timestamptz not null default now(),
  score int not null default 0,
  hits int not null default 0,
  coins_earned int not null default 0,
  rank int,
  primary key (pool_id, user_id)
);
create index pool_members_user_idx on public.pool_members(user_id);

create table public.picks (
  pool_id uuid not null references public.pools on delete cascade,
  user_id uuid not null references public.profiles on delete cascade,
  category_id uuid not null references public.pool_categories on delete cascade,
  nominee_id uuid not null references public.pool_nominees on delete cascade,
  updated_at timestamptz not null default now(),
  primary key (user_id, category_id)
);
create index picks_pool_idx on public.picks(pool_id);
create index picks_category_idx on public.picks(category_id);
create index picks_nominee_idx on public.picks(nominee_id);

-- ───────────── helpers ─────────────
create or replace function public.is_pool_member(p uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.pool_members m where m.pool_id = p and m.user_id = (select auth.uid())
  );
$$;

create or replace function public.pool_accepts_picks(p uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(
    (select pl.status = 'open' and (pl.lock_at is null or pl.lock_at > now())
       from public.pools pl where pl.id = p),
    false);
$$;

-- ───────────── novo usuário → profile ─────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  base text;
  candidate text;
begin
  base := substr(regexp_replace(coalesce(new.raw_user_meta_data->>'username', ''), '[^A-Za-z0-9_.]', '', 'g'), 1, 16);
  if char_length(base) < 3 then
    base := 'player' || substr(replace(new.id::text, '-', ''), 1, 6);
  end if;
  candidate := base;
  while exists (select 1 from public.profiles where lower(username) = lower(candidate)) loop
    candidate := base || floor(random() * 9000 + 1000)::int::text;
  end loop;
  insert into public.profiles (id, username) values (new.id, candidate);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- avatar só pode equipar itens do inventário
create or replace function public.validate_avatar()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  s text;
  item text;
begin
  if new.avatar is null then return new; end if;
  foreach s in array array['hat','face','outfit','held','pet','bg'] loop
    item := new.avatar->>s;
    if item is not null and item <> '' then
      if not exists (
        select 1 from public.inventory i join public.shop_items si on si.id = i.item_id
        where i.user_id = new.id and i.item_id = item and si.slot = s
      ) then
        raise exception 'Item % não está no seu inventário', item using errcode = 'P0001';
      end if;
    end if;
  end loop;
  return new;
end;
$$;

create trigger profiles_validate_avatar
  before update of avatar on public.profiles
  for each row execute function public.validate_avatar();

-- ───────────── RLS ─────────────
alter table public.profiles enable row level security;
alter table public.shop_items enable row level security;
alter table public.inventory enable row level security;
alter table public.tga_catalog enable row level security;
alter table public.pools enable row level security;
alter table public.pool_categories enable row level security;
alter table public.pool_nominees enable row level security;
alter table public.pool_members enable row level security;
alter table public.picks enable row level security;

create policy "profiles legíveis por logados" on public.profiles
  for select to authenticated using (true);
create policy "edita o próprio profile" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

revoke update on public.profiles from anon, authenticated;
grant update (username, avatar) on public.profiles to authenticated;

create policy "loja pública" on public.shop_items for select to anon, authenticated using (true);
create policy "catálogo público" on public.tga_catalog for select to anon, authenticated using (true);

create policy "vê o próprio inventário" on public.inventory
  for select to authenticated using (user_id = (select auth.uid()));

create policy "vê bolões que participa" on public.pools
  for select to authenticated
  using (owner_id = (select auth.uid()) or public.is_pool_member(id));
create policy "dono edita bolão" on public.pools
  for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "dono apaga bolão" on public.pools
  for delete to authenticated using (owner_id = (select auth.uid()));
revoke update on public.pools from anon, authenticated;
grant update (name, description, lock_at) on public.pools to authenticated;

create policy "membros veem categorias" on public.pool_categories
  for select to authenticated using (public.is_pool_member(pool_id));
create policy "membros veem indicados" on public.pool_nominees
  for select to authenticated using (
    exists (select 1 from public.pool_categories c where c.id = category_id and public.is_pool_member(c.pool_id))
  );
create policy "membros veem membros" on public.pool_members
  for select to authenticated using (public.is_pool_member(pool_id));
create policy "sai do bolão" on public.pool_members
  for delete to authenticated using (user_id = (select auth.uid()));

-- palpites dos outros só depois do bloqueio (AD-006)
create policy "vê palpites" on public.picks
  for select to authenticated using (
    user_id = (select auth.uid())
    or (public.is_pool_member(pool_id) and not public.pool_accepts_picks(pool_id))
  );

-- ───────────── RPCs ─────────────
create or replace function public.username_available(p_username text)
returns boolean language sql stable security definer set search_path = '' as $$
  select not exists (select 1 from public.profiles where lower(username) = lower(p_username));
$$;

create or replace function public.create_pool(
  p_name text,
  p_description text,
  p_mode text,
  p_lock_at timestamptz,
  p_points int,
  p_catalog_ids int[],
  p_custom jsonb
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
begin
  if uid is null then raise exception 'Faça login primeiro'; end if;
  if p_mode not in ('server','user') then raise exception 'Modo inválido'; end if;
  if pts < 1 or pts > 1000 then raise exception 'Pontos por acerto entre 1 e 1000'; end if;

  insert into public.pools (owner_id, name, description, mode, lock_at)
  values (uid, trim(p_name), coalesce(trim(p_description), ''), p_mode, p_lock_at)
  returning * into pool;

  if p_mode = 'server' then
    if coalesce(array_length(p_catalog_ids, 1), 0) = 0 then raise exception 'Escolha ao menos uma categoria'; end if;
    for rec in
      select * from public.tga_catalog where id = any(p_catalog_ids) order by position
    loop
      insert into public.pool_categories (pool_id, name, position, points)
      values (pool.id, rec.category, pos, pts) returning id into cat_id;
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
      insert into public.pool_categories (pool_id, name, position, points)
      values (pool.id, trim(c->>'name'), pos, coalesce((c->>'points')::int, pts)) returning id into cat_id;
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

create or replace function public.pool_preview(p_code text)
returns table (
  id uuid, name text, description text, owner_username text, owner_avatar jsonb,
  status text, mode text, member_count bigint, category_count bigint, is_member boolean
) language sql stable security definer set search_path = '' as $$
  select p.id, p.name, p.description, o.username, o.avatar, p.status, p.mode,
    (select count(*) from public.pool_members m where m.pool_id = p.id),
    (select count(*) from public.pool_categories c where c.pool_id = p.id),
    exists (select 1 from public.pool_members m where m.pool_id = p.id and m.user_id = auth.uid())
  from public.pools p join public.profiles o on o.id = p.owner_id
  where p.invite_code = upper(trim(p_code));
$$;

create or replace function public.join_pool(p_code text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  pool public.pools;
begin
  if auth.uid() is null then raise exception 'Faça login primeiro'; end if;
  select * into pool from public.pools where invite_code = upper(trim(p_code));
  if pool.id is null then raise exception 'Código de convite não encontrado'; end if;
  if pool.status = 'finished' then raise exception 'Esse bolão já foi encerrado'; end if;
  insert into public.pool_members (pool_id, user_id) values (pool.id, auth.uid())
  on conflict do nothing;
  return pool.id;
end;
$$;

create or replace function public.save_pick(p_category uuid, p_nominee uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  pid uuid;
begin
  select c.pool_id into pid from public.pool_categories c
    join public.pool_nominees n on n.category_id = c.id
    where c.id = p_category and n.id = p_nominee;
  if pid is null then raise exception 'Palpite inválido'; end if;
  if not public.is_pool_member(pid) then raise exception 'Você não está nesse bolão'; end if;
  if not public.pool_accepts_picks(pid) then raise exception 'Os palpites já foram bloqueados'; end if;
  insert into public.picks (pool_id, user_id, category_id, nominee_id)
  values (pid, auth.uid(), p_category, p_nominee)
  on conflict (user_id, category_id) do update set nominee_id = excluded.nominee_id, updated_at = now();
end;
$$;

create or replace function public.set_pool_status(p_pool uuid, p_status text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_status not in ('open','locked') then raise exception 'Status inválido'; end if;
  update public.pools set status = p_status
   where id = p_pool and owner_id = auth.uid() and status <> 'finished';
  if not found then raise exception 'Só o dono pode mudar um bolão em andamento'; end if;
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
  update public.pool_categories set winner_nominee_id = p_nominee where id = p_category;
end;
$$;

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

  with s as (
    select m.user_id,
      coalesce(sum(c.points) filter (where pk.nominee_id = c.winner_nominee_id), 0)::int as score,
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

create or replace function public.buy_item(p_item text)
returns int language plpgsql security definer set search_path = '' as $$
declare
  item public.shop_items;
  balance int;
begin
  if auth.uid() is null then raise exception 'Faça login primeiro'; end if;
  select * into item from public.shop_items where id = p_item;
  if item.id is null then raise exception 'Item não existe'; end if;
  if exists (select 1 from public.inventory where user_id = auth.uid() and item_id = p_item) then
    raise exception 'Você já tem esse item';
  end if;
  update public.profiles set coins = coins - item.price
   where id = auth.uid() and coins >= item.price
   returning coins into balance;
  if balance is null then raise exception 'Moedas insuficientes'; end if;
  insert into public.inventory (user_id, item_id) values (auth.uid(), p_item);
  return balance;
end;
$$;

-- só logados chamam RPCs (preview e username também para anônimos)
revoke execute on all functions in schema public from public, anon;
grant execute on function public.create_pool, public.join_pool, public.save_pick, public.set_pool_status,
  public.set_winner, public.finish_pool, public.buy_item, public.pool_preview, public.username_available,
  public.is_pool_member, public.pool_accepts_picks
  to authenticated;
grant execute on function public.pool_preview, public.username_available to anon;
