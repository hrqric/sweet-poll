import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import { motion } from 'motion/react'
import { useAuth } from '../lib/auth'
import {
  supabase, errMsg, picksOpen, catValue,
  type CatalogCategory, type Category, type Member, type Pick, type Pool, type PoolPreview,
} from '../lib/supabase'
import { sfx } from '../lib/sfx'
import { Head, Sprite } from '../components/Sprite'
import { Coins, CoinIcon, Loading, Modal, Ord, STATUS_TAG, Tag, TrophyIcon, useToast } from '../components/ui'

/** Copia texto; se a Clipboard API falhar (http, permissão, iframe), cai no execCommand. */
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    let ok = false
    try { ok = document.execCommand('copy') } catch { ok = false }
    ta.remove()
    return ok
  }
}

// ───────────────────────── convite / entrada ─────────────────────────

export default function PoolPage() {
  const { code = '' } = useParams()
  const { session, profile, loading } = useAuth()
  const [preview, setPreview] = useState<PoolPreview | null | undefined>(undefined)
  const [joining, setJoining] = useState(false)
  const toast = useToast()

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc('pool_preview', { p_code: code })
    if (error) toast(errMsg(error), 'err')
    setPreview(((data as PoolPreview[] | null) ?? [])[0] ?? null)
  }, [code, toast])

  useEffect(() => {
    if (!loading) load()
  }, [load, loading, session?.user.id])

  if (loading || preview === undefined) return <Loading />
  if (preview === null)
    return (
      <div className="px-dialog mx-auto max-w-lg p-8 text-center">
        <p className="font-display text-4xl text-coin">Game over</p>
        <p className="mt-3 text-lg">Nenhum bolão com o código <strong>{code.toUpperCase()}</strong>. Confere o link?</p>
        <Link to="/hub" className="btn btn-paper btn-sm mt-6">Voltar</Link>
      </div>
    )

  if (session && profile && !profile.avatar)
    return <Navigate to={`/personagem?next=${encodeURIComponent(`/b/${code}`)}`} replace />

  if (!session || !preview.is_member) {
    const join = async () => {
      setJoining(true)
      const { error } = await supabase.rpc('join_pool', { p_code: code })
      setJoining(false)
      if (error) return toast(errMsg(error), 'err')
      sfx.win()
      toast('Você entrou no bolão!')
      load()
    }
    return (
      <div className="mx-auto max-w-2xl">
        <div className="px-dialog p-7 sm:p-9">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            <div className="shrink-0 bg-sky-pale px-box-flat">
              <Sprite avatar={preview.owner_avatar} size={110} bob />
            </div>
            <div>
              <p className="font-display text-2xl leading-none text-coin">{preview.owner_username} te chamou pra</p>
              <h1 className="mt-2 font-display text-5xl leading-none">{preview.name}</h1>
              {preview.description && <p className="mt-3 text-lg">"{preview.description}"</p>}
              <p className="mt-4 text-paper-3">
                {preview.member_count} {preview.member_count === 1 ? 'jogador' : 'jogadores'} · {preview.category_count} categorias ·{' '}
                {preview.mode === 'server' ? 'indicados oficiais' : 'categorias da casa'}
              </p>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap gap-4">
            {preview.status === 'finished' ? (
              <p className="font-display text-2xl text-[#fc9c8c]">Esse bolão já acabou.</p>
            ) : session ? (
              <button type="button" className="btn btn-green text-3xl" onClick={join} disabled={joining}>
                {joining ? 'Entrando...' : 'Entrar no bolão'}
              </button>
            ) : (
              <>
                <Link to={`/entrar?modo=novo&next=${encodeURIComponent(`/b/${code}`)}`} className="btn btn-green">Criar conta e jogar</Link>
                <Link to={`/entrar?next=${encodeURIComponent(`/b/${code}`)}`} className="btn btn-paper">Já tenho conta</Link>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  return <PoolRoom poolId={preview.id} />
}

// ───────────────────────── sala do bolão ─────────────────────────

type Tab = 'picks' | 'ranking' | 'host'

type Standing = { member: Member; score: number; hits: number; rank: number }

function standings(members: Member[], cats: Category[], picks: Pick[], finished: boolean): Standing[] {
  if (finished) {
    return members
      .map((m) => ({ member: m, score: m.score, hits: m.hits, rank: m.rank ?? 0 }))
      .sort((a, b) => a.rank - b.rank)
  }
  const winners = new Map(cats.filter((c) => c.winner_nominee_id).map((c) => [c.id, c]))
  const rows = members.map((m) => {
    let score = 0, hits = 0
    picks.forEach((p) => {
      const c = winners.get(p.category_id)
      if (p.user_id === m.user_id && c && c.winner_nominee_id === p.nominee_id) {
        score += catValue(c)
        hits++
      }
    })
    return { member: m, score, hits, rank: 0 }
  })
  rows.sort((a, b) => b.score - a.score)
  rows.forEach((r, i) => (r.rank = i > 0 && rows[i - 1].score === r.score ? rows[i - 1].rank : i + 1))
  return rows
}

function PoolRoom({ poolId }: { poolId: string }) {
  const { profile, refreshProfile } = useAuth()
  const [pool, setPool] = useState<Pool | null>(null)
  const [cats, setCats] = useState<Category[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [picks, setPicks] = useState<Pick[]>([])
  const [tab, setTab] = useState<Tab>('picks')
  const toast = useToast()

  const reload = useCallback(async () => {
    const [p, c, m, k] = await Promise.all([
      supabase.from('pools').select('*').eq('id', poolId).single(),
      supabase.from('pool_categories').select('*, pool_nominees!pool_nominees_category_id_fkey(*)').eq('pool_id', poolId).order('position'),
      supabase.from('pool_members').select('*, profiles(username, avatar)').eq('pool_id', poolId),
      supabase.from('picks').select('*').eq('pool_id', poolId),
    ])
    const err = p.error || c.error || m.error || k.error
    if (err) return toast(errMsg(err), 'err')
    setPool(p.data as Pool)
    setCats(((c.data ?? []) as Category[]).map((x) => ({
      ...x,
      // numeric do Postgres pode chegar como string
      multiplier: x.multiplier == null ? null : Number(x.multiplier),
      pool_nominees: [...x.pool_nominees].sort((a, b) => a.position - b.position),
    })))
    setMembers((m.data ?? []) as Member[])
    setPicks((k.data ?? []) as Pick[])
  }, [poolId, toast])

  useEffect(() => {
    reload()
    // vencedores aparecem ao vivo durante a cerimônia
    const ch = supabase
      .channel(`pool-${poolId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pool_categories', filter: `pool_id=eq.${poolId}` }, () => reload())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pools', filter: `id=eq.${poolId}` }, () => { reload(); refreshProfile() })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [poolId, reload, refreshProfile])

  const open = pool ? picksOpen(pool) : false
  const finished = pool?.status === 'finished'
  const isHost = !!pool && pool.owner_id === profile?.id
  const myPicks = useMemo(() => new Map(picks.filter((p) => p.user_id === profile?.id).map((p) => [p.category_id, p.nominee_id])), [picks, profile])
  const table = useMemo(() => standings(members, cats, picks, finished), [members, cats, picks, finished])
  const me = members.find((m) => m.user_id === profile?.id)

  // bolão encerrado abre direto no pódio: é o momento que todo mundo veio ver
  const landed = useRef(false)
  useEffect(() => {
    if (!pool || landed.current) return
    landed.current = true
    if (pool.status === 'finished') setTab('ranking')
  }, [pool])

  if (!pool || !profile) return <Loading />

  const statusKey = pool.status === 'open' && !open ? 'locked' : pool.status
  const link = `${window.location.origin}/b/${pool.invite_code}`

  return (
    <div>
      <header className="mb-8 flex flex-wrap items-end justify-between gap-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Tag color={STATUS_TAG[statusKey].color}>{STATUS_TAG[statusKey].label}</Tag>
            {pool.lock_at && open && (
              <Tag color="#3a3046">fecha {new Date(pool.lock_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</Tag>
            )}
            <Tag color="#3c6ad8">{SCORING_LABEL[pool.scoring]}</Tag>
          </div>
          <h1 className="mt-3 font-display text-5xl leading-[0.9] text-paper drop-shadow-[3px_3px_0_#181020] sm:text-6xl">{pool.name}</h1>
          {pool.description && <p className="mt-2 max-w-xl text-lg">{pool.description}</p>}
        </div>
        <div className="px-box flex items-center gap-3 p-3">
          <div>
            <p className="text-sm text-muted">Convite</p>
            <p className="font-display text-3xl leading-none tracking-[0.15em]">{pool.invite_code}</p>
          </div>
          <button
            type="button"
            className="btn btn-sm"
            onClick={async () => {
              if (await copyText(link)) {
                toast('Link copiado!')
                sfx.select()
              } else {
                toast(`Não deu pra copiar. O link é ${link}`, 'err')
              }
            }}
          >
            Copiar link
          </button>
        </div>
      </header>

      {finished && me && <FinishBanner me={me} total={members.length} />}

      <nav className="mb-8 flex gap-1 border-b-4 border-ink sm:gap-2" role="tablist">
        {([['picks', 'Palpites'], ['ranking', 'Ranking'], ...(isHost ? [['host', 'Painel do host']] : [])] as [Tab, string][]).map(([t, label]) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => { setTab(t); sfx.select() }}
            className={`-mb-1 border-4 border-b-0 px-3 pt-2 pb-2.5 font-display text-xl leading-none whitespace-nowrap sm:px-4 sm:text-2xl ${
              tab === t ? 'border-ink bg-paper' : 'border-transparent text-ink hover:bg-paper/50'
            }`}
          >
            {t === 'host' ? <><span className="sm:hidden">Host</span><span className="hidden sm:inline">{label}</span></> : label}
            {t === 'picks' && open && (
              <span className={`ml-2 text-lg ${myPicks.size < cats.length ? 'text-red' : 'text-grass-dark'}`}>{myPicks.size}/{cats.length}</span>
            )}
          </button>
        ))}
      </nav>

      {tab === 'picks' && (
        <PicksTab cats={cats} picks={picks} myPicks={myPicks} members={members} open={open} finished={finished} meId={profile.id} dynamic={pool.scoring === 'dynamic'}
          onPicked={(catId, nomId) => setPicks((ps) => [...ps.filter((p) => !(p.user_id === profile.id && p.category_id === catId)), { pool_id: pool.id, user_id: profile.id, category_id: catId, nominee_id: nomId }])}
        />
      )}
      {tab === 'ranking' && <RankingTab table={table} open={open} finished={finished} cats={cats} meId={profile.id} />}
      {tab === 'host' && isHost && <HostTab pool={pool} cats={cats} open={open} onChange={reload} onFinished={async () => { await reload(); await refreshProfile(); setTab('ranking') }} />}
    </div>
  )
}

// ───────────────────────── palpites ─────────────────────────

const SCORING_LABEL = { flat: 'pontos iguais', custom: 'pontos por categoria', dynamic: 'pontuação dinâmica' } as const

/** Valor da categoria no cabeçalho do card; no modo dinâmico mostra o multiplicador (ou "×?" antes de fechar). */
function CatPoints({ c, dynamic }: { c: Category; dynamic: boolean }) {
  if (!dynamic) return <span className="font-display text-2xl leading-none">{c.points} pts</span>
  if (c.multiplier == null) {
    return (
      <span className="font-display text-2xl leading-none" title="O multiplicador sai quando os palpites fecharem">
        {c.points} pts <span className="text-muted">×?</span>
      </span>
    )
  }
  return (
    <span className="font-display text-2xl leading-none" title={`${c.points} pts base × ${c.multiplier.toFixed(2)}`}>
      {catValue(c)} pts <span className="text-xl text-muted">×{c.multiplier.toFixed(1)}</span>
    </span>
  )
}

function PicksTab({
  cats, picks, myPicks, members, open, finished, meId, dynamic, onPicked,
}: {
  cats: Category[]; picks: Pick[]; myPicks: Map<string, string>; members: Member[]; open: boolean; finished: boolean; meId: string
  dynamic: boolean
  onPicked: (cat: string, nom: string) => void
}) {
  const toast = useToast()
  const [saving, setSaving] = useState<string | null>(null)
  const byUser = useMemo(() => new Map(members.map((m) => [m.user_id, m])), [members])

  async function choose(cat: Category, nomId: string) {
    if (!open || saving === cat.id) return
    setSaving(cat.id)
    const { error } = await supabase.rpc('save_pick', { p_category: cat.id, p_nominee: nomId })
    setSaving(null)
    if (error) return toast(errMsg(error), 'err')
    sfx.select()
    onPicked(cat.id, nomId)
  }

  return (
    <>
      {open && dynamic && (
        <p className="px-box mb-8 px-5 py-4 leading-snug">
          <strong>Pontuação dinâmica:</strong> quando os palpites fecharem, cada categoria ganha um multiplicador de ×1 a ×2.
          Se a galera inteira apostar no mesmo indicado, fica ×1. Quanto mais dividido o grupo, mais vale acertar.
        </p>
      )}
      {!open && (
        <p className="px-dialog mb-8 px-5 py-4 text-lg leading-snug">
          {finished ? (
            <>Fim de papo. <span className="text-coin">Amarelo</span> é quem levou, <span className="text-coin">▶</span> é o seu palpite.</>
          ) : (
            <>Palpites travados. Agora é torcer: cada carinha mostra quem apostou em quem.</>
          )}
        </p>
      )}
      <ol className="grid gap-8 md:grid-cols-2">
        {cats.map((c, idx) => {
          const mine = myPicks.get(c.id)
          const winner = c.winner_nominee_id
          const hit = winner && mine === winner
          return (
            <li key={c.id} className="px-box flex flex-col">
              <header className="flex items-start justify-between gap-3 border-b-4 border-ink bg-paper-2 px-4 pt-3 pb-3">
                <h3 className="min-w-0 font-display text-3xl leading-[0.95]">
                  <span className="mr-2 text-muted">{idx + 1}.</span>
                  {c.name}
                </h3>
                <div className="shrink-0 text-right">
                  <CatPoints c={c} dynamic={dynamic} />
                  {winner && mine && (
                    <span className={`mt-1 block font-display text-xl leading-none ${hit ? 'text-grass-dark' : 'text-red'}`}>
                      {hit ? 'Acertou!' : 'Errou'}
                    </span>
                  )}
                  {!mine && open && <span className="mt-1 block text-sm text-red">sem palpite</span>}
                </div>
              </header>
              <ul className="flex-1 p-2" role="radiogroup" aria-label={c.name}>
                {c.pool_nominees.length === 0 && (
                  <li className="px-3 py-2.5 text-muted">O host ainda vai colocar os indicados.</li>
                )}
                {c.pool_nominees.map((n) => {
                  const chosen = mine === n.id
                  const isWinner = winner === n.id
                  const backers = open ? [] : picks.filter((p) => p.nominee_id === n.id)
                  return (
                    <li key={n.id}>
                      <button
                        type="button"
                        role="radio"
                        aria-checked={chosen}
                        disabled={!open}
                        onClick={() => choose(c, n.id)}
                        className={`group flex w-full items-center gap-3 px-3 py-2.5 text-left ${
                          isWinner ? 'bg-coin' : chosen ? 'bg-ink text-paper' : open ? 'hover:bg-paper-2' : ''
                        } ${!open ? 'cursor-default' : ''}`}
                      >
                        <span aria-hidden className={`w-5 shrink-0 font-display text-2xl leading-none ${chosen ? (isWinner ? 'text-ink' : 'text-coin') : open ? 'text-transparent group-hover:text-muted' : 'text-transparent'}`}>
                          ▶
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block leading-tight font-semibold">{n.title}</span>
                          {n.subtitle && <span className={`block truncate text-sm ${chosen && !isWinner ? 'text-paper-3' : 'text-muted'}`}>{n.subtitle}</span>}
                        </span>
                        {isWinner && (
                          <span className="flex shrink-0 items-center gap-1.5 font-display text-xl leading-none">
                            <TrophyIcon size={20} />
                            <span className="sr-only sm:not-sr-only">levou</span>
                          </span>
                        )}
                        {backers.length > 0 && (
                          <span className="flex shrink-0 -space-x-2" title={backers.map((b) => byUser.get(b.user_id)?.profiles.username).join(', ')}>
                            {backers.slice(0, 4).map((b) => (
                              <span key={b.user_id} className={`bg-sky-pale ${b.user_id === meId ? 'ring-2 ring-coin' : ''}`}>
                                <Head avatar={byUser.get(b.user_id)?.profiles.avatar} size={22} />
                              </span>
                            ))}
                            {backers.length > 4 && <span className="pl-3 font-display text-lg leading-none">+{backers.length - 4}</span>}
                          </span>
                        )}
                        {saving === c.id && chosen && <span className="anim-blink font-display">...</span>}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </li>
          )
        })}
      </ol>
    </>
  )
}

// ───────────────────────── ranking ─────────────────────────

const PODIUM = [
  { place: 2, h: 'h-20', color: '#bcbcbc' },
  { place: 1, h: 'h-32', color: '#f8b800' },
  { place: 3, h: 'h-14', color: '#c87c3c' },
]

function RankingTab({ table, open, finished, cats, meId }: { table: Standing[]; open: boolean; finished: boolean; cats: Category[]; meId: string }) {
  const decided = cats.filter((c) => c.winner_nominee_id).length
  if (open) {
    return (
      <div className="space-y-6">
        <p className="px-dialog px-5 py-4 text-lg leading-snug">
          O placar liga quando os palpites fecharem. Na sala até agora: {table.length} {table.length === 1 ? 'jogador' : 'jogadores'}.
        </p>
        <ul className="flex flex-wrap gap-6">
          {table.map(({ member }) => (
            <li key={member.user_id} className="flex flex-col items-center">
              <div className="bg-sky-pale px-box-flat"><Sprite avatar={member.profiles.avatar} size={72} /></div>
              <span className={`mt-2 max-w-24 truncate font-display text-xl leading-none ${member.user_id === meId ? 'text-paper drop-shadow-[2px_2px_0_#181020]' : ''}`}>{member.profiles.username}</span>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  const top = PODIUM.map((p) => ({ ...p, row: table[p.place - 1] }))

  return (
    <div className="space-y-10">
      <p className="font-display text-3xl leading-none text-paper drop-shadow-[3px_3px_0_#181020]">
        {finished ? 'Placar final' : `${decided} de ${cats.length} categorias reveladas`}
      </p>
      <div className="flex items-end justify-center gap-3 sm:gap-6">
        {top.map(({ place, h, color, row }) => (
          <motion.div
            key={place}
            className="flex w-24 flex-col items-center sm:w-36"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: (3 - place) * 0.15, type: 'tween' }}
          >
            {row ? (
              <>
                <Sprite avatar={row.member.profiles.avatar} size={place === 1 ? 104 : 84} transparent bob={place === 1} />
                <span className="mt-1 max-w-full truncate font-display text-xl leading-none">{row.member.profiles.username}</span>
                <span className="mt-0.5 font-display text-2xl leading-none">{row.score} pts</span>
              </>
            ) : (
              // degrau vazio segura o pódio no centro quando tem menos de 3 jogadores
              <span className="font-display text-xl leading-none text-ink/50">vago</span>
            )}
            <div
              className={`mt-2 flex w-full items-start justify-center pt-2 px-box-flat ${h} ${row ? '' : 'opacity-40'}`}
              style={{ background: color }}
            >
              <span className="font-display text-5xl leading-none"><Ord n={place} /></span>
            </div>
          </motion.div>
        ))}
      </div>

      <ol className="px-box divide-y-4 divide-dashed divide-paper-3">
        {table.map((r) => (
          <li key={r.member.user_id} className={`flex items-center gap-3 px-3 py-3 sm:gap-4 sm:px-4 ${r.member.user_id === meId ? 'bg-paper-2' : ''}`}>
            <span className="w-9 font-display text-3xl leading-none"><Ord n={r.rank} /></span>
            <span className="bg-sky-pale px-box-flat"><Head avatar={r.member.profiles.avatar} size={34} /></span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold">{r.member.profiles.username}{r.member.user_id === meId && ' (você)'}</span>
              <span className="block text-sm text-muted">{r.hits} {r.hits === 1 ? 'acerto' : 'acertos'}</span>
            </span>
            <span className="text-right font-display text-3xl leading-none">
              {r.score}<span className="ml-1 text-lg text-muted">pts</span>
            </span>
            {r.member.coins_earned > 0 && <Coins value={r.member.coins_earned} size={16} className="w-14 justify-end" />}
          </li>
        ))}
      </ol>
    </div>
  )
}

// ───────────────────────── painel do host ─────────────────────────

/** Linha "+ indicado" do painel do host: abre um campo pra incluir quem ficou de fora. */
function AddNominee({ busy, onAdd }: { busy: boolean; onAdd: (title: string) => Promise<boolean> }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')

  if (!open) {
    return (
      <button
        type="button"
        className="mt-3 font-body text-sm font-semibold text-muted underline decoration-2 underline-offset-4 hover:text-ink"
        onClick={() => setOpen(true)}
      >
        + Faltou um indicado
      </button>
    )
  }

  return (
    <form
      className="mt-3 flex gap-2"
      onSubmit={async (e) => {
        e.preventDefault()
        const t = title.trim()
        if (!t) return
        if (await onAdd(t)) { setTitle(''); setOpen(false) }
      }}
    >
      <input
        className="field py-1.5 text-sm"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Nome do indicado"
        maxLength={120}
        autoFocus
        aria-label="Nome do novo indicado"
        onKeyDown={(e) => { if (e.key === 'Escape') { setOpen(false); setTitle('') } }}
      />
      <button type="submit" className="btn btn-sm shrink-0" disabled={busy || !title.trim()}>Adicionar</button>
      <button type="button" className="btn btn-sm btn-paper shrink-0" onClick={() => { setOpen(false); setTitle('') }} aria-label="Cancelar">
        ✕
      </button>
    </form>
  )
}

/** Bloco "+ categoria" no fim da lista do painel do host. */
/** Campo de pontos da categoria no painel do host (modo "por categoria"): salva ao sair do campo ou no Enter. */
function PointsEditor({ value, busy, label, onSave }: { value: number; busy: boolean; label: string; onSave: (v: number) => Promise<void> }) {
  const [v, setV] = useState(String(value))
  // Enter salva e o blur que vem logo depois não pode salvar de novo
  const sent = useRef(value)
  const commit = () => {
    const n = Math.max(1, Math.min(1000, Math.round(Number(v)) || value))
    setV(String(n))
    if (n !== sent.current) {
      sent.current = n
      onSave(n)
    }
  }
  return (
    <label className="flex shrink-0 items-center gap-1.5 font-display text-xl leading-none">
      <input
        className="field w-20 py-1 text-right text-base"
        type="number"
        min={1}
        max={1000}
        value={v}
        disabled={busy}
        onChange={(e) => setV(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commit() } }}
        aria-label={`Pontos de ${label}`}
      />
      pts
    </label>
  )
}

type NewCategory ={ catalogId: number; name?: never } | { name: string; catalogId?: never }

function AddCategory({ busy, year, existing, basePoints, choosePoints, onAdd }: {
  busy: boolean
  year: number
  existing: string[]
  basePoints: number
  /** só no modo "por categoria" o host escolhe os pontos; nos outros vale a base do bolão */
  choosePoints: boolean
  onAdd: (src: NewCategory, points: number) => Promise<boolean>
}) {
  const [open, setOpen] = useState(false)
  const [src, setSrc] = useState<'catalog' | 'custom'>('catalog')
  const [catalog, setCatalog] = useState<CatalogCategory[] | null>(null)
  const [catalogId, setCatalogId] = useState('')
  const [name, setName] = useState('')
  const [points, setPoints] = useState(basePoints)
  const reset = () => { setOpen(false); setName(''); setCatalogId(''); setPoints(basePoints) }

  // a lista oficial só é buscada quando o host abre o formulário
  useEffect(() => {
    if (!open || catalog) return
    supabase.from('tga_catalog').select('*').eq('year', year).order('position')
      .then(({ data }) => setCatalog((data ?? []) as CatalogCategory[]))
  }, [open, catalog, year])

  const taken = new Set(existing.map((n) => n.toLowerCase()))
  const available = (catalog ?? []).filter((c) => !taken.has(c.category.toLowerCase()))
  const chosen = available.find((c) => String(c.id) === catalogId)
  const canSubmit = src === 'catalog' ? Boolean(chosen) : Boolean(name.trim())

  if (!open) {
    return (
      <button type="button" className="btn btn-paper mt-6" onClick={() => setOpen(true)}>
        + Faltou uma categoria
      </button>
    )
  }

  return (
    <form
      className="px-box mt-6 p-4"
      onSubmit={async (e) => {
        e.preventDefault()
        if (!canSubmit) return
        const ok = src === 'catalog' ? await onAdd({ catalogId: Number(catalogId) }, points) : await onAdd({ name: name.trim() }, points)
        if (ok) reset()
      }}
    >
      <div className="mb-4 inline-grid grid-cols-2 border-4 border-ink" role="radiogroup" aria-label="De onde vem a categoria">
        {([['catalog', 'Lista oficial'], ['custom', 'Escrever']] as const).map(([v, label]) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={src === v}
            onClick={() => setSrc(v)}
            className={`px-3 py-1.5 font-display text-xl leading-none ${src === v ? 'bg-ink text-paper' : 'bg-paper hover:bg-paper-2'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-3">
      {src === 'catalog' ? (
        <label className="block min-w-[12rem] flex-1">
          <span className="mb-1 block text-sm font-semibold">Categoria do TGA {year}</span>
          {!catalog ? (
            <p className="py-2 text-muted">Carregando lista...</p>
          ) : available.length === 0 ? (
            <p className="py-2 text-muted">Todas as categorias oficiais já estão no bolão.</p>
          ) : (
            <select className="field" value={catalogId} onChange={(e) => setCatalogId(e.target.value)} autoFocus>
              <option value="">Escolha...</option>
              {available.map((c) => (
                <option key={c.id} value={c.id}>{c.category} ({c.nominees.length} indicados)</option>
              ))}
            </select>
          )}
        </label>
      ) : (
        <label className="block min-w-[12rem] flex-1">
          <span className="mb-1 block text-sm font-semibold">Nome da categoria</span>
          <input
            className="field"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ex: Best Fighting Game"
            maxLength={80}
            autoFocus
            onKeyDown={(e) => { if (e.key === 'Escape') reset() }}
          />
        </label>
      )}
      {choosePoints && (
        <label className="block w-24">
          <span className="mb-1 block text-sm font-semibold">Pontos</span>
          <input
            className="field"
            type="number"
            min={1}
            max={1000}
            value={points}
            onChange={(e) => setPoints(Math.max(1, Math.min(1000, Number(e.target.value) || 1)))}
          />
        </label>
      )}
      <button type="submit" className="btn btn-sm" disabled={busy || !canSubmit}>{src === 'catalog' ? 'Adicionar' : 'Criar'}</button>
      <button type="button" className="btn btn-sm btn-paper" onClick={reset} aria-label="Cancelar">✕</button>
      </div>
      {src === 'catalog' && chosen && (
        <p className="mt-3 text-sm text-muted">Entra com: {chosen.nominees.map((n) => n.title).join(', ')}</p>
      )}
      {src === 'custom' && <p className="mt-3 text-sm text-muted">A categoria nasce vazia; depois use "+ Faltou um indicado" nela.</p>}
    </form>
  )
}

function HostTab({ pool, cats, open, onChange, onFinished }: { pool: Pool; cats: Category[]; open: boolean; onChange: () => void; onFinished: () => void }) {
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const missing = cats.filter((c) => !c.winner_nominee_id).length
  const finished = pool.status === 'finished'

  async function rpc(fn: string, args: Record<string, unknown>, ok?: string) {
    setBusy(true)
    const { error } = await supabase.rpc(fn, args)
    setBusy(false)
    if (error) { toast(errMsg(error), 'err'); return false }
    if (ok) toast(ok)
    return true
  }

  if (finished) return <p className="px-dialog p-5 text-lg">Bolão encerrado e moedas entregues. GG!</p>

  return (
    <div className="space-y-8">
      <div className="px-box flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <p className="font-display text-3xl leading-none">{open ? 'A cerimônia começou?' : 'Palpites travados'}</p>
          <p className="mt-1 max-w-md text-muted">
            {open ? 'Fecha os palpites quando o show começar. Marcar o primeiro vencedor fecha sozinho.' : 'Ninguém mexe mais. Dá pra reabrir enquanto nenhum vencedor foi marcado.'}
          </p>
        </div>
        <button
          type="button"
          className={`btn ${open ? 'btn-red' : 'btn-paper'}`}
          disabled={busy || (!open && pool.lock_at !== null && new Date(pool.lock_at) <= new Date())}
          onClick={async () => { if (await rpc('set_pool_status', { p_pool: pool.id, p_status: open ? 'locked' : 'open' })) { sfx.confirm(); onChange() } }}
        >
          {open ? 'Fechar palpites' : 'Reabrir palpites'}
        </button>
      </div>

      <div>
        <h2 className="mb-4 flex items-baseline gap-3 font-display text-4xl leading-none text-paper drop-shadow-[3px_3px_0_#181020]">
          Quem levou?
          <span className="text-2xl">{cats.length - missing}/{cats.length}</span>
        </h2>
        <ol className="grid gap-6 md:grid-cols-2">
          {cats.map((c) => (
            <li key={c.id} className="px-box p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <p className="min-w-0 font-display text-2xl leading-none">{c.name}</p>
                {pool.scoring === 'custom' ? (
                  <PointsEditor
                    key={`${c.id}-${c.points}`}
                    value={c.points}
                    busy={busy}
                    label={c.name}
                    onSave={async (v) => {
                      if (await rpc('set_category_points', { p_category: c.id, p_points: v }, `${c.name} agora vale ${v} pts`)) onChange()
                    }}
                  />
                ) : (
                  <span className="shrink-0"><CatPoints c={c} dynamic={pool.scoring === 'dynamic'} /></span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {c.pool_nominees.map((n) => {
                  const on = c.winner_nominee_id === n.id
                  return (
                    <button
                      key={n.id}
                      type="button"
                      disabled={busy}
                      onClick={async () => {
                        if (await rpc('set_winner', { p_category: c.id, p_nominee: on ? null : n.id })) {
                          if (!on) sfx.coin()
                          onChange()
                        }
                      }}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-left text-sm font-semibold px-box-flat ${on ? 'bg-coin' : 'bg-white hover:bg-paper-2'}`}
                      aria-pressed={on}
                    >
                      {on && <TrophyIcon size={14} />}{n.title}
                    </button>
                  )
                })}
              </div>
              {c.pool_nominees.length === 0 && (
                <p className="text-sm text-muted">Sem indicados ainda. Adicione abaixo.</p>
              )}
              <AddNominee
                key={`add-${c.id}`}
                busy={busy}
                onAdd={async (title) => {
                  if (await rpc('add_nominee', { p_category: c.id, p_title: title }, `${title} entrou em ${c.name}`)) {
                    sfx.select()
                    onChange()
                    return true
                  }
                  return false
                }}
              />
            </li>
          ))}
        </ol>
        <AddCategory
          busy={busy}
          year={pool.year}
          existing={cats.map((c) => c.name)}
          basePoints={pool.base_points}
          choosePoints={pool.scoring === 'custom'}
          onAdd={async (src, points) => {
            const ok = src.catalogId !== undefined
              ? await rpc('add_catalog_category', { p_pool: pool.id, p_catalog_id: src.catalogId, p_points: points }, 'Categoria da lista oficial adicionada, com os indicados.')
              : await rpc('add_category', { p_pool: pool.id, p_name: src.name, p_points: points }, `"${src.name}" criada. Agora coloque os indicados.`)
            if (ok) {
              sfx.select()
              onChange()
              return true
            }
            return false
          }}
        />
      </div>

      <div className="px-dialog flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <p className="font-display text-3xl leading-none text-coin">Fim de jogo</p>
          <p className="mt-1">
            {missing === 0
              ? 'Tudo marcado. Encerrar soma os pontos e entrega as moedas.'
              : missing === 1 ? 'Falta 1 vencedor pra encerrar.' : `Faltam ${missing} vencedores pra encerrar.`}
          </p>
        </div>
        <button type="button" className="btn" disabled={busy || missing > 0} onClick={() => setConfirm(true)}>Encerrar bolão</button>
      </div>

      <Modal open={confirm} onClose={() => setConfirm(false)}>
        <p className="font-display text-3xl text-coin">Encerrar mesmo?</p>
        <p className="mt-3 text-lg leading-snug">Os pontos ficam fixos e cada jogador recebe as moedas. Não dá pra desfazer.</p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            className="btn"
            disabled={busy}
            onClick={async () => {
              if (await rpc('finish_pool', { p_pool: pool.id })) {
                sfx.win()
                setConfirm(false)
                onFinished()
              }
            }}
          >
            Encerrar
          </button>
          <button type="button" className="btn btn-ink" onClick={() => setConfirm(false)}>Voltar</button>
        </div>
      </Modal>
    </div>
  )
}

function FinishBanner({ me, total }: { me: Member; total: number }) {
  return (
    <motion.div
      className="px-dialog mb-8 flex flex-wrap items-center gap-x-6 gap-y-4 px-6 py-5"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'tween', duration: 0.2 }}
    >
      <span className="font-display text-7xl leading-none text-coin"><Ord n={me.rank} /></span>
      <div className="min-w-40 flex-1">
        <p className="font-display text-3xl leading-none">{me.rank === 1 ? 'Campeão do bolão!' : `lugar de ${total}`}</p>
        <p className="mt-1.5 text-paper-3">{me.score} pts · {me.hits} {me.hits === 1 ? 'acerto' : 'acertos'}</p>
      </div>
      {me.coins_earned > 0 && (
        <div className="flex items-center gap-3">
          <CoinIcon size={36} spin />
          <span>
            <span className="block font-display text-4xl leading-none text-coin">+{me.coins_earned}</span>
            <span className="block text-sm text-paper-3">moedas no bolso</span>
          </span>
        </div>
      )}
    </motion.div>
  )
}
