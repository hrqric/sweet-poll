import { useId, type CSSProperties, type ReactNode } from 'react'
import { motion } from 'motion/react'
import type { FeedResult } from '../../lib/resultsFeed'
import { headRects, seeded, steps } from './shared'

// cena em 160×90 "pixels de NES", esticada pro tamanho do player
const W = 160
const NEON = ['#ff2a6d', '#05d9e8', '#f9f002'] as const

type Rect = { x: number; y: number; w: number; h: number; fill: string; o?: number }

/** Prédios de um "ladrilho" de 160 px que se repete enquanto rola (gerado uma vez, com semente). */
function skyline(seed: number, opts: { base: number; minH: number; maxH: number; minW: number; maxW: number; body: string; signs: boolean }) {
  const rnd = seeded(seed)
  const out: Rect[] = []
  let x = 0
  while (x < W) {
    const w = Math.min(W - x, Math.round(opts.minW + rnd() * (opts.maxW - opts.minW)))
    const h = Math.round(opts.minH + rnd() * (opts.maxH - opts.minH))
    const top = opts.base - h
    out.push({ x, y: top, w, h, fill: opts.body })
    // janelas: a maioria apagada, umas poucas acesas em neon
    for (let wy = top + 2; wy < opts.base - 2; wy += 4) {
      for (let wx = x + 1; wx < x + w - 1; wx += 3) {
        const r = rnd()
        if (r < 0.22) out.push({ x: wx, y: wy, w: 1, h: 2, fill: r < 0.04 ? NEON[Math.floor(rnd() * 3)] : '#3a2766' })
      }
    }
    if (opts.signs && rnd() < 0.65 && w > 6) {
      const c = NEON[Math.floor(rnd() * 3)]
      const sh = 6 + Math.round(rnd() * 8)
      const sy = top + 3 + Math.round(rnd() * 6)
      out.push({ x: x + 2, y: sy, w: 3, h: sh, fill: c })
      out.push({ x: x + 3, y: sy + 1, w: 1, h: sh - 2, fill: '#ffffff', o: 0.55 })
      // reflexo da placa no asfalto molhado
      out.push({ x: x + 2, y: 76, w: 3, h: 8, fill: c, o: 0.22 })
    }
    x += w + (rnd() < 0.3 ? 1 : 0)
  }
  return out
}

const FAR = skyline(7, { base: 62, minH: 14, maxH: 34, minW: 7, maxW: 16, body: '#22103b', signs: false })
const MID = skyline(23, { base: 71, minH: 20, maxH: 46, minW: 10, maxW: 22, body: '#130923', signs: true })

const Tile = ({ rects }: { rects: Rect[] }) => (
  <>
    {rects.map((r, i) => <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} fill={r.fill} opacity={r.o} />)}
  </>
)

/**
 * Camada que rola em loop: o ladrilho de `dist` px se repete até cobrir a cena inteira (+1 de folga)
 * e anda `dist` px em `t` segundos, em degraus de 1 px.
 */
function Loop({ dist, t, children }: { dist: number; t: number; children: ReactNode }) {
  const copies = Math.ceil(W / dist) + 1
  return (
    <g className="sp-loop" style={{ '--d': dist, '--t': `${t}s`, '--n': dist } as CSSProperties}>
      {Array.from({ length: copies }, (_, i) => (
        <g key={i} transform={`translate(${i * dist} 0)`}>{children}</g>
      ))}
    </g>
  )
}

function Car({ result }: { result: FeedResult }) {
  const clip = useId()
  const head = headRects(result.hits[0]?.avatar)
  return (
    <g className="sp-drive">
      {/* farol */}
      <polygon points="44,8 74,3 74,15 44,10" fill="#fff6a8" opacity={0.16} />
      <g className="sp-bounce">
        {/* luz neon embaixo do carro */}
        <rect x={2} y={15} width={40} height={2} fill="#05d9e8" opacity={0.28} />
        {/* cabine: teto, colunas e vidro */}
        <rect x={12} y={0} width={17} height={1} fill="#5fe3d6" />
        <rect x={11} y={1} width={19} height={1} fill="#0fb5a9" />
        <rect x={10} y={2} width={1} height={5} fill="#0fb5a9" />
        <rect x={30} y={2} width={1} height={5} fill="#0fb5a9" />
        <clipPath id={clip}><rect x={11} y={2} width={19} height={5} /></clipPath>
        <rect x={11} y={2} width={19} height={5} fill="#0c0a14" />
        <rect x={12} y={2} width={2} height={1} fill="#3b3456" />
        {/* o vencedor no volante */}
        <g clipPath={`url(#${clip})`}>
          <g transform="translate(20.6 1.4) scale(0.5) translate(-2 0)">
            {head.map((r, i) => <rect key={i} x={r.x} y={r.y} width={r.w} height={1} fill={r.fill} />)}
          </g>
        </g>
        <rect x={19} y={2} width={1} height={5} fill="#0a7a72" />
        <rect x={0} y={7} width={44} height={6} fill="#0fb5a9" />
        <rect x={28} y={6} width={14} height={1} fill="#0fb5a9" />
        <rect x={2} y={7} width={40} height={1} fill="#5fe3d6" />
        <rect x={0} y={11} width={44} height={2} fill="#0a7a72" />
        <rect x={4} y={9} width={36} height={1} fill="#ff2a6d" />
        <rect x={42} y={8} width={2} height={4} fill="#d9e3f0" />
        <rect x={0} y={8} width={2} height={4} fill="#d9e3f0" />
        <rect x={42} y={7} width={2} height={2} fill="#fff6a8" />
        <rect x={0} y={7} width={2} height={2} fill="#ff2a6d" />
        <rect x={4} y={13} width={36} height={1} fill="#05d9e8" />
        {[6, 31].map((wx) => (
          <g key={wx}>
            <rect x={wx} y={11} width={7} height={5} fill="#0c0a14" />
            <rect className="sp-spin-a" x={wx + 2} y={12} width={2} height={2} fill="#8a8aa0" />
            <rect className="sp-spin-b" x={wx + 3} y={13} width={2} height={2} fill="#8a8aa0" />
          </g>
        ))}
      </g>
    </g>
  )
}

/** "Vitória solitária": só uma pessoa acertou, e ela sai de carro pela cidade neon. */
export function DriveScene({ result }: { result: FeedResult }) {
  const who = result.hits[0]?.username ?? ''
  return (
    <motion.div
      className="absolute inset-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.3, ease: steps(3) } }}
      exit={{ opacity: 0, transition: { duration: 0.3, ease: steps(3) } }}
    >
      <svg viewBox={`0 0 ${W} 90`} preserveAspectRatio="xMidYMid slice" shapeRendering="crispEdges" className="absolute inset-0 h-full w-full" aria-hidden>
        <rect width={W} height={90} fill="#0d0618" />
        <rect y={34} width={W} height={20} fill="#170a2c" />
        <rect y={50} width={W} height={12} fill="#2a1146" />
        <Loop dist={W} t={14}><Tile rects={FAR} /></Loop>
        <Loop dist={W} t={6}><Tile rects={MID} /></Loop>
        {/* calçada, meio-fio e asfalto */}
        <rect y={71} width={W} height={3} fill="#231a33" />
        <rect y={73} width={W} height={1} fill="#3b2f55" />
        <rect y={74} width={W} height={16} fill="#100c18" />
        <Loop dist={40} t={1.4}>
          {[0].map((x) => (
            <g key={x}>
              <rect x={x + 8} y={48} width={1} height={23} fill="#3a3050" />
              <rect x={x + 6} y={47} width={4} height={1} fill="#4a3f66" />
              <rect x={x + 6} y={48} width={4} height={1} fill="#f9f002" />
              <rect x={x + 4} y={49} width={8} height={3} fill="#f9f002" opacity={0.12} />
            </g>
          ))}
        </Loop>
        <Loop dist={16} t={0.35}>
          <rect x={0} y={82} width={8} height={1} fill="#c8b838" />
        </Loop>
        <g transform="translate(58 62)">
          <Car result={result} />
        </g>
      </svg>

      <motion.div
        className="absolute left-[4cqw] top-[4cqw] max-w-[60cqw] border-4 border-black bg-[#0d0618]/90 text-paper"
        style={{ padding: 'max(10px, 1.6cqw) max(12px, 2cqw)' }}
        initial={{ x: '-120%' }}
        animate={{ x: 0, transition: { delay: 0.5, duration: 0.4, ease: steps(5) } }}
      >
        <span className="inline-block bg-[#ff2a6d] px-[0.8cqw] font-display leading-tight text-ink" style={{ fontSize: 'clamp(11px, 1.6cqw, 20px)' }}>
          Vitória solitária
        </span>
        <p className="mt-[0.8cqw] font-display leading-none text-[#05d9e8]" style={{ fontSize: 'clamp(12px, 1.9cqw, 24px)' }}>{result.category}</p>
        <p className="line-clamp-2 font-display leading-[0.95] break-words" style={{ fontSize: 'clamp(18px, 4.2cqw, 54px)' }}>{result.winner}</p>
        <p className="mt-[0.8cqw] font-display leading-none text-coin" style={{ fontSize: 'clamp(12px, 2cqw, 26px)' }}>
          Só {who} acertou · +{result.value}
        </p>
      </motion.div>
    </motion.div>
  )
}
