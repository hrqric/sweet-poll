-- Modo cerimônia / overlay: feed dos vencedores de um bolão com quem acertou cada um.
-- Pode ser lido só com o código de convite (o overlay do OBS não tem login). Só expõe quem ACERTOU
-- categorias já decididas, que é o mesmo que o modo anônimo mostra pra qualquer membro.

alter table public.pool_categories add column winner_set_at timestamptz;

create or replace function public.stamp_winner_set_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.winner_nominee_id is distinct from old.winner_nominee_id then
    new.winner_set_at := case when new.winner_nominee_id is null then null else now() end;
  end if;
  return new;
end;
$$;
revoke execute on function public.stamp_winner_set_at() from public, anon, authenticated;

create trigger pool_categories_winner_set_at
  before update of winner_nominee_id on public.pool_categories
  for each row execute function public.stamp_winner_set_at();

create or replace function public.pool_results_feed(p_code text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'pool', jsonb_build_object('id', p.id, 'name', p.name, 'status', p.status,
                               'members', (select count(*) from public.pool_members m where m.pool_id = p.id)),
    'results', coalesce((
      select jsonb_agg(jsonb_build_object(
               'category_id', c.id,
               'category', c.name,
               'position', c.position,
               'value', round(c.points * coalesce(c.multiplier, 1))::int,
               'winner', n.title,
               'winner_sub', n.subtitle,
               'set_at', c.winner_set_at,
               'hits', coalesce((
                 select jsonb_agg(jsonb_build_object('username', pr.username, 'avatar', pr.avatar) order by pr.username)
                   from public.picks pk join public.profiles pr on pr.id = pk.user_id
                  where pk.category_id = c.id and pk.nominee_id = c.winner_nominee_id), '[]'::jsonb)
             ) order by c.winner_set_at nulls first, c.position)
        from public.pool_categories c
        join public.pool_nominees n on n.id = c.winner_nominee_id
       where c.pool_id = p.id), '[]'::jsonb)
  )
  from public.pools p
  where p.invite_code = upper(trim(p_code));
$$;
revoke execute on function public.pool_results_feed(text) from public;
grant execute on function public.pool_results_feed(text) to anon, authenticated;
