-- Apuração automática: a Edge Function `tga-results` lê a página da Wikipédia do TGA durante a
-- cerimônia e manda os vencedores pra ingest_official_results. Um vencedor só é confirmado quando
-- aparece igual em duas leituras com pelo menos 90 s de intervalo (vandalismo na Wikipédia costuma
-- ser revertido em menos de 1 min). Os bolões com auto_results recebem o vencedor sozinhos; o que o
-- host marcar na mão tem prioridade e não é sobrescrito.

create table public.tga_results (
  catalog_id int primary key references public.tga_catalog on delete cascade,
  candidate text,
  candidate_sub text,
  candidate_seen_at timestamptz,
  winner text,
  winner_sub text,
  confirmed_at timestamptz
);
alter table public.tga_results enable row level security;
create policy "todo mundo vê resultados oficiais" on public.tga_results for select using (true);

create table public.tga_sync (
  year int primary key,
  last_run_at timestamptz,
  last_ok_at timestamptz,
  last_error text,
  found int not null default 0
);
alter table public.tga_sync enable row level security;
create policy "todo mundo vê o status da apuração" on public.tga_sync for select using (true);

alter table public.pools add column auto_results boolean not null default true;
alter table public.pool_categories add column winner_source text check (winner_source in ('host','auto'));

-- chave de comparação de títulos: minúsculo, só letras e números
create or replace function public.title_key(t text)
returns text language sql immutable set search_path = '' as $$
  select regexp_replace(lower(coalesce(t, '')), '[^[:alnum:]]', '', 'g');
$$;

-- aplica os vencedores confirmados nos bolões com apuração automática
create or replace function public.apply_official_results(p_pool uuid default null)
returns int language plpgsql security definer set search_path = '' as $$
declare
  changed int;
  touched uuid[];
begin
  with hits as (
    select pc.id as cat_id, pc.pool_id, n.id as nominee_id
      from public.tga_results r
      join public.tga_catalog tc on tc.id = r.catalog_id
      join public.pools p on p.year = tc.year and p.auto_results and p.status <> 'finished'
      join public.pool_categories pc on pc.pool_id = p.id and lower(pc.name) = lower(tc.category)
      join public.pool_nominees n on n.category_id = pc.id and public.title_key(n.title) = public.title_key(r.winner)
     where r.winner is not null
       -- nome repetido na categoria (ex.: Team Falcons 2x): só vale o de subtítulo igual
       and (public.title_key(n.subtitle) = public.title_key(r.winner_sub)
            or not exists (select 1 from public.pool_nominees n2
                            where n2.category_id = pc.id and n2.id <> n.id
                              and public.title_key(n2.title) = public.title_key(n.title)))
       and pc.winner_source is distinct from 'host'
       and pc.winner_nominee_id is distinct from n.id
       and (p_pool is null or p.id = p_pool)
  ), upd as (
    update public.pool_categories pc
       set winner_nominee_id = h.nominee_id, winner_source = 'auto'
      from hits h where pc.id = h.cat_id
    returning pc.pool_id
  )
  select count(*), array_agg(distinct pool_id) into changed, touched from upd;

  if changed > 0 then
    -- vencedor marcado fecha os palpites, igual quando o host marca
    update public.pools set status = 'locked' where id = any(touched) and status = 'open';
    perform public.refresh_multipliers(t.id)
      from unnest(touched) as t(id)
     where exists (select 1 from public.pool_categories c where c.pool_id = t.id and c.multiplier is null);
  end if;
  return coalesce(changed, 0);
end;
$$;

-- chamado só pela Edge Function (service_role)
create or replace function public.ingest_official_results(p_year int, p_winners jsonb, p_error text default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  w jsonb;
  cid int;
  t text;
  st text;
  confirmed int := 0;
  applied int := 0;
begin
  insert into public.tga_sync (year, last_run_at) values (p_year, now())
  on conflict (year) do update set last_run_at = now();

  if p_error is not null then
    update public.tga_sync set last_error = p_error where year = p_year;
    return jsonb_build_object('error', p_error);
  end if;

  for w in select * from jsonb_array_elements(coalesce(p_winners, '[]'::jsonb)) loop
    cid := (w->>'catalog_id')::int;
    t := w->>'title';
    st := coalesce(w->>'subtitle', '');
    if not exists (select 1 from public.tga_catalog where id = cid and year = p_year) then continue; end if;

    insert into public.tga_results (catalog_id, candidate, candidate_sub, candidate_seen_at)
    values (cid, t, st, now())
    on conflict (catalog_id) do update
      set candidate = excluded.candidate,
          candidate_sub = excluded.candidate_sub,
          candidate_seen_at = case when public.tga_results.candidate = excluded.candidate
                                    and public.tga_results.candidate_sub is not distinct from excluded.candidate_sub
                                   then public.tga_results.candidate_seen_at else now() end;

    update public.tga_results
       set winner = candidate, winner_sub = candidate_sub, confirmed_at = now()
     where catalog_id = cid
       and candidate_seen_at <= now() - interval '90 seconds'
       and (winner is distinct from candidate or winner_sub is distinct from candidate_sub);
    if found then confirmed := confirmed + 1; end if;
  end loop;

  update public.tga_sync
     set last_ok_at = now(), last_error = null,
         found = (select count(*) from public.tga_results r join public.tga_catalog c on c.id = r.catalog_id
                   where c.year = p_year and r.winner is not null)
   where year = p_year;

  applied := public.apply_official_results();
  return jsonb_build_object('confirmed', confirmed, 'applied', applied);
end;
$$;

revoke execute on function public.apply_official_results(uuid) from public, anon, authenticated;
revoke execute on function public.ingest_official_results(int, jsonb, text) from public, anon, authenticated;
grant execute on function public.ingest_official_results(int, jsonb, text) to service_role;

-- host marcando/limpando na mão vira "host" e a apuração automática não mexe mais naquela categoria
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
  update public.pools set status = 'locked' where id = pool.id and status = 'open';
  if (select multiplier from public.pool_categories where id = p_category) is null then
    perform public.refresh_multipliers(pool.id);
  end if;
  update public.pool_categories set winner_nominee_id = p_nominee, winner_source = 'host' where id = p_category;
end;
$$;

-- host liga/desliga a apuração automática; ligar devolve as categorias pro automático
create or replace function public.set_auto_results(p_pool uuid, p_on boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.pools set auto_results = p_on
   where id = p_pool and owner_id = auth.uid() and status <> 'finished';
  if not found then raise exception 'Só o dono muda isso num bolão em andamento'; end if;
  if p_on then
    update public.pool_categories set winner_source = null where pool_id = p_pool and winner_source = 'host';
    perform public.apply_official_results(p_pool);
  end if;
end;
$$;
revoke execute on function public.set_auto_results(uuid, boolean) from public, anon;
grant execute on function public.set_auto_results(uuid, boolean) to authenticated;

-- pra mostrar no painel do host quais categorias têm resultado oficial
alter publication supabase_realtime add table public.tga_sync;
