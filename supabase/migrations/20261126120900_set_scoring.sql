-- host troca o tipo de pontuação (e/ou os pontos base) de um bolão em andamento
--   flat / dynamic → toda categoria passa a valer p_base_points
--   custom         → cada categoria mantém os pontos que tem hoje (o host ajusta uma por uma depois)
-- O multiplicador dinâmico só existe com os palpites fechados; com eles abertos fica nulo (segredo, AD-006).
create or replace function public.set_scoring(p_pool uuid, p_scoring text, p_base_points int)
returns void language plpgsql security definer set search_path = '' as $$
declare
  pool public.pools;
begin
  select * into pool from public.pools where id = p_pool for update;
  if pool.id is null or pool.owner_id <> auth.uid() then raise exception 'Só o dono muda a pontuação'; end if;
  if pool.status = 'finished' then raise exception 'Bolão já encerrado'; end if;
  if p_scoring not in ('flat','custom','dynamic') then raise exception 'Tipo de pontuação inválido'; end if;
  if p_base_points is null or p_base_points < 1 or p_base_points > 1000 then raise exception 'Pontos: de 1 a 1000'; end if;

  update public.pools set scoring = p_scoring, base_points = p_base_points where id = p_pool;

  if p_scoring <> 'custom' then
    update public.pool_categories set points = p_base_points where pool_id = p_pool;
  end if;

  if public.pool_accepts_picks(p_pool) then
    update public.pool_categories set multiplier = null where pool_id = p_pool;
  else
    perform public.refresh_multipliers(p_pool);
  end if;
end;
$$;

revoke execute on function public.set_scoring(uuid, text, int) from public, anon;
grant execute on function public.set_scoring(uuid, text, int) to authenticated;
