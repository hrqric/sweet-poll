-- vencedores e status aparecem ao vivo na sala do bolão (RLS continua valendo)
alter publication supabase_realtime add table public.pool_categories, public.pools;
