import { useEffect } from 'react'
import { AnimatePresence } from 'motion/react'
import { sfx } from '../lib/sfx'
import type { FeedResult } from '../lib/resultsFeed'
import { CardA, MAX_SPRITES } from './announce/CardA'
import { DriveScene } from './announce/DriveScene'
import { BoatScene } from './announce/BoatScene'

export type SceneKind = 'card' | 'drive' | 'boat'

/** Qual cena cada resultado ganha. A placa (animação A) segue de reserva pra 2+ acertos. */
export function sceneFor(r: FeedResult): SceneKind {
  if (r.hits.length === 0) return 'boat'
  if (r.hits.length === 1) return 'drive'
  return 'card'
}

const DURATION: Record<SceneKind, (r: FeedResult) => number> = {
  card: (r) => 8000 + Math.max(0, Math.min(r.hits.length, MAX_SPRITES) - 3) * 500,
  drive: () => 9500,
  boat: () => 9000,
}

const SOUND: Record<SceneKind, () => void> = { card: sfx.win, drive: sfx.drive, boat: sfx.sad }

/**
 * Anúncio do vencedor por cima do player. Ocupa o pai inteiro (absolute inset-0) e não bloqueia
 * cliques no vídeo embaixo. Tamanhos em cqw: escala junto com o player, do embed pequeno à tela cheia.
 */
export function WinnerAnnouncement({ result, onDone }: { result: FeedResult | null; onDone: () => void }) {
  const kind = result ? sceneFor(result) : null

  useEffect(() => {
    if (!result || !kind) return
    SOUND[kind]()
    const t = setTimeout(onDone, DURATION[kind](result))
    return () => clearTimeout(t)
  }, [result, kind, onDone])

  return (
    // a região viva fica no contêiner que já existe: leitor de tela só anuncia mudança em região montada antes
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ containerType: 'inline-size' }}
      role="status"
      aria-live="polite"
    >
      <AnimatePresence>
        {result && kind === 'card' && <CardA key={result.category_id + result.set_at} result={result} />}
        {result && kind === 'drive' && <DriveScene key={result.category_id + result.set_at} result={result} />}
        {result && kind === 'boat' && <BoatScene key={result.category_id + result.set_at} result={result} />}
      </AnimatePresence>
    </div>
  )
}
