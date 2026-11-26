# Deploy — Bolão GOTY

Alvo: **Vercel** (front estático) + **Supabase** `sffugqamssclfdrodfhi` (já com schema, RLS e seeds aplicados).
Nada abaixo foi executado ainda: são os passos pra uma pessoa fazer o deploy.

## 1. Antes de publicar (Supabase)

- [ ] **Apagar as contas de teste** (SQL Editor):
      `delete from auth.users where email like '%@goty.test';`
      Isso também apaga os bolões de teste `00CCB2` e `1F9A7B` (cascade).
- [ ] **Conferir o catálogo 2026** (`tga_catalog`) com https://thegameawards.com/nominees.
      As listas vieram da Wikipedia; o pareamento de algumas categorias foi inferido.
- [ ] **Auth → URL Configuration**:
      - Site URL: `https://<seu-projeto>.vercel.app`
      - Redirect URLs: `https://<seu-projeto>.vercel.app/**` (mantenha `http://localhost:5173/**` pra dev)
- [ ] **Auth → SMTP**: o e-mail embutido do Supabase manda poucas mensagens por hora.
      Configure um SMTP (Resend, Brevo…) ou desligue "Confirm email" se for só entre amigos.
- [ ] **Auth → Password security**: ligar *Leaked password protection* (aviso do advisor).

## 2. Vercel

1. Suba o repositório pro GitHub.
2. Na Vercel: **Add New → Project → importar o repo**.
3. **Root Directory: `app`** (o resto vem do `app/vercel.json`: framework Vite, `npm run build`, saída `dist`, rewrite de SPA, cache de assets).
4. **Environment Variables** (Production e Preview):
   | Nome | Valor |
   |---|---|
   | `VITE_SUPABASE_URL` | `https://sffugqamssclfdrodfhi.supabase.co` |
   | `VITE_SUPABASE_PUBLISHABLE_KEY` | a publishable key (`sb_publishable_…`) do painel → API Keys |
5. Deploy. Depois volte no passo 1 e coloque a URL final no Supabase Auth.

## 3. Smoke test em produção

- [ ] `/` carrega com fontes pixel e o boneco animado.
- [ ] Criar conta nova → e-mail chega → link cai em `/personagem`.
- [ ] Criar bolão (lista oficial) → abrir o link `/b/CODIGO` numa aba anônima → tela de convite aparece.
- [ ] Recarregar direto em `/loja` e `/b/CODIGO` (testa o rewrite de SPA).
- [ ] Segunda conta entra pelo link, palpita; o host marca um vencedor e ele aparece ao vivo na outra aba.

## Rollback

- **Front**: Vercel → Deployments → deploy anterior → *Promote to Production*. Instantâneo.
- **Banco**: as migrações em `supabase/migrations/` só têm *up*. Não há reversão automática;
  se precisar voltar, escreva a migração inversa à mão. Antes da noite da cerimônia,
  vale um backup (Database → Backups) — no plano gratuito não há point-in-time recovery.

## Relatório deploy-readiness (2026-11-26)

| Frente | Compromissos no TDD | Evidência / gap |
|---|---|---|
| Rollback | sem TDD (`docs/design/` vazio) — nenhum compromisso a checar | observação: migrações sem *down* (ver acima) |
| Monitoring | sem TDD — nenhum compromisso a checar | observação: não há APM/alertas; erros só aparecem no console do navegador e em Supabase → Logs |
| Flag / rollout | sem TDD — nenhum compromisso a checar | sem feature flags; rollout é tudo-de-uma-vez |

Checagens feitas: `npm run build` (tsc + vite) passa; build de produção servido localmente
responde 200 em `/`, `/loja` e `/b/00CCB2`; advisors de segurança do Supabase só listam
RPCs públicas intencionais + *leaked password protection* desligada.
