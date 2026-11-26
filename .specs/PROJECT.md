# GOTY Poll — bolão do The Game Awards (8-bit)

> Discovery feita em **modo degradado** (sem `tlc-discover` instalada; escolha do usuário em 2026-11-26).

## Visão
Um site onde uma pessoa cria um bolão do The Game Awards, escolhe as categorias,
compartilha um link com os amigos e todo mundo palpita. Quando a premiação acontece,
o dono marca os vencedores, o ranking fecha e cada acerto vira moeda. As moedas
compram cosméticos 8-bit numa lojinha pra customizar o personagem de cada jogador.

## Público
Grupos de amigos que assistem o TGA juntos (Discord, WhatsApp). Uso concentrado
entre o anúncio dos indicados (nov) e a cerimônia (10 dez 2026).

## Escopo v1 (este ciclo)
1. Conta (Supabase Auth, e-mail + senha) com nome de jogador.
2. Criação de personagem 8-bit **no cadastro** (AD-003).
3. Criar bolão com dois modos de indicados:
   - **Servidor**: escolhe categorias do catálogo oficial do ano (tabela `tga_catalog`).
   - **Usuário**: escreve categorias e indicados à mão.
4. Convite por código/link, entrar no bolão, palpitar até o bloqueio.
5. Dono marca vencedores, encerra → pontuação + moedas.
6. Ranking com os personagens.
7. Loja (comprar) + inventário (equipar) de cosméticos 8-bit.

## Fora do escopo v1
- Scraping automático do site oficial (bloqueia com 403) — catálogo é semeado no banco (AD-004).
- Pagamento real, chat, notificações push, login social.

## Stack
Vite + React + TypeScript, Tailwind CSS v4, React Router, Motion, Supabase (Postgres + Auth + RLS + RPC).
Sprites desenhados em código (matrizes de pixels → SVG), sem assets externos.
