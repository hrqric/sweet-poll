-- host pode puxar uma categoria esquecida da lista oficial (tga_catalog), já com os indicados
create or replace function public.add_catalog_category(p_pool uuid, p_catalog_id int, p_points int default 10)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  pool public.pools;
  rec public.tga_catalog;
  n jsonb;
  npos int := 0;
  new_id uuid;
begin
  select * into pool from public.pools where id = p_pool for update;
  if pool.id is null or pool.owner_id <> auth.uid() then raise exception 'Só o dono do bolão adiciona categorias'; end if;
  if pool.status = 'finished' then raise exception 'Bolão já encerrado'; end if;
  if p_points is null or p_points < 1 or p_points > 1000 then raise exception 'Pontos: de 1 a 1000'; end if;

  select * into rec from public.tga_catalog where id = p_catalog_id;
  if rec.id is null then raise exception 'Categoria não existe na lista oficial'; end if;
  if exists (select 1 from public.pool_categories where pool_id = p_pool and lower(name) = lower(rec.category)) then
    raise exception 'Essa categoria já está no bolão';
  end if;

  insert into public.pool_categories (pool_id, name, position, points)
  values (p_pool, rec.category,
          coalesce((select max(position) + 1 from public.pool_categories where pool_id = p_pool), 0),
          p_points)
  returning id into new_id;

  for n in select * from jsonb_array_elements(rec.nominees) loop
    insert into public.pool_nominees (category_id, title, subtitle, position)
    values (new_id, n->>'title', coalesce(n->>'subtitle', ''), npos);
    npos := npos + 1;
  end loop;

  -- update "vazio" no bolão: dispara o realtime que a sala já escuta, e todo mundo recarrega
  update public.pools set name = name where id = p_pool;
  return new_id;
end;
$$;

revoke execute on function public.add_catalog_category(uuid, int, int) from public, anon;
grant execute on function public.add_catalog_category(uuid, int, int) to authenticated;
