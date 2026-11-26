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
| AD-011 | Vencedores oficiais lidos da Wikipédia (Edge Function + pg_cron a cada 2 min em 10–12/dez UTC), confirmados após 2 leituras iguais (≥ 90 s), aplicados nos bolões com auto_results; marcação manual do host prevalece | site oficial bloqueia leitura (403); a página da Wikipédia teve 95 edições ao vivo no TGA 2025 e vandalismo revertido em < 1 min | active | 2026-11-26 |
| AD-010 | Pontuação por bolão: flat / custom / dynamic. Dinâmica = base × multiplicador 1–2 pela entropia normalizada dos palpites do grupo (ln(min(palpites, indicados))), calculado só ao fechar palpites | não há fonte pública confiável de "dificuldade" (odds são pagas/bloqueadas); a divisão do próprio grupo é verificável e não vaza palpites, que só ficam visíveis após o fechamento (AD-006) | active | 2026-11-26 |

## Handoff
- 2026-11-26: S1–S5 entregues e testados ponta a ponta no navegador (cadastro → boneco → criar bolão oficial → palpites → amigo entra/palpita via RPC → host marca vencedores → encerrar → moedas → compra na loja). S6 (revisão ui-humanizer por tela) em andamento.
- Contas de teste em `supabase/seed/test-users.md` — apagar antes de produção.
- Bolão de teste `00CCB2` (encerrado) existe no banco dev.
- Fase atual: Discovery (manual) → construção direta dos slices S1–S6, sem loop (execução única, autor sozinho).
- Harness: gates computacionais = `npm run build` (tsc + vite) + `get_advisors` do Supabase (security) + teste manual no navegador.
- Pareamento de categorias do catálogo veio de uma inferência sobre a Wikipedia — revisar contra o site oficial.
