import { useEffect, useMemo } from 'react'
import { AnimatePresence } from 'motion/react'
import type { FeedResult } from '../lib/resultsFeed'
import { assignScenes, sceneFor } from './announce/registry'

/**
 * Anúncio do vencedor por cima do player. A cena sai do sorteio por situação (registry.tsx),
 * calculado sobre o histórico do bolão pra todo mundo ver a mesma.
 * Ocupa o pai inteiro (absolute inset-0) e não bloqueia cliques no vídeo embaixo.
 * Tamanhos em cqw: escala junto com o player, do embed pequeno à tela cheia.
 */
/** `corner`: janelinha no canto (não tampa a transmissão); `full`: cobre o player inteiro. */
export type AnnounceSize = 'corner' | 'full'

export function WinnerAnnouncement({ result, history = [], onDone, size = 'corner' }: {
  result: FeedResult | null; history?: FeedResult[]; onDone: () => void; size?: AnnounceSize
}) {
  const assigned = useMemo(() => assignScenes(history), [history])
  const scene = result ? sceneFor(result, assigned) : null

  useEffect(() => {
    if (!result || !scene) return
    scene.sound()
    const t = setTimeout(onDone, scene.duration(result))
    return () => clearTimeout(t)
    // a cena é derivada do resultado; reiniciar só quando o resultado muda
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, onDone])

  return (
    // a região viva fica no contêiner que já existe: leitor de tela só anuncia mudança em região montada antes
    <div className="pointer-events-none absolute inset-0 overflow-hidden" role="status" aria-live="polite">
      <AnimatePresence>
        {result && scene && (
          // a cena desenha em cqw: dentro da janelinha tudo encolhe junto, sem quebrar o layout
          <div
            key={result.category_id + result.set_at}
            className={
              size === 'full'
                ? 'absolute inset-0 overflow-hidden'
                : `absolute bottom-[3%] right-[2%] aspect-video w-[max(36%,240px)] max-w-[96%] overflow-hidden ${scene.transparent ? '' : 'border-4 border-black shadow-[6px_6px_0_rgba(0,0,0,0.55)]'}`
            }
            style={{ containerType: 'inline-size' }}
          >
            <scene.Component result={result} />
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
