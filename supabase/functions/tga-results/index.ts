// Edge Function `tga-results`: lê a página da Wikipédia do The Game Awards do ano, acha o vencedor
// de cada categoria (linha em negrito com {{double-dagger}}) e manda pro banco via
// ingest_official_results, que só confirma um vencedor visto igual em duas leituras.
//
//   GET/POST /tga-results            → roda de verdade (ano atual), no máximo 1x a cada 50 s
//   ?year=2025&dry=1                 → só mostra o que leu, sem gravar (pra testar o parser)
import { createClient } from 'npm:@supabase/supabase-js@2'

const UA = 'SweetPollBot/1.0 (bolao de amigos; leitura a cada 2 min na noite do evento)'

type Parsed = { header: string; winner: string; title: string }

// ───────── limpeza de wikitext ─────────

/** Troca templates {{...}} (com aninhamento) por texto: color/nowrap viram o conteúdo, o resto some. */
function stripTemplates(s: string): string {
  let out = ''
  let i = 0
  while (i < s.length) {
    if (s.startsWith('{{', i)) {
      let depth = 0
      let j = i
      for (; j < s.length; j++) {
        if (s.startsWith('{{', j)) { depth++; j++ }
        else if (s.startsWith('}}', j)) { depth--; j++; if (depth === 0) break }
      }
      const inner = s.slice(i + 2, j - 1)
      const parts = inner.split('|')
      const name = parts[0].trim().toLowerCase()
      if (name === 'color' || name === 'colour') out += stripTemplates(parts.slice(2).join('|'))
      else if (name === 'nowrap' || name === 'nobr') out += stripTemplates(parts.slice(1).join('|'))
      // {{ill|Nome em inglês|ru|Nome}}: link interlíngua, o texto é o 1º parâmetro
      else if (name === 'ill' || name === 'interlanguage link') out += stripTemplates(parts[1] ?? '')
      else if (name === '--)') out += ')'
      else if (name === "'") out += "'"
      i = j + 1
    } else {
      out += s[i]
      i++
    }
  }
  return out
}

function clean(s: string): string {
  let t = s
    .replace(/<ref[^>]*\/>/g, '')
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, '')
  t = stripTemplates(t)
  t = t
    .replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, '$1')
    .replace(/'{2,}/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
  return t.trim()
}

const norm = (s: string) =>
  s.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
// nomes que a Wikipédia escreve diferente do catálogo
const ALIAS: Record<string, string> = {
  'best role playing game': 'best rpg',
  'best roleplaying game': 'best rpg',
  'best rpg game': 'best rpg',
}
const catKey = (s: string) => { const k = norm(s); return ALIAS[k] ?? k }
const tokens = (s: string) => new Set(norm(s).split(' ').filter((w) => w && !['the', 'of', 'a', 'and', 'de', 'da', 'do'].includes(w)))

// ───────── parser da tabela de premiados ─────────

export function parseWinners(wikitext: string): Parsed[] {
  // antes da cerimônia a seção se chama "Nominees"; na noite vira "Winners and nominees"
  const head = wikitext.match(/\n==[^=\n]*nominees[^=\n]*==/i)
  if (!head || head.index === undefined) return []
  const rest = wikitext.slice(head.index + head[0].length)
  const end = rest.search(/\n==[^=]/)
  const section = end < 0 ? rest : rest.slice(0, end)

  const out: Parsed[] = []
  let headers: string[] = []
  let lastWasHeader = false
  let cells: string[][] = []

  const flush = () => {
    cells.forEach((lines, idx) => {
      const header = headers[idx]
      if (!header) return
      const dagger = lines.filter((l) => /double-dagger/i.test(l))
      const bold = lines.filter((l) => /^\*[^*]/.test(l) && /'''/.test(l))
      const pick = dagger.length === 1 ? dagger[0] : dagger.length === 0 && bold.length === 1 ? bold[0] : null
      if (!pick) return
      const winner = clean(pick.replace(/^\*+/, ''))
      const title = winner.split(/\s[–—-]\s/)[0].trim()
      out.push({ header, winner, title })
    })
    cells = []
  }

  for (const raw of section.split('\n')) {
    const line = raw.trim()
    if (line.startsWith('{|') || line.startsWith('|}')) { flush(); headers = []; lastWasHeader = false; continue }
    if (line.startsWith('|-')) continue
    if (line.startsWith('!')) {
      if (!lastWasHeader) { flush(); headers = [] }
      const body = line.slice(1)
      const m = body.match(/^\s*(?:style|scope|colspan|rowspan|class|width|valign)\b[^|[]*\|(.*)$/i)
      headers.push(clean(m ? m[1] : body))
      lastWasHeader = true
      continue
    }
    if (line.startsWith('|') && !line.startsWith('|+')) {
      lastWasHeader = false
      cells.push([])
      const after = line.replace(/^\|\s*(?:valign|style|colspan|rowspan)[^|]*\|/i, '').replace(/^\|/, '').trim()
      if (after) cells[cells.length - 1].push(after)
      continue
    }
    if (line.startsWith('*') && cells.length) cells[cells.length - 1].push(line)
  }
  flush()
  return out
}

// ───────── casa com o catálogo ─────────

type CatalogRow = { id: number; category: string; nominees: { title: string; subtitle: string }[] }

type Match = { title: string; subtitle: string }

function matchNominee(row: CatalogRow, p: Parsed): Match | null {
  const bt = tokens(p.title)
  const bf = tokens(p.winner)
  const score = (a: Set<string>) => {
    if (!a.size) return 0
    const hitT = [...a].filter((w) => bt.has(w)).length
    const hitF = [...a].filter((w) => bf.has(w)).length
    const s1 = bt.size ? hitT / Math.min(a.size, bt.size) : 0
    const s2 = hitF / a.size
    return Math.max(s1, s2)
  }
  const scored = row.nominees.map((n) => {
    // "Fallout — 2ª temporada" / "Resident Evil (2026)": compara também só o nome principal
    const base = n.title.split(/\s[—–-]\s|\s\(/)[0]
    return { n, score: Math.max(score(tokens(n.title)), score(tokens(base))) }
  }).sort((x, y) => y.score - x.score)
  const top = scored[0]
  if (!top || top.score < 0.6) return null
  const tied = scored.filter((s) => s.score === top.score)
  if (tied.length === 1) return { title: top.n.title, subtitle: top.n.subtitle }
  // mesmo nome duas vezes (ex.: Team Falcons no CS2 e no Rocket League): desempata pelo subtítulo
  const bySub = tied
    .map((s) => {
      const st = tokens(s.n.subtitle)
      return { n: s.n, sub: st.size ? [...st].filter((w) => bf.has(w)).length / st.size : 0 }
    })
    .sort((x, y) => y.sub - x.sub)
  if (bySub[0].sub > 0 && (bySub.length < 2 || bySub[1].sub < bySub[0].sub)) {
    return { title: bySub[0].n.title, subtitle: bySub[0].n.subtitle }
  }
  return null // empate de verdade: não chuta
}

// ───────── handler ─────────

// o botão "Ler agora" do painel do host chama direto do navegador
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  const res = await handle(req)
  for (const [k, v] of Object.entries(CORS)) res.headers.set(k, v)
  return res
})

async function handle(req: Request): Promise<Response> {
  const url = new URL(req.url)
  const year = Number(url.searchParams.get('year')) || new Date().getUTCFullYear()
  const dry = url.searchParams.get('dry') === '1'
  const page = `The_Game_Awards_${year}`

  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  if (!dry) {
    const { data: s } = await db.from('tga_sync').select('last_run_at').eq('year', year).maybeSingle()
    if (s?.last_run_at && Date.now() - new Date(s.last_run_at).getTime() < 50_000) {
      return Response.json({ skipped: 'rodou há menos de 50 s' })
    }
  }

  let parsed: Parsed[]
  // teste: em modo dry dá pra mandar um wikitext no corpo do POST pra simular a noite da cerimônia
  if (dry && req.method === 'POST') {
    const body = await req.text()
    if (body) {
      parsed = parseWinners(body)
      const { data: catalog } = await db.from('tga_catalog').select('id, category, nominees').eq('year', year)
      const byKey = new Map(((catalog ?? []) as CatalogRow[]).map((c) => [catKey(c.category), c]))
      const res = parsed.map((p) => {
        const row = byKey.get(catKey(p.header))
        return { ...p, catalog: row?.category ?? null, match: row ? matchNominee(row, p) : null }
      })
      return Response.json({ simulated: true, results: res })
    }
  }
  try {
    const api = `https://en.wikipedia.org/w/api.php?action=parse&page=${page}&prop=wikitext&format=json&formatversion=2`
    const r = await fetch(api, { headers: { 'User-Agent': UA } })
    if (!r.ok) throw new Error(`Wikipedia respondeu ${r.status}`)
    const j = await r.json()
    if (j.error) throw new Error(`Wikipedia: ${j.error.info ?? j.error.code}`)
    parsed = parseWinners(j.parse.wikitext as string)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (!dry) await db.rpc('ingest_official_results', { p_year: year, p_winners: [], p_error: msg })
    return Response.json({ error: msg }, { status: 502 })
  }

  const { data: catalog } = await db.from('tga_catalog').select('id, category, nominees').eq('year', year)
  const byKey = new Map(((catalog ?? []) as CatalogRow[]).map((c) => [catKey(c.category), c]))

  const winners: { catalog_id: number; title: string; subtitle: string }[] = []
  const unmatched: (Parsed & { reason: string })[] = []
  for (const p of parsed) {
    const row = byKey.get(catKey(p.header))
    if (!row) { unmatched.push({ ...p, reason: 'categoria fora do catálogo' }); continue }
    const m = matchNominee(row, p)
    if (!m) { unmatched.push({ ...p, reason: 'indicado não reconhecido' }); continue }
    winners.push({ catalog_id: row.id, ...m })
  }

  if (dry) return Response.json({ year, page, parsed, winners, unmatched })

  const { data, error } = await db.rpc('ingest_official_results', { p_year: year, p_winners: winners })
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ year, read: parsed.length, matched: winners.length, unmatched: unmatched.length, ...data })
}
