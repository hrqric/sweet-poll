-- Quem vê o palpite de quem (o próprio palpite cada um sempre vê):
--   anonymous → só aparece quem ACERTOU, depois que o vencedor da categoria sai
--   closed    → todos aparecem quando os palpites fecham (era o único jeito antes)
--   public    → todos aparecem o tempo todo, até com os palpites abertos
-- A regra fica na policy de RLS, então o navegador nunca recebe um palpite que não deveria ver.

alter table public.pools
  add column picks_visibility text not null default 'closed'
  check (picks_visibility in ('anonymous','closed','public'));

create or replace function public.can_see_pick(p_pool uuid, p_category uuid, p_nominee uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.is_pool_member(p_pool) and coalesce((
    select case p.picks_visibility
             when 'public' then true
             when 'closed' then not public.pool_accepts_picks(p.id)
             when 'anonymous' then exists (
               select 1 from public.pool_categories c
                where c.id = p_category and c.winner_nominee_id = p_nominee)
           end
      from public.pools p where p.id = p_pool), false);
$$;

drop policy "vê palpites" on public.picks;
create policy "vê palpites" on public.picks
  for select to authenticated using (
    user_id = (select auth.uid())
    or public.can_see_pick(pool_id, category_id, nominee_id)
  );

create or replace function public.set_picks_visibility(p_pool uuid, p_visibility text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_visibility not in ('anonymous','closed','public') then raise exception 'Opção inválida'; end if;
  update public.pools set picks_visibility = p_visibility
   where id = p_pool and owner_id = auth.uid() and status <> 'finished';
  if not found then raise exception 'Só o dono muda isso num bolão em andamento'; end if;
end;
$$;
revoke execute on function public.set_picks_visibility(uuid, text) from public, anon;
grant execute on function public.set_picks_visibility(uuid, text) to authenticated;

-- no modo público os palpites dos amigos aparecem ao vivo
alter publication supabase_realtime add table public.picks;
