import { useState, type CSSProperties, type ReactNode } from 'react'
import { Link, NavLink, useNavigate } from 'react-router'
import { useAuth } from '../lib/auth'
import { isMuted, setMuted, sfx } from '../lib/sfx'
import { Head } from './Sprite'
import { Coins, TrophyIcon } from './ui'

function Cloud({ className = '', style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 16 8" width={128} height={64} shapeRendering="crispEdges" className={`absolute ${className}`} style={style} aria-hidden>
      <path fill="#181020" d="M5 0h4v1H5zM4 1h1v1H4zM9 1h2v1H9zM3 2h1v1H3zM11 2h1v1H11zM1 3h2v1H1zM12 3h2v1H12zM0 4h1v3H0zM15 4h1v3H15zM1 7h14v1H1z" />
      <path fill="#fcfcfc" d="M5 1h4v1H5zM4 2h7v1H4zM3 3h9v1H3zM1 4h14v3H1zM11 2h0z" />
      <path fill="#a4e4fc" d="M2 6h12v1H2zM12 4h2v1h-2z" />
    </svg>
  )
}

export function Sky() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <Cloud style={{ top: '8%', animation: 'drift 90s linear infinite', animationDelay: '-20s' }} />
      <Cloud style={{ top: '22%', animation: 'drift 130s linear infinite', animationDelay: '-80s', transform: 'scale(.7)' }} />
      <Cloud style={{ top: '48%', animation: 'drift 110s linear infinite', animationDelay: '-50s' }} />
      <Cloud style={{ top: '70%', animation: 'drift 150s linear infinite', animationDelay: '-10s' }} />
    </div>
  )
}

/** Faixa de grama + tijolo no rodapé, como o chão da fase. */
export function Ground({ children }: { children?: ReactNode }) {
  return (
    <footer className="relative mt-16">
      {children}
      <div className="h-3 bg-grass" style={{ boxShadow: 'inset 0 -4px 0 #006c28, 0 -4px 0 #181020' }} />
      <div
        className="h-16"
        style={{
          backgroundColor: '#c84c0c',
          backgroundImage:
            'linear-gradient(#7c2c00 4px, transparent 4px), linear-gradient(90deg, #7c2c00 4px, transparent 4px)',
          backgroundSize: '32px 16px, 32px 32px',
          backgroundPosition: '0 0, 16px 0',
        }}
      />
    </footer>
  )
}

const navCls = ({ isActive }: { isActive: boolean }) =>
  `font-display text-xl leading-none px-2 pt-1 pb-1.5 sm:text-2xl ${
    isActive ? 'bg-ink text-coin' : 'text-ink hover:bg-paper-2'
  }`

export function Layout({ children }: { children: ReactNode }) {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [muted, setM] = useState(isMuted())

  return (
    <div className="flex min-h-dvh flex-col">
      <Sky />
      <header className="sticky top-0 z-40 border-b-4 border-ink bg-paper">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2 sm:gap-5">
          <Link to="/hub" className="flex shrink-0 items-center gap-2" aria-label="Bolão GOTY — início">
            <TrophyIcon size={28} />
            <span className="hidden font-display text-2xl leading-none sm:inline">Bolão GOTY</span>
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2" aria-label="Principal">
            <NavLink to="/hub" className={navCls}>Bolões</NavLink>
            <NavLink to="/loja" className={navCls}>Loja</NavLink>
            <NavLink to="/personagem" className={navCls}>Boneco</NavLink>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <button
              type="button"
              className="font-display text-lg leading-none text-muted hover:text-ink"
              onClick={() => {
                setMuted(!muted)
                setM(!muted)
                if (muted) sfx.select()
              }}
              aria-pressed={!muted}
              title={muted ? 'Ligar som' : 'Desligar som'}
            >
              {muted ? 'SOM: OFF' : 'SOM: ON'}
            </button>
            {profile && (
              <>
                <Coins value={profile.coins} size={20} />
                <button
                  type="button"
                  onClick={async () => {
                    await signOut()
                    navigate('/')
                  }}
                  className="group flex items-center gap-2"
                  title="Sair"
                >
                  <span className="px-box-flat bg-sky-pale">
                    <Head avatar={profile.avatar} size={32} />
                  </span>
                  <span className="hidden max-w-28 truncate font-body text-sm font-semibold md:inline">
                    {profile.username}
                    <span className="block text-xs font-normal text-muted group-hover:text-red">sair</span>
                  </span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-8 sm:pt-10">{children}</main>
      <Ground />
    </div>
  )
}
