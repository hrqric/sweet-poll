# Bolão GOTY

Bolão do The Game Awards com cara de jogo de NES. Uma pessoa cria o bolão, escolhe as
categorias (lista oficial do ano ou escritas à mão), manda o link e todo mundo palpita.
Na noite da cerimônia o host marca os vencedores — o ranking atualiza ao vivo — e, ao
encerrar, cada acerto vira moeda pra gastar em roupa, chapéu, pet e cenário pro boneco 8-bit.

## Rodar

```powershell
cd app
copy .env.example .env.local   # preencha URL e publishable key do Supabase
npm install
npm run dev
```

## Estrutura

| Pasta | O que tem |
|---|---|
| `app/` | Vite + React + TS + Tailwind v4 |
| `app/src/lib/sprites.ts` | motor de sprites: cada parte do boneco e cada item é uma matriz de pixels |
| `app/src/pages/` | Title, Login, CharacterCreator, Hub, NewPool, Pool (sala), Shop |
| `supabase/migrations/` | schema, RLS, RPCs (`create_pool`, `join_pool`, `save_pick`, `set_winner`, `finish_pool`, `buy_item`), seeds |
| `.specs/` | discovery, roadmap e decisões (`STATE.md`) |

## Regras do jogo

- 150 moedas de boas-vindas.
- Ao encerrar: moedas = pontos feitos, + 100 / 50 / 25 pro pódio (se pontuou).
- Palpites fecham no horário definido pelo host, quando ele fecha na mão, ou quando marca o primeiro vencedor.
- Ninguém vê o palpite dos outros até os palpites fecharem.
- Toda regra de moeda/ponto roda no Postgres (`security definer`); o cliente não consegue escrever `coins`.

## Indicados oficiais

O modo "lista oficial" lê a tabela `tga_catalog`, semeada com os indicados de 2026 a partir da
Wikipedia (o site oficial bloqueia leitura automatizada). Confira a lista contra o site oficial
antes de abrir pro público.
