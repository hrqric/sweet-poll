# Sweet Poll

Monte bolões com seus amigos, acerte os vencedores e customize seus personagens.

**No ar:** https://sweet-poll.vercel.app

Bolão do The Game Awards com cara de jogo de NES. Uma pessoa cria o bolão, escolhe as
categorias (lista oficial do ano ou escritas à mão), manda o link e todo mundo palpita.
Na noite da cerimônia o host marca os vencedores — o ranking atualiza ao vivo — e, ao
encerrar, cada acerto vira moeda pra gastar em roupa, chapéu, pet e cenário pro boneco 8-bit.

## Rodar local

```powershell
cd app
copy .env.example .env.local   # preencha URL e publishable key do Supabase
npm install
npm run dev
```

Abre em http://localhost:5173.

## Deploy

- **Front:** Vercel, projeto `sweet-poll`, Root Directory `app`. Todo push na `main` vira deploy de produção.
  Variáveis: `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` (Production e Preview).
- **Banco/Auth:** Supabase `sffugqamssclfdrodfhi`. Migrações em `supabase/migrations/`.
- **Cadastro:** "Confirm email" está desligado — a conta entra na hora, sem e-mail
  (o e-mail embutido do Supabase só manda ~2 por hora). Por isso não há recuperação de senha.
- Checklist, rollback e pendências em [`DEPLOY.md`](DEPLOY.md).

## Estrutura

| Pasta | O que tem |
|---|---|
| `app/` | Vite + React 19 + TS + Tailwind v4 + motion |
| `app/src/lib/sprites.ts` | motor de sprites: cada parte do boneco e cada item é uma matriz de pixels |
| `app/src/pages/` | Title, Login, CharacterCreator, Hub, NewPool, Pool (sala), Shop |
| `supabase/migrations/` | schema, RLS, RPCs (`create_pool`, `join_pool`, `save_pick`, `set_winner`, `finish_pool`, `buy_item`), seeds da loja e do catálogo |
| `supabase/seed/test-users.md` | contas de teste (apague antes de abrir pro público) |
| `.specs/` | discovery, roadmap e decisões (`STATE.md`) |

## Regras do jogo

- 150 moedas de boas-vindas.
- Ao encerrar: moedas = pontos feitos, + 100 / 50 / 25 pro pódio (se pontuou).
- Palpites fecham no horário definido pelo host, quando ele fecha na mão, ou quando marca o primeiro vencedor.
- Ninguém vê o palpite dos outros até os palpites fecharem.
- Toda regra de moeda/ponto roda no Postgres (`security definer`); o cliente não consegue escrever `coins`.

## Loja

30 itens 8-bit em seis espaços: chapéu, rosto, roupa, mão, pet e cenário — de boné a coroa,
do gatinho ao Olhudo (o ciclope roxo). Comprou, já veste.

## Indicados oficiais

O modo "lista oficial" lê a tabela `tga_catalog`, semeada com os indicados de 2026 a partir da
Wikipedia (o site oficial bloqueia leitura automatizada). Confira a lista contra o site oficial
antes de abrir pro público.
