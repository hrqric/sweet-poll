-- O feed passa a mandar os bonecos de todos os participantes (não os palpites): cenas como
-- "ninguém acertou" põem o grupo inteiro na tela.
create or replace function public.pool_results_feed(p_code text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'pool', jsonb_build_object('id', p.id, 'name', p.name, 'status', p.status,
                               'members', (select count(*) from public.pool_members m where m.pool_id = p.id),
                               'players', coalesce((
                                 select jsonb_agg(jsonb_build_object('username', pr.username, 'avatar', pr.avatar) order by m.joined_at)
                                   from public.pool_members m join public.profiles pr on pr.id = m.user_id
                                  where m.pool_id = p.id), '[]'::jsonb)),
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
