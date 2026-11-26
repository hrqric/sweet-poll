-- host pode incluir uma categoria esquecida (vazia; os indicados entram depois com add_nominee)
create or replace function public.add_category(p_pool uuid, p_name text, p_points int default 10)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  pool public.pools;
  n text := btrim(coalesce(p_name, ''));
  new_id uuid;
begin
  select * into pool from public.pools where id = p_pool for update;
  if pool.id is null or pool.owner_id <> auth.uid() then raise exception 'Só o dono do bolão adiciona categorias'; end if;
  if pool.status = 'finished' then raise exception 'Bolão já encerrado'; end if;
  if char_length(n) < 1 or char_length(n) > 80 then raise exception 'Nome da categoria: 1 a 80 caracteres'; end if;
  if p_points is null or p_points < 1 or p_points > 1000 then raise exception 'Pontos: de 1 a 1000'; end if;
  if exists (select 1 from public.pool_categories where pool_id = p_pool and lower(name) = lower(n)) then
    raise exception 'Essa categoria já está no bolão';
  end if;

  insert into public.pool_categories (pool_id, name, position, points)
  values (p_pool, n,
          coalesce((select max(position) + 1 from public.pool_categories where pool_id = p_pool), 0),
          p_points)
  returning id into new_id;
  -- update "vazio" no bolão: dispara o realtime que a sala já escuta, e todo mundo recarrega
  update public.pools set name = name where id = p_pool;
  return new_id;
end;
$$;

revoke execute on function public.add_category(uuid, text, int) from public, anon;
grant execute on function public.add_category(uuid, text, int) to authenticated;
