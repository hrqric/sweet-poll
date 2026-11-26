-- Agenda a leitura da Wikipédia: a cada 2 min de 10 a 12 de dezembro (UTC), que cobre a noite do TGA
-- (5:30 PM PT = 22:30 em Brasília = 01:30 UTC do dia seguinte). A função se protege sozinha contra
-- chamadas repetidas (no máximo 1 leitura a cada 50 s).
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

select cron.schedule(
  'tga-results-ceremony',
  '*/2 * 10-12 12 *',
  $$ select net.http_post(
       url := 'https://sffugqamssclfdrodfhi.supabase.co/functions/v1/tga-results',
       headers := '{"Content-Type": "application/json"}'::jsonb,
       body := '{}'::jsonb,
       timeout_milliseconds := 20000
     ) $$
);
