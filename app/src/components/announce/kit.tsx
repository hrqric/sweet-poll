import type { CSSProperties, ReactNode } from 'react'
import { motion } from 'motion/react'
import { composeGrid, gridToRects, DEFAULT_AVATAR, randomAvatar, type Avatar } from '../../lib/sprites'
import type { FeedHit, FeedResult } from '../../lib/resultsFeed'
import { seeded, steps } from './shared'

/**
 * Kit das cenas do Modo cerimônia. Toda cena é um SVG de 160×90 "pixels de NES" esticado pro
 * player (cobre, sem distorcer), com coreografia em motion (degraus, nada de easing liso) e
 * textos em HTML por cima, dimensionados em cqw.
 */
export const W = 160
export const H = 90

export { steps, seeded }

/** Moldura: entra e sai em degraus, desenha o SVG e põe o HTML (`overlay`) por cima. */
export function Stage({ children, overlay, fadeIn = 0.3, className = '' }: { children: ReactNode; overlay?: ReactNode; fadeIn?: number; className?: string }) {
  return (
    <motion.div
      className={`absolute inset-0 ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: fadeIn, ease: steps(3) } }}
      exit={{ opacity: 0, transition: { duration: 0.35, ease: steps(3) } }}
    >
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" shapeRendering="crispEdges" className="absolute inset-0 h-full w-full" aria-hidden>
        {children}
      </svg>
      {overlay}
    </motion.div>
  )
}

const bodyCache = new Map<string, ReturnType<typeof gridToRects>>()
function bodyRects(avatar: Avatar | null | undefined) {
  const key = JSON.stringify(avatar ?? DEFAULT_AVATAR)
  let r = bodyCache.get(key)
  if (!r) {
    r = gridToRects(composeGrid(avatar ?? DEFAULT_AVATAR, { transparent: true }))
    bodyCache.set(key, r)
  }
  return r
}

/**
 * Boneco inteiro (grid 20×22) com os PÉS em (x, y). `s` = escala (1 → 20×22 px de cena).
 * `flip` vira pra esquerda. A origem das transformações fica nos pés, pra girar "caindo".
 */
export function Body({ avatar, x, y, s = 1, flip = false }: { avatar: Avatar | null | undefined; x: number; y: number; s?: number; flip?: boolean }) {
  const rects = bodyRects(avatar)
  const sx = flip ? -s : s
  return (
    <g transform={`translate(${x} ${y}) scale(${sx} ${s}) translate(-10 -22)`}>
      {rects.map((r, i) => <rect key={i} x={r.x} y={r.y} width={r.w} height={1} fill={r.fill} />)}
    </g>
  )
}

/** Grupo do elenco: quem estiver na lista, até `max`; sem ninguém, um trio genérico. */
export function cast(list: FeedHit[], max = 6): FeedHit[] {
  if (list.length) return list.slice(0, max)
  return ['p1', 'p2', 'p3'].map((u, i) => ({ username: u, avatar: i === 0 ? DEFAULT_AVATAR : randomAvatar() }))
}

/** Faixa de legenda no pé: categoria, vencedor e um recado. */
export function Caption({ result, note, tone = 'dark', delay = 1 }: { result: FeedResult; note: ReactNode; tone?: 'dark' | 'light'; delay?: number }) {
  const dark = tone === 'dark'
  return (
    <motion.div
      className={`absolute inset-x-[3cqw] bottom-[3cqw] border-4 border-black ${dark ? 'bg-[#0c0a12]/90 text-paper' : 'bg-paper/95 text-ink'}`}
      style={{ padding: 'max(6px, 1cqw) max(10px, 1.6cqw)' }}
      initial={{ y: '160%' }}
      animate={{ y: 0, transition: { delay, duration: 0.35, ease: steps(4) } }}
    >
      <p className="truncate font-display leading-tight" style={{ fontSize: 'clamp(12px, 2cqw, 26px)' }}>
        <span className={dark ? 'text-coin' : 'text-[#8a5a00]'}>{result.category}:</span> {result.winner}
      </p>
      <p className={`truncate font-display leading-tight ${dark ? 'text-paper-3' : 'text-muted'}`} style={{ fontSize: 'clamp(11px, 1.6cqw, 20px)' }}>
        {note}
      </p>
    </motion.div>
  )
}

/** Letreirão central ("YOU ALL DIED", "WASTED"...). */
export function BigText({ children, color, delay, style, className = '' }: { children: ReactNode; color: string; delay: number; style?: CSSProperties; className?: string }) {
  return (
    <motion.p
      className={`absolute inset-x-0 top-[30%] text-center font-display leading-none ${className}`}
      style={{ color, fontSize: 'clamp(28px, 9cqw, 120px)', letterSpacing: '0.06em', ...style }}
      initial={{ opacity: 0, scale: 1.15 }}
      animate={{ opacity: 1, scale: 1, transition: { delay, duration: 0.8, ease: steps(6) } }}
    >
      {children}
    </motion.p>
  )
}

/** Partículas que se espalham a partir de (x, y): poeira, fumaça, faíscas. */
export function Burst({ x, y, n, delay, colors, spread = 30, up = 18, size = 2, dur = 0.9, seed = 1 }: {
  x: number; y: number; n: number; delay: number; colors: string[]; spread?: number; up?: number; size?: number; dur?: number; seed?: number
}) {
  const rnd = seeded(seed)
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const dx = (rnd() * 2 - 1) * spread
        const dy = -rnd() * up
        const sz = size + Math.round(rnd() * size)
        return (
          <motion.rect
            key={i}
            x={x}
            y={y}
            width={sz}
            height={sz}
            fill={colors[i % colors.length]}
            initial={{ opacity: 0, x: 0, y: 0 }}
            animate={{ opacity: [0, 1, 1, 0], x: [0, dx * 0.6, dx], y: [0, dy, dy + up * 0.4] }}
            transition={{ delay: delay + rnd() * 0.12, duration: dur, ease: steps(6), times: [0, 0.1, 0.6, 1] }}
          />
        )
      })}
    </>
  )
}

/** Tremida da tela inteira num instante. */
export const shake = (delay: number, amp = 3) => ({
  animate: { x: [0, -amp, amp, -amp + 1, amp - 1, 0], y: [0, amp - 1, -amp + 1, 1, -1, 0] },
  transition: { delay, duration: 0.5, ease: steps(6) },
})
