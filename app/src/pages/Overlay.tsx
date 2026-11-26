import { useCallback, useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router'
import { demoResult, useResultsFeed, type FeedResult } from '../lib/resultsFeed'
import { WinnerAnnouncement } from '../components/WinnerAnnouncement'
import { DEFAULT_AVATAR, randomAvatar } from '../lib/sprites'

/**
 * Overlay transparente pro OBS (fonte "Navegador", 1920×1080): só a placa de vencedor, sem fundo.
 * Não precisa de login: lê pelo código do convite. `?demo=1` repete uma animação de teste a cada
 * 12 s pra ajudar a posicionar a fonte.
 */
export default function Overlay() {
  const { code = '' } = useParams()
  const [params] = useSearchParams()
  const isDemo = params.get('demo') === '1'
  const feed = useResultsFeed(code, { intervalMs: 4000 })
  const [demo, setDemo] = useState<FeedResult | null>(null)

  // fundo transparente: o html/body do site é azul-céu
  useEffect(() => {
    const prev = [document.documentElement.style.background, document.body.style.background]
    document.documentElement.style.background = 'transparent'
    document.body.style.background = 'transparent'
    return () => {
      document.documentElement.style.background = prev[0]
      document.body.style.background = prev[1]
    }
  }, [])

  useEffect(() => {
    if (!isDemo) return
    const fake = () => setDemo(demoResult([
      { username: 'player_um', avatar: DEFAULT_AVATAR },
      { username: 'player_dois', avatar: randomAvatar() },
      { username: 'player_tres', avatar: randomAvatar() },
    ]))
    fake()
    const t = setInterval(fake, 12_000)
    return () => clearInterval(t)
  }, [isDemo])

  const { next } = feed
  const clearDemo = useCallback(() => setDemo(null), [])
  return (
    <div className="fixed inset-0">
      <WinnerAnnouncement result={demo ?? feed.current} onDone={demo ? clearDemo : next} />
    </div>
  )
}
