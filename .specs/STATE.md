# STATE

## Decisions

| ID | Decisão | Motivo | Status | Data |
|---|---|---|---|---|
| AD-001 | Slice = menor incremento de feature completo e demonstrável ponta a ponta (todas as camadas envolvidas); nunca separar slice só por camada | card de PM tem que ser entrega completa (pm-handoff) | active | 2026-11-26 |
| AD-002 | Discovery em modo degradado (sem tlc-discover); specs manuais em `.specs/` | usuário recusou instalar as skills TLC via npx | active | 2026-11-26 |
| AD-003 | Personagem é criado **no cadastro**, não ao entrar no bolão | o personagem é a identidade global do jogador; cosméticos da loja valem em todos os bolões; um personagem por bolão fragmentaria a recompensa | active | 2026-11-26 |
| AD-004 | Modo "servidor" lê de `tga_catalog` (semeado com os indicados de 2026 tirados da Wikipedia, rev. 20/11/2026) | thegameawards.com responde 403 a fetch automatizado; scraping fica pro S7 | active | 2026-11-26 |
| AD-005 | Toda regra de dinheiro/pontos roda em funções `security definer` no Postgres (`buy_item`, `finish_pool`, `set_winner`); cliente não pode escrever `coins` | evitar trapaça pelo client | active | 2026-11-26 |
| AD-006 | Palpites dos outros só ficam visíveis depois que o bolão bloqueia | evitar cópia de palpite | active | 2026-11-26 |
| AD-007 | Moedas: 150 iniciais; ao encerrar, cada jogador ganha moedas = pontos; pódio +100/+50/+25 | economia simples, todo mundo compra algo | active | 2026-11-26 |
| AD-008 | Git iniciado; commits livres sem pedir aprovação (preferência do usuário) | escolha do usuário | active | 2026-11-26 |
| AD-009 | Direção visual: céu NES azul, painéis creme com borda preta de pixel e sombra dura, ouro de moeda; fontes Jersey 10 (display) + Pixelify Sans (texto) | 8-bit "de verdade" e longe do roxo/dark genérico | active | 2026-11-26 |

## Handoff
- Fase atual: Discovery (manual) → construção direta dos slices S1–S6, sem loop (execução única, autor sozinho).
- Harness: gates computacionais = `npm run build` (tsc + vite) + `get_advisors` do Supabase (security) + teste manual no navegador.
- Pareamento de categorias do catálogo veio de uma inferência sobre a Wikipedia — revisar contra o site oficial.
