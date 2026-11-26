import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { supabase, errMsg, type CatalogCategory, type Pool } from '../lib/supabase'
import { sfx } from '../lib/sfx'
import { Loading, Panel, useToast } from '../components/ui'

type Mode = 'server' | 'user'
type Draft = { key: number; name: string; points: number; nominees: string }

const MAIN = ['Game of the Year', 'Best Game Direction', 'Best Narrative', 'Best Art Direction', 'Best Score and Music', 'Best Independent Game', 'Best Action / Adventure Game', 'Best RPG']

let seq = 1
const blank = (points: number): Draft => ({ key: seq++, name: '', points, nominees: '' })

function parseNominees(text: string) {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [title, ...rest] = l.split(/\s+[—-]\s+/)
      return { title: title.trim(), subtitle: rest.join(' — ').trim() }
    })
}

function ModeCard({ active, onClick, title, children }: { active: boolean; onClick: () => void; title: string; children: ReactNode }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={`relative p-5 text-left transition-transform ${active ? 'px-dialog -translate-y-1' : 'px-box hover:-translate-y-0.5'}`}
    >
      {active && <span className="absolute top-4 right-5 font-display text-2xl leading-none text-coin">▶ ok</span>}
      <span className={`block font-display text-3xl leading-none ${active ? 'text-coin' : ''}`}>{title}</span>
      <span className={`mt-3 block leading-snug ${active ? 'text-paper' : 'text-muted'}`}>{children}</span>
    </button>
  )
}

export default function NewPool() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [mode, setMode] = useState<Mode>('server')
  const [points, setPoints] = useState(10)
  const [lockAt, setLockAt] = useState('2026-12-10T21:00')
  const [catalog, setCatalog] = useState<CatalogCategory[] | null>(null)
  const [picked, setPicked] = useState<Set<number>>(new Set())
  const [drafts, setDrafts] = useState<Draft[]>([blank(10)])
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()
  const toast = useToast()

  useEffect(() => {
    supabase
      .from('tga_catalog')
      .select('*')
      .eq('year', 2026)
      .order('position')
      .then(({ data, error }) => {
        if (error) return toast(errMsg(error), 'err')
        const rows = (data ?? []) as CatalogCategory[]
        setCatalog(rows)
        setPicked(new Set(rows.filter((r) => MAIN.includes(r.category)).map((r) => r.id)))
      })
  }, [toast])

  const nomineeTotal = useMemo(
    () => catalog?.filter((c) => picked.has(c.id)).reduce((n, c) => n + c.nominees.length, 0) ?? 0,
    [catalog, picked],
  )

  const toggle = (id: number) => {
    sfx.select()
    setPicked((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }

  const updateDraft = (key: number, patch: Partial<Draft>) =>
    setDrafts((ds) => ds.map((d) => (d.key === key ? { ...d, ...patch } : d)))

  const importOfficial = (id: number) => {
    const c = catalog?.find((x) => x.id === id)
    if (!c) return
    sfx.select()
    const draft: Draft = {
      key: seq++,
      name: c.category,
      points,
      nominees: c.nominees.map((n) => (n.subtitle ? `${n.title} — ${n.subtitle}` : n.title)).join('\n'),
    }
    setDrafts((ds) => (ds.length === 1 && !ds[0].name && !ds[0].nominees ? [draft] : [...ds, draft]))
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (mode === 'server' && picked.size === 0) return toast('Marque pelo menos uma categoria.', 'err')
    const custom = drafts.map((d) => ({ name: d.name.trim(), points: d.points, nominees: parseNominees(d.nominees) }))
    if (mode === 'user') {
      const bad = custom.find((c) => !c.name || c.nominees.length < 2)
      if (bad) return toast(bad.name ? `"${bad.name}" precisa de pelo menos 2 indicados.` : 'Tem categoria sem nome.', 'err')
    }
    setBusy(true)
    const { data, error } = await supabase.rpc('create_pool', {
      p_name: name,
      p_description: description,
      p_mode: mode,
      p_lock_at: lockAt ? new Date(lockAt).toISOString() : null,
      p_points: points,
      p_catalog_ids: mode === 'server' ? [...picked] : [],
      p_custom: mode === 'user' ? custom : [],
    })
    setBusy(false)
    if (error) return toast(errMsg(error), 'err')
    sfx.win()
    toast('Bolão criado! Agora é só mandar o link.', 'coin')
    navigate(`/b/${(data as Pool).invite_code}`)
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-4xl space-y-10">
      <h1 className="font-display text-5xl leading-none text-paper drop-shadow-[3px_3px_0_#181020] sm:text-6xl">Novo bolão</h1>

      <Panel title="1 · Nome na porta">
        <div className="grid gap-5 sm:grid-cols-[1fr_1fr]">
          <label className="block">
            <span className="mb-2 block font-semibold">Nome do bolão</span>
            <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Bolão da firma 2026" minLength={3} maxLength={60} required />
          </label>
          <label className="block">
            <span className="mb-2 block font-semibold">Recado pros amigos <span className="font-normal text-muted">(opcional)</span></span>
            <input className="field" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Quem perder paga a pizza" maxLength={280} />
          </label>
        </div>
      </Panel>

      <Panel title="2 · De onde vêm os indicados?">
        <div role="radiogroup" className="grid gap-6 sm:grid-cols-2">
          <ModeCard active={mode === 'server'} onClick={() => { setMode('server'); sfx.select() }} title="Lista oficial 2026">
            O site já tem as categorias e os indicados deste ano. Você só marca quais entram.
          </ModeCard>
          <ModeCard active={mode === 'user'} onClick={() => { setMode('user'); sfx.select() }} title="Eu monto">
            Você escreve as categorias e os indicados. Serve pra categoria inventada, tipo "Pior trailer da noite".
          </ModeCard>
        </div>
      </Panel>

      {mode === 'server' ? (
        <Panel
          title="3 · Categorias"
          aside={
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn btn-paper btn-sm" onClick={() => catalog && setPicked(new Set(catalog.map((c) => c.id)))}>Todas</button>
              <button type="button" className="btn btn-paper btn-sm" onClick={() => catalog && setPicked(new Set(catalog.filter((r) => MAIN.includes(r.category)).map((r) => r.id)))}>Principais</button>
              <button type="button" className="btn btn-paper btn-sm" onClick={() => setPicked(new Set())}>Limpar</button>
            </div>
          }
        >
          {!catalog ? (
            <Loading />
          ) : (
            <>
              <p className="mb-4 text-muted">
                {picked.size} de {catalog.length} categorias · {nomineeTotal} indicados. Fonte: lista de 17/11/2026.
              </p>
              <ul className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
                {catalog.map((c) => {
                  const on = picked.has(c.id)
                  return (
                    <li key={c.id}>
                      <label className={`flex cursor-pointer items-start gap-3 px-2 py-2 ${on ? 'bg-paper-2' : 'hover:bg-paper-2/60'}`}>
                        <input type="checkbox" className="sr-only" checked={on} onChange={() => toggle(c.id)} />
                        <span aria-hidden className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center px-box-flat font-display text-xl leading-none ${on ? 'bg-grass text-paper' : 'bg-white'}`}>
                          {on ? '✓' : ''}
                        </span>
                        <span className="min-w-0">
                          <span className="block font-semibold leading-tight">{c.category}</span>
                          <span className="block truncate text-sm text-muted">{c.nominees.map((n) => n.title).join(' · ')}</span>
                        </span>
                      </label>
                    </li>
                  )
                })}
              </ul>
            </>
          )}
        </Panel>
      ) : (
        <Panel
          title="3 · Suas categorias"
          aside={
            catalog && (
              <select
                className="field w-auto py-2 text-base"
                value=""
                onChange={(e) => importOfficial(Number(e.target.value))}
                aria-label="Copiar uma categoria da lista oficial"
              >
                <option value="">Copiar da lista oficial…</option>
                {catalog.map((c) => <option key={c.id} value={c.id}>{c.category}</option>)}
              </select>
            )
          }
        >
          <div className="space-y-6">
            {drafts.map((d, i) => (
              <div key={d.key} className="border-4 border-dashed border-paper-3 p-4">
                <div className="grid gap-4 sm:grid-cols-[1fr_7rem_auto]">
                  <label className="block">
                    <span className="mb-2 block font-semibold">Categoria {i + 1}</span>
                    <input className="field" value={d.name} onChange={(e) => updateDraft(d.key, { name: e.target.value })} placeholder="Pior trailer da noite" maxLength={80} />
                  </label>
                  <label className="block">
                    <span className="mb-2 block font-semibold">Pontos</span>
                    <input className="field" type="number" min={1} max={1000} value={d.points} onChange={(e) => updateDraft(d.key, { points: Number(e.target.value) || 1 })} />
                  </label>
                  {drafts.length > 1 && (
                    <button type="button" className="btn btn-red btn-sm self-end" onClick={() => setDrafts((ds) => ds.filter((x) => x.key !== d.key))} aria-label={`Remover categoria ${i + 1}`}>
                      Tirar
                    </button>
                  )}
                </div>
                <label className="mt-4 block">
                  <span className="mb-2 block font-semibold">Indicados <span className="font-normal text-muted">— um por linha, "Jogo — Estúdio" se quiser</span></span>
                  <textarea
                    className="field min-h-36 resize-y leading-relaxed"
                    value={d.nominees}
                    onChange={(e) => updateDraft(d.key, { nominees: e.target.value })}
                    placeholder={'Hollow Knight: Silksong — Team Cherry\nGTA VI — Rockstar\nMais um adiamento — todo mundo'}
                  />
                </label>
              </div>
            ))}
            <button type="button" className="btn btn-paper btn-sm" onClick={() => { setDrafts((ds) => [...ds, blank(points)]); sfx.select() }}>
              + Outra categoria
            </button>
          </div>
        </Panel>
      )}

      <Panel title="4 · Regras">
        <div className="grid gap-6 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block font-semibold">Pontos por acerto</span>
            <input className="field" type="number" min={1} max={1000} value={points} onChange={(e) => setPoints(Number(e.target.value) || 1)} />
            <span className="mt-2 block text-sm text-muted">Cada ponto vira 1 moeda no fim. Pódio ganha bônus de 100/50/25.</span>
          </label>
          <label className="block">
            <span className="mb-2 block font-semibold">Palpites fecham em</span>
            <input className="field" type="datetime-local" value={lockAt} onChange={(e) => setLockAt(e.target.value)} />
            <span className="mt-2 block text-sm text-muted">Ajuste pro início da cerimônia no seu fuso. Você também pode fechar na mão.</span>
          </label>
        </div>
      </Panel>

      <div className="flex justify-end">
        <button type="submit" className="btn btn-green text-3xl" disabled={busy}>
          {busy ? 'Criando...' : 'Criar bolão'}
        </button>
      </div>
    </form>
  )
}
