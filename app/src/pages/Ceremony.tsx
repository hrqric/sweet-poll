import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { useAuth } from '../lib/auth'
import { demoResult, useResultsFeed, type FeedResult } from '../lib/resultsFeed'
import { isMuted, setMuted, sfx } from '../lib/sfx'
import { Head } from '../components/Sprite'
import { Loading, TrophyIcon, useToast } from '../components/ui'
import { WinnerAnnouncement } from '../components/WinnerAnnouncement'

type Source = { kind: 'twitch' } | { kind: 'youtube'; url: string } | { kind: 'none' }
const SOURCE_KEY = 'sp-stream-source'

function loadSource(): Source {
  try {
    const s = JSON.parse(localStorage.getItem(SOURCE_KEY) ?? '')
    if (s?.kind === 'twitch' || s?.kind === 'none' || (s?.kind === 'youtube' && typeof s.url === 'string')) return s
  } catch { /* primeira visita */ }
  return { kind: 'twitch' }
}

/** Aceita watch?v=, youtu.be/, /live/, /embed/ e /shorts/. */
function youtubeId(url: string): string | null {
  const m = url.match(/(?:v=|youtu\.be\/|\/live\/|\/embed\/|\/shorts\/)([A-Za-z0-9_-]{11})/)
  return m ? m[1] : /^[A-Za-z0-9_-]{11}$/.test(url.trim()) ? url.trim() : null
}

function streamSrc(src: Source): string | null {
  if (src.kind === 'twitch') {
    return `https://player.twitch.tv/?channel=thegameawards&parent=${window.location.hostname}&autoplay=true&muted=false`
  }
  if (src.kind === 'youtube') {
    const id = youtubeId(src.url)
    return id ? `https://www.youtube.com/embed/${id}?autoplay=1&rel=0` : null
  }
  return null
}

export default function Ceremony() {
  const { code = '' } = useParams()
  const { profile } = useAuth()
  const toast = useToast()
  const [source, setSource] = useState<Source>(loadSource)
  const [ytDraft, setYtDraft] = useState(source.kind === 'youtube' ? source.url : '')
  const [muted, setMutedState] = useState(isMuted())
  const [demo, setDemo] = useState<FeedResult | null>(null)
  const stage = useRef<HTMLDivElement>(null)

  // polling de 5 s + realtime: anima na hora que o vencedor é marcado
  const feed = useResultsFeed(code, { realtime: true })
  const current = demo ?? feed.current

  useEffect(() => { localStorage.setItem(SOURCE_KEY, JSON.stringify(source)) }, [source])

  const src = useMemo(() => streamSrc(source), [source])
  const { next } = feed
  const done = useCallback(() => {
    if (demo) setDemo(null)
    else next()
  }, [demo, next])

  const results = feed.results
  const recent = [...results].reverse()

  async function fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await stage.current?.requestFullscreen()
    } catch {
      toast('O navegador não deixou entrar em tela cheia.', 'err')
    }
  }

  if (feed.error && !feed.pool) {
    return <p className="px-dialog mx-auto mt-10 max-w-md p-6 text-lg">Não achei esse bolão. Confere o código do convite.</p>
  }
  if (!feed.pool) return <Loading />

  return (
    <div className="min-h-dvh bg-ink text-paper">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b-4 border-black px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link to={`/b/${code}`} className="btn btn-sm btn-paper">Voltar</Link>
          <div className="min-w-0">
            <p className="truncate font-display text-2xl leading-none text-coin">Modo cerimônia</p>
            <p className="truncate text-sm text-paper-3">{feed.pool.name} · {feed.pool.members} jogadores</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="btn btn-sm btn-paper"
            onClick={() => { const m = !muted; setMuted(m); setMutedState(m); if (!m) sfx.select() }}
          >
            {muted ? 'Som: mudo' : 'Som: ligado'}
          </button>
          <button
            type="button"
            className="btn btn-sm btn-paper"
            onClick={() => setDemo(demoResult(profile ? [{ username: profile.username, avatar: profile.avatar }] : []))}
          >
            Testar animação
          </button>
          <button type="button" className="btn btn-sm" onClick={fullscreen}>Tela cheia</button>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1600px] gap-6 p-4 lg:grid-cols-[1fr_320px]">
        <div>
          {/* palco: player + animação juntos, é ele que vai pra tela cheia */}
          <div ref={stage} className="relative aspect-video w-full overflow-hidden border-4 border-black bg-black">
            {src ? (
              <iframe
                key={src}
                src={src}
                title="Transmissão do The Game Awards"
                className="absolute inset-0 h-full w-full"
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0c0814] text-center">
                <TrophyIcon size={64} />
                <p className="font-display text-3xl text-paper-3">
                  {source.kind === 'youtube' ? 'Cole o link da transmissão do YouTube abaixo' : 'Os vencedores aparecem aqui'}
                </p>
              </div>
            )}
            <WinnerAnnouncement result={current} onDone={done} />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="font-display text-xl text-paper-3">Transmissão:</span>
            <div className="inline-grid grid-cols-3 border-4 border-black" role="radiogroup" aria-label="Fonte da transmissão">
              {([['twitch', 'Twitch'], ['youtube', 'YouTube'], ['none', 'Sem vídeo']] as const).map(([k, label], i) => (
                <button
                  key={k}
                  type="button"
                  role="radio"
                  aria-checked={source.kind === k}
                  onClick={() => setSource(k === 'youtube' ? { kind: 'youtube', url: ytDraft } : { kind: k })}
                  className={`px-3 py-1.5 font-display text-lg leading-none ${source.kind === k ? 'bg-coin text-ink' : 'bg-paper text-ink hover:bg-paper-2'} ${i < 2 ? 'border-r-4 border-black' : ''}`}
                >
                  {label}
                </button>
              ))}
            </div>
            {source.kind === 'youtube' && (
              <form
                className="flex min-w-[16rem] flex-1 gap-2"
                onSubmit={(e) => {
                  e.preventDefault()
                  if (!youtubeId(ytDraft)) return toast('Não reconheci esse link do YouTube.', 'err')
                  setSource({ kind: 'youtube', url: ytDraft })
                }}
              >
                <input
                  className="field py-1.5 text-base"
                  value={ytDraft}
                  onChange={(e) => setYtDraft(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  aria-label="Link da transmissão no YouTube"
                />
                <button type="submit" className="btn btn-sm">Usar</button>
              </form>
            )}
          </div>
          <p className="mt-2 text-sm text-paper-3">
            A animação aparece aqui em cima do vídeo, inclusive em tela cheia (use o botão "Tela cheia" daqui, não o do player).
            Assistindo na TV? Deixe em "Sem vídeo" e o celular avisa quando sair cada vencedor.
          </p>
        </div>

        <aside>
          <h2 className="font-display text-3xl leading-none text-coin">Já saiu</h2>
          <p className="mt-1 text-sm text-paper-3">{results.length === 0 ? 'Nenhum vencedor ainda. Fica de olho.' : 'Toque num resultado pra ver a animação de novo.'}</p>
          <ol className="mt-4 space-y-3">
            {recent.map((r) => (
              <li key={r.category_id}>
                <button
                  type="button"
                  onClick={() => feed.replay(r)}
                  className="w-full border-4 border-black bg-[#241a30] px-3 py-2 text-left hover:bg-[#2e2240]"
                >
                  <span className="block truncate text-sm text-paper-3">{r.category}</span>
                  <span className="block truncate font-display text-xl leading-tight">{r.winner}</span>
                  <span className="mt-1 flex items-center gap-1">
                    {r.hits.length === 0 ? (
                      <span className="text-sm text-paper-3">ninguém acertou</span>
                    ) : (
                      <>
                        {r.hits.slice(0, 8).map((h) => (
                          <span key={h.username} title={h.username} className="bg-sky-pale"><Head avatar={h.avatar} size={22} /></span>
                        ))}
                        {r.hits.length > 8 && <span className="text-sm">+{r.hits.length - 8}</span>}
                      </>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </div>
  )
}
