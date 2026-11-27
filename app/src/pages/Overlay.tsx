import { useCallback, useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router'
import { demoResult, useResultsFeed, type FeedResult } from '../lib/resultsFeed'
import { WinnerAnnouncement } from '../components/WinnerAnnouncement'
import { DEFAULT_AVATAR, randomAvatar } from '../lib/sprites'
import { ALL_SCENES } from '../components/announce/registry'

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
    // passa por todas as cenas do catálogo, cada uma com a quantidade de acertos da sua situação
    const players = ['player_um', 'player_dois', 'player_tres', 'player_quatro']
    let i = 0
    const fake = () => {
      const def = ALL_SCENES[i++ % ALL_SCENES.length]
      const n = { none: 0, solo: 1, duo: 2, group: 4 }[def.situation]
      const group = players.map((u, k) => ({ username: u, avatar: k === 0 ? DEFAULT_AVATAR : randomAvatar() }))
      setDemo(demoResult(group.slice(0, n), def.id, group))
    }
    fake()
    const t = setInterval(fake, 12_000)
    return () => clearInterval(t)
  }, [isDemo])

  const { next } = feed
  const clearDemo = useCallback(() => setDemo(null), [])
  return (
    <div className="fixed inset-0">
      {/* no OBS também vai no canto por padrão; ?tamanho=cheio cobre a tela toda */}
      <WinnerAnnouncement result={demo ?? feed.current} history={feed.results} onDone={demo ? clearDemo : next} size={params.get('tamanho') === 'cheio' ? 'full' : 'corner'} />
    </div>
  )
}
