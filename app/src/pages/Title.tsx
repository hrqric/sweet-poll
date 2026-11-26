import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../lib/auth'
import { sfx } from '../lib/sfx'
import { Sprite } from '../components/Sprite'
import { Ground, Sky } from '../components/Layout'
import { CoinIcon, Ord, TrophyIcon } from '../components/ui'
import type { Avatar } from '../lib/sprites'

const CEREMONY = new Date('2026-12-10T22:00:00-03:00')

const PARADE: Avatar[] = [
  { skin: 1, hairStyle: 1, hairColor: 3, eyes: 0, shirt: 1, pants: 0, hat: 'cap', held: 'controller' },
  { skin: 4, hairStyle: 2, hairColor: 0, eyes: 1, shirt: 4, pants: 1, outfit: 'cape', hat: 'crown', pet: 'slime' },
  { skin: 0, hairStyle: 3, hairColor: 4, eyes: 3, shirt: 2, pants: 2, face: 'shades', held: 'sword' },
  { skin: 3, hairStyle: 4, hairColor: 6, eyes: 0, shirt: 6, pants: 3, outfit: 'armor', hat: 'viking' },
  { skin: 2, hairStyle: 5, hairColor: 5, eyes: 1, shirt: 7, pants: 4, outfit: 'tux', held: 'trophy', pet: 'ghost' },
  { skin: 5, hairStyle: 0, hairColor: 7, eyes: 2, shirt: 3, pants: 5, hat: 'wizard', pet: 'cat' },
]

const LINES = [
  'Ei, você aí! A cerimônia do The Game Awards tá chegando.',
  'Monte um bolão, escolha as categorias e chame a galera pelo link.',
  'Cada acerto vale ponto. Ponto vira moeda. Moeda vira coroa, capa, dragão...',
  'Quem chegar no topo do ranking manda no grupo até o ano que vem.',
]

function useTypewriter(lines: string[]) {
  const [line, setLine] = useState(0)
  const [chars, setChars] = useState(0)
  const full = lines[line]
  useEffect(() => {
    if (chars < full.length) {
      const t = setTimeout(() => setChars((c) => c + 1), 28)
      return () => clearTimeout(t)
    }
  }, [chars, full])
  const done = chars >= full.length
  const next = () => {
    if (!done) return setChars(full.length)
    sfx.select()
    setLine((l) => (l + 1) % lines.length)
    setChars(0)
  }
  return { text: full.slice(0, chars), done, next, line }
}

export default function Title() {
  const { session, profile } = useAuth()
  const navigate = useNavigate()
  const tw = useTypewriter(LINES)
  // diferença em dias de calendário, pra "amanhã" e "é hoje!" baterem com a data e não com as horas
  const days = useMemo(() => {
    const day = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
    return Math.max(0, Math.round((day(CEREMONY) - day(new Date())) / 86_400_000))
  }, [])

  const start = () => {
    sfx.confirm()
    navigate(session ? (profile?.avatar ? '/hub' : '/personagem') : '/entrar')
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !(e.target instanceof HTMLButtonElement)) start()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div className="flex min-h-dvh flex-col">
      <Sky />
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 pt-10 sm:pt-16">
        {/* HUD de NES: rótulo em cima, valor embaixo */}
        <div className="grid grid-cols-3 gap-4 font-display uppercase leading-none text-paper drop-shadow-[2px_2px_0_#181020]">
          <div>
            <div className="text-lg sm:text-xl">TGA 2026</div>
            <div className="mt-1 text-2xl sm:text-3xl">10 dez</div>
          </div>
          <div className="text-center">
            <div className="text-lg sm:text-xl">Cerimônia</div>
            <div className="mt-1 text-2xl text-coin sm:text-3xl">
              {days > 1 ? `${days} dias` : days === 1 ? 'amanhã' : 'é hoje!'}
            </div>
          </div>
          <div className="min-w-0 text-right">
            <div className="text-lg sm:text-xl">Jogador</div>
            <div className="mt-1 truncate text-2xl normal-case sm:text-3xl">
              {session ? (
                profile?.username ?? '...'
              ) : (
                <Link to="/entrar" className="underline decoration-2 underline-offset-4">
                  Entrar
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 grid sm:mt-10 items-center gap-10 md:grid-cols-[1.15fr_1fr]">
          <div>
            <h1 className="font-display leading-[0.8] text-paper" style={{ textShadow: '4px 4px 0 #181020, -4px 0 0 #181020, 0 -4px 0 #181020, 4px 0 0 #181020, 0 4px 0 #181020, 8px 8px 0 #3c6ad8' }}>
              <span className="block text-[clamp(4rem,12vw,8.5rem)]">Bolão</span>
              <span className="block text-[clamp(4rem,12vw,8.5rem)] text-coin">do GOTY</span>
            </h1>
            <p className="mt-6 max-w-[26rem] font-body text-lg leading-snug text-ink sm:text-xl">
              Palpite nos vencedores do The Game Awards com os amigos. Acertou, ganhou moeda pra vestir o seu boneco.
            </p>
            <div className="mt-8 flex items-center gap-5">
              <button type="button" className="btn text-3xl" onClick={start}>
                Press start
              </button>
              <span className="hidden font-display text-2xl text-ink sm:inline">
                ou aperte <kbd className="px-box-flat bg-paper px-2 font-display">Enter</kbd>
              </span>
            </div>
          </div>

          {/* card de seleção de personagem: o prêmio do pódio (AD-007) numa placa, sem selo flutuante */}
          <figure className="px-box mx-auto w-[228px] bg-sky-pale">
            <div className="flex justify-center px-4 pt-4">
              <Sprite avatar={PARADE[1]} size={180} bob transparent />
            </div>
            <figcaption className="flex items-center justify-between gap-2 border-t-4 border-ink bg-paper px-3 py-2 font-display text-2xl leading-none">
              <span>
                <Ord n={1} /> lugar
              </span>
              <span className="flex items-center gap-1.5">
                <CoinIcon size={20} spin />
                +100
              </span>
            </figcaption>
          </figure>
        </div>

        <button
          type="button"
          onClick={tw.next}
          className="px-dialog mt-14 block w-full p-6 text-left sm:px-8"
          aria-label="Próxima fala"
        >
          <div className="mb-2 flex items-center justify-between gap-2 font-display text-xl leading-none">
            <span className="flex items-center gap-2 text-coin">
              <TrophyIcon size={20} /> Apresentador
            </span>
            <span className="text-paper/60 tabular-nums">
              {tw.line + 1}/{LINES.length}
            </span>
          </div>
          <p className="min-h-[3.5em] font-body text-xl leading-snug sm:text-2xl">
            {tw.text}
            {tw.done && <span className="anim-blink ml-2 inline-block text-coin">▼</span>}
          </p>
        </button>
      </div>

      <Ground>
        <div className="relative h-24 overflow-hidden" aria-hidden>
          {PARADE.map((a, i) => (
            <div
              key={i}
              className="absolute bottom-0"
              style={{ animation: `walk ${26 + i * 3}s linear infinite`, animationDelay: `${-i * 5.5}s` }}
            >
              <Sprite avatar={a} size={72} transparent bob />
            </div>
          ))}
        </div>
      </Ground>
    </div>
  )
}
