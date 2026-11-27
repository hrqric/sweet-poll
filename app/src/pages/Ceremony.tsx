import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { useAuth } from '../lib/auth'
import { demoResult, useResultsFeed, type FeedResult } from '../lib/resultsFeed'
import { isMuted, setMuted, sfx } from '../lib/sfx'
import { Head } from '../components/Sprite'
import { randomAvatar } from '../lib/sprites'
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
    return (
      <div className="min-h-dvh bg-ink px-4 pt-10">
        <div className="px-dialog mx-auto max-w-md p-6">
          <p className="font-display text-4xl leading-none text-coin">Game over</p>
          <p className="mt-3 text-lg">Não achei esse bolão. Confere o código do convite.</p>
          <Link to="/hub" className="btn btn-paper btn-sm mt-6">Voltar</Link>
        </div>
      </div>
    )
  }
  if (!feed.pool) return <div className="min-h-dvh bg-ink"><Loading /></div>

  const members = feed.pool.members

  return (
    <div className="on-dark min-h-dvh bg-ink text-paper">
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b-4 border-black px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link to={`/b/${code}`} className="btn btn-sm btn-paper">Voltar</Link>
          <div className="min-w-0">
            <h1 className="truncate font-display text-3xl leading-none text-coin">Modo cerimônia</h1>
            <p className="truncate text-sm text-paper-3">
              {feed.pool.name} · {members} {members === 1 ? 'jogador' : 'jogadores'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="btn btn-sm btn-paper"
            aria-pressed={!muted}
            onClick={() => { const m = !muted; setMuted(m); setMutedState(m); if (!m) sfx.select() }}
          >
            {muted ? 'Som mudo' : 'Som ligado'}
          </button>
          {/* uma prévia por cena: 2+ acertos (placa), só você (carro), ninguém (barco) */}
          <div className="flex items-center gap-1" role="group" aria-label="Testar animação">
            <span className="mr-1 hidden font-display text-lg text-paper-3 sm:inline">Testar:</span>
            {([
              ['Vários', () => {
                const me = profile ? [{ username: profile.username, avatar: profile.avatar }] : []
                return [...me, { username: 'amigo_1', avatar: randomAvatar() }, { username: 'amigo_2', avatar: randomAvatar() }]
              }],
              ['Só eu', () => (profile ? [{ username: profile.username, avatar: profile.avatar }] : [{ username: 'voce', avatar: randomAvatar() }])],
              ['Ninguém', () => []],
            ] as const).map(([label, hits]) => (
              <button key={label} type="button" className="btn btn-sm btn-paper" onClick={() => setDemo(demoResult(hits()))}>
                {label}
              </button>
            ))}
          </div>
          <button type="button" className="btn btn-sm" onClick={fullscreen}>Tela cheia</button>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1600px] gap-8 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        {/* no desktop o player cabe inteiro na altura da tela (16:9 a partir da altura livre) */}
        <div className="mx-auto w-full min-w-0 lg:max-w-[calc((100dvh-9rem)*16/9)]">
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
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0c0814] px-6 text-center">
                <TrophyIcon size={56} />
                <p className="font-display text-2xl leading-none text-paper sm:text-4xl">
                  {source.kind === 'youtube' ? 'Cole o link da live do YouTube' : 'Os vencedores aparecem aqui'}
                </p>
                <p className="max-w-sm text-sm text-paper-3">
                  {source.kind === 'youtube'
                    ? 'O campo fica logo abaixo do vídeo.'
                    : 'Sem player: cada categoria anunciada sobe aqui com quem acertou.'}
                </p>
              </div>
            )}
            <WinnerAnnouncement result={current} onDone={done} />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-3">
            <span id="source-label" className="font-display text-xl leading-none text-paper-3">Assistir por</span>
            <div className="inline-grid grid-cols-3 border-4 border-black" role="radiogroup" aria-labelledby="source-label">
              {([['twitch', 'Twitch'], ['youtube', 'YouTube'], ['none', 'Sem vídeo']] as const).map(([k, label], i) => (
                <button
                  key={k}
                  type="button"
                  role="radio"
                  aria-checked={source.kind === k}
                  onClick={() => setSource(k === 'youtube' ? { kind: 'youtube', url: ytDraft } : { kind: k })}
                  className={`px-3 pt-1.5 pb-2 font-display text-lg leading-none ${source.kind === k ? 'bg-coin text-ink' : 'bg-paper text-ink hover:bg-paper-2'} ${i < 2 ? 'border-r-4 border-black' : ''}`}
                >
                  {label}
                </button>
              ))}
            </div>
            {source.kind === 'youtube' && (
              <form
                className="flex w-full gap-3 sm:w-auto sm:min-w-[18rem] sm:flex-1"
                onSubmit={(e) => {
                  e.preventDefault()
                  if (!youtubeId(ytDraft)) return toast('Não reconheci esse link do YouTube.', 'err')
                  setSource({ kind: 'youtube', url: ytDraft })
                }}
              >
                <input
                  className="field min-w-0 py-1.5 text-base"
                  value={ytDraft}
                  onChange={(e) => setYtDraft(e.target.value)}
                  placeholder="youtube.com/watch?v=..."
                  aria-label="Link da transmissão no YouTube"
                  inputMode="url"
                />
                <button type="submit" className="btn btn-sm shrink-0">Usar</button>
              </form>
            )}
          </div>
          <ul className="mt-4 max-w-[62ch] space-y-1 text-sm text-paper-3">
            <li>Pra tela cheia, use o botão <strong className="font-semibold text-paper">Tela cheia</strong> lá em cima. O do player esconde a animação.</li>
            <li>Vendo na TV? Escolha <strong className="font-semibold text-paper">Sem vídeo</strong> e deixa o celular avisar cada vencedor.</li>
          </ul>
        </div>

        <aside
          aria-labelledby="decided-title"
          className="lg:sticky lg:top-6 lg:flex lg:max-h-[calc(100dvh-8.5rem)] lg:flex-col"
        >
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="decided-title" className="font-display text-3xl leading-none text-coin">Já saiu</h2>
            {results.length > 0 && (
              <span className="font-display text-xl leading-none text-paper-3">
                {results.length} {results.length === 1 ? 'categoria' : 'categorias'}
              </span>
            )}
          </div>

          {results.length === 0 ? (
            <div className="mt-4 border-4 border-dashed border-paper/25 px-4 py-6 text-center">
              <p className="font-display text-2xl leading-none text-paper">Nenhum vencedor ainda</p>
              <p className="mt-2 text-sm text-paper-3">Quando sair o primeiro, ele aparece aqui com a cabeça de quem acertou.</p>
            </div>
          ) : (
            <>
              <p className="mt-2 text-sm text-paper-3">Toque num resultado pra ver a animação de novo.</p>
              {/* rola por dentro no desktop pra o player não sumir da tela */}
              <ol className="-mx-1 mt-4 space-y-3 px-1 pb-1 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
                {recent.map((r, i) => (
                  <li key={r.category_id}>
                    <button
                      type="button"
                      onClick={() => feed.replay(r)}
                      className={`relative w-full border-4 px-3 pt-2 pb-2.5 text-left hover:bg-[#2e2240] ${i === 0 ? 'border-coin bg-[#2a1f36]' : 'border-black bg-[#241a30]'}`}
                    >
                      <span className="block text-sm leading-snug text-paper-3">{r.category}</span>
                      <span className="mt-0.5 block font-display text-2xl leading-[0.95] break-words">{r.winner}</span>
                      <span className="mt-2 flex flex-wrap items-center gap-1.5">
                        {r.hits.length === 0 ? (
                          <span className="text-sm text-paper-3">Ninguém acertou</span>
                        ) : (
                          <>
                            {r.hits.slice(0, 8).map((h) => (
                              <span key={h.username} title={h.username} className="bg-sky-pale px-box-flat">
                                <Head avatar={h.avatar} size={24} />
                              </span>
                            ))}
                            {r.hits.length > 8 && <span className="font-display text-lg leading-none">+{r.hits.length - 8}</span>}
                            <span className="sr-only">
                              {r.hits.length === 1 ? 'Acertou: ' : `${r.hits.length} acertaram: `}
                              {r.hits.map((h) => h.username).join(', ')}
                            </span>
                          </>
                        )}
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
            </>
          )}
        </aside>
      </div>
    </div>
  )
}
