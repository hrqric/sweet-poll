-- host pode incluir um indicado esquecido numa categoria enquanto o bolão não foi encerrado
create or replace function public.add_nominee(p_category uuid, p_title text, p_subtitle text default '')
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  pool public.pools;
  t text := btrim(coalesce(p_title, ''));
  st text := btrim(coalesce(p_subtitle, ''));
  new_id uuid;
begin
  select p.* into pool
    from public.pools p join public.pool_categories c on c.pool_id = p.id
   where c.id = p_category
   for update of p;
  if pool.id is null or pool.owner_id <> auth.uid() then raise exception 'Só o dono do bolão adiciona indicados'; end if;
  if pool.status = 'finished' then raise exception 'Bolão já encerrado'; end if;
  if char_length(t) < 1 or char_length(t) > 120 then raise exception 'Nome do indicado: 1 a 120 caracteres'; end if;
  if char_length(st) > 120 then raise exception 'Detalhe do indicado: até 120 caracteres'; end if;
  if exists (select 1 from public.pool_nominees where category_id = p_category and lower(title) = lower(t)) then
    raise exception 'Esse indicado já está na categoria';
  end if;

  insert into public.pool_nominees (category_id, title, subtitle, position)
  values (p_category, t, st,
          coalesce((select max(position) + 1 from public.pool_nominees where category_id = p_category), 0))
  returning id into new_id;
  -- update "vazio" na categoria: dispara o realtime que a sala já escuta, e todo mundo recarrega
  update public.pool_categories set position = position where id = p_category;
  return new_id;
end;
$$;

revoke execute on function public.add_nominee(uuid, text, text) from public, anon;
grant execute on function public.add_nominee(uuid, text, text) to authenticated;
