import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../lib/auth'
import { supabase, errMsg, picksOpen, type Pool } from '../lib/supabase'
import { sfx } from '../lib/sfx'
import { Sprite } from '../components/Sprite'
import { Coins, Loading, STATUS_TAG, Tag, useToast } from '../components/ui'

type Slot = {
  pool: Pool
  rank: number | null
  coins_earned: number
  members: number
  categories: number
  myPicks: number
}

function count(rows: { pool_id: string }[] | null) {
  const m = new Map<string, number>()
  rows?.forEach((r) => m.set(r.pool_id, (m.get(r.pool_id) ?? 0) + 1))
  return m
}

export default function Hub() {
  const { profile } = useAuth()
  const [slots, setSlots] = useState<Slot[] | null>(null)
  const [code, setCode] = useState('')
  const navigate = useNavigate()
  const toast = useToast()

  useEffect(() => {
    if (!profile) return
    ;(async () => {
      const { data: mine, error } = await supabase
        .from('pool_members')
        .select('rank, coins_earned, pools(*)')
        .eq('user_id', profile.id)
      if (error) return toast(errMsg(error), 'err')
      const rows = (mine ?? []) as unknown as { rank: number | null; coins_earned: number; pools: Pool }[]
      const ids = rows.map((r) => r.pools.id)
      if (!ids.length) return setSlots([])
      const [members, cats, picks] = await Promise.all([
        supabase.from('pool_members').select('pool_id').in('pool_id', ids),
        supabase.from('pool_categories').select('pool_id').in('pool_id', ids),
        supabase.from('picks').select('pool_id').in('pool_id', ids).eq('user_id', profile.id),
      ])
      const mc = count(members.data), cc = count(cats.data), pc = count(picks.data)
      setSlots(
        rows
          .map((r) => ({
            pool: r.pools,
            rank: r.rank,
            coins_earned: r.coins_earned,
            members: mc.get(r.pools.id) ?? 0,
            categories: cc.get(r.pools.id) ?? 0,
            myPicks: pc.get(r.pools.id) ?? 0,
          }))
          .sort((a, b) => +new Date(b.pool.created_at) - +new Date(a.pool.created_at)),
      )
    })()
  }, [profile, toast])

  function join(e: FormEvent) {
    e.preventDefault()
    const c = code.trim().toUpperCase()
    if (c.length < 4) return toast('Cole o código de 6 letras do convite.', 'err')
    sfx.confirm()
    navigate(`/b/${c}`)
  }

  if (!profile) return <Loading />

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
      <div>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <h1 className="font-display text-5xl leading-none text-paper drop-shadow-[3px_3px_0_#181020] sm:text-6xl">
            Seus bolões
          </h1>
          <Link to="/bolao/novo" className="btn btn-green" onClick={() => sfx.confirm()}>
            + Novo bolão
          </Link>
        </div>

        {slots === null ? (
          <Loading />
        ) : slots.length === 0 ? (
          <div className="px-dialog p-7">
            <p className="font-display text-3xl text-coin">Nenhum bolão salvo</p>
            <p className="mt-3 max-w-lg text-lg leading-snug">
              Crie um e mande o link no grupo, ou cole ao lado o código que um amigo te passou.
            </p>
          </div>
        ) : (
          <ol className="space-y-5">
            {slots.map((s, i) => {
              const tag = STATUS_TAG[s.pool.status === 'open' && !picksOpen(s.pool) ? 'locked' : s.pool.status]
              const pending = picksOpen(s.pool) && s.myPicks < s.categories
              return (
                <li key={s.pool.id}>
                  <Link
                    to={`/b/${s.pool.invite_code}`}
                    onClick={() => sfx.select()}
                    className="px-box group flex items-stretch gap-0 transition-transform hover:-translate-y-1"
                  >
                    <div className="flex w-16 shrink-0 items-center justify-center border-r-4 border-ink bg-ink font-display text-3xl text-coin sm:w-20">
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <div className="min-w-0 flex-1 p-4 sm:p-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <Tag color={tag.color}>{tag.label}</Tag>
                        {s.pool.owner_id === profile.id && <Tag color="#ac7c00">Você é o host</Tag>}
                      </div>
                      <h2 className="mt-2 truncate font-display text-3xl leading-none group-hover:underline">{s.pool.name}</h2>
                      <p className="mt-2 text-muted">
                        {s.members} {s.members === 1 ? 'jogador' : 'jogadores'} · {s.categories} categorias ·{' '}
                        {s.pool.status === 'finished'
                          ? <>você ficou em <strong className="text-ink">{s.rank}º</strong></>
                          : <>seus palpites: <strong className={pending ? 'text-red' : 'text-ink'}>{s.myPicks}/{s.categories}</strong></>}
                      </p>
                    </div>
                    {s.pool.status === 'finished' && s.coins_earned > 0 && (
                      <div className="hidden items-center border-l-4 border-dashed border-paper-3 px-5 sm:flex">
                        <Coins value={s.coins_earned} />
                      </div>
                    )}
                    <div className="hidden items-center pr-5 font-display text-3xl text-muted group-hover:text-ink sm:flex">▶</div>
                  </Link>
                </li>
              )
            })}
          </ol>
        )}
      </div>

      <aside className="space-y-8">
        <div className="px-box bg-paper-2 p-5">
          <div className="flex items-center gap-4">
            <div className="px-box-flat">
              <Sprite avatar={profile.avatar} size={84} />
            </div>
            <div className="min-w-0">
              <p className="truncate font-display text-3xl leading-none">{profile.username}</p>
              <Coins value={profile.coins} className="mt-2" />
            </div>
          </div>
          <div className="mt-5 flex gap-3">
            <Link to="/loja" className="btn btn-sm flex-1">Loja</Link>
            <Link to="/personagem" className="btn btn-paper btn-sm flex-1">Visual</Link>
          </div>
        </div>

        <form onSubmit={join} className="px-box p-5">
          <label htmlFor="code" className="font-display text-2xl leading-none">Tem um convite?</label>
          <p className="mt-1 text-sm text-muted">O código fica no fim do link: …/b/<strong>K7Q2XA</strong></p>
          <div className="mt-4 flex gap-3">
            <input
              id="code"
              className="field font-display text-2xl tracking-[0.2em] uppercase"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              maxLength={6}
              placeholder="ABC123"
              autoComplete="off"
            />
            <button type="submit" className="btn btn-sm shrink-0">Ir</button>
          </div>
        </form>
      </aside>
    </div>
  )
}
