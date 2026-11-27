import type { CSSProperties, ReactNode } from 'react'
import { motion } from 'motion/react'
import type { FeedResult } from '../../lib/resultsFeed'
import { seeded, steps } from './shared'

const W = 160

type Rect = { x: number; y: number; w: number; h: number; fill: string; o?: number }

/** Marolas: tracinhos claros e escuros espalhados na água (ladrilho de 160 px, com semente). */
function waves(seed: number, colors: string[], count: number): Rect[] {
  const rnd = seeded(seed)
  return Array.from({ length: count }, () => {
    const y = 52 + Math.floor(rnd() * 37)
    // mais perto da câmera (embaixo), marola maior
    const w = 2 + Math.round(rnd() * (2 + (y - 52) / 6))
    return { x: Math.floor(rnd() * (W - w)), y, w, h: 1, fill: colors[Math.floor(rnd() * colors.length)] }
  })
}

const WAVES_SLOW = waves(3, ['#2f3f42', '#334548'], 70)
const WAVES_FAST = waves(11, ['#151e20', '#192325'], 50)
/** Faixa de neblina com bordas em degrau (não um retângulo chapado). */
function fogBand(x: number, y: number, w: number, h: number, o: number): Rect[] {
  const fill = '#8a9696'
  return [
    { x: x + 8, y: y - 2, w: w - 16, h: 1, fill, o: o * 0.5 },
    { x: x + 3, y: y - 1, w: w - 6, h: 1, fill, o: o * 0.75 },
    { x, y, w, h, fill, o },
    { x: x + 4, y: y + h, w: w - 8, h: 1, fill, o: o * 0.75 },
    { x: x + 10, y: y + h + 1, w: w - 20, h: 1, fill, o: o * 0.5 },
  ]
}
const FOG: Rect[] = [
  ...fogBand(0, 40, 70, 4, 0.22),
  ...fogBand(88, 44, 52, 3, 0.18),
  ...fogBand(28, 55, 62, 2, 0.12),
  ...fogBand(118, 60, 38, 2, 0.1),
]

const Tile = ({ rects }: { rects: Rect[] }) => (
  <>{rects.map((r, i) => <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} fill={r.fill} opacity={r.o} />)}</>
)

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

/** Barquinho de alumínio com motor de popa, parado e vazio. Coordenadas locais (0,0) = canto da borda. */
function Boat() {
  const hull: [number, number, number, string][] = [
    [7, 2, 44, '#4a6264'], [8, 3, 44, '#4a6264'], [9, 4, 43, '#41585a'],
    [10, 6, 42, '#3a4f51'], [11, 8, 41, '#33474a'],
  ]
  return (
    <g className="sp-bob">
      {/* proa levantada */}
      <rect x={0} y={2} width={3} height={2} fill="#5a7072" />
      <rect x={1} y={4} width={2} height={2} fill="#5a7072" />
      {/* borda, interior escuro e bancos */}
      <rect x={3} y={2} width={42} height={1} fill="#6d8486" />
      <rect x={4} y={3} width={40} height={3} fill="#141b1c" />
      <rect x={16} y={3} width={3} height={3} fill="#4d4031" />
      <rect x={30} y={3} width={3} height={3} fill="#4d4031" />
      {/* frisos amarelos gastos */}
      <rect x={2} y={6} width={44} height={1} fill="#a8944a" />
      {hull.map(([y, x0, x1, c]) => <rect key={y} x={x0} y={y} width={x1 - x0 + 1} height={1} fill={c} />)}
      {/* motor de popa */}
      <rect x={44} y={3} width={2} height={5} fill="#2a3234" />
      <rect x={45} y={-7} width={7} height={1} fill="#8a9aa0" />
      <rect x={45} y={-6} width={7} height={6} fill="#5d6c70" />
      <rect x={45} y={-3} width={7} height={1} fill="#a8b4b8" />
      <rect x={47} y={0} width={4} height={5} fill="#3a4448" />
      <rect x={48} y={5} width={2} height={8} fill="#232b2d" />
    </g>
  )
}

/** "Ninguém acertou": o barco vazio na neblina, água escura balançando. */
export function BoatScene({ result }: { result: FeedResult }) {
  return (
    <motion.div
      className="absolute inset-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.6, ease: steps(4) } }}
      exit={{ opacity: 0, transition: { duration: 0.5, ease: steps(4) } }}
    >
      <svg viewBox={`0 0 ${W} 90`} preserveAspectRatio="xMidYMid slice" shapeRendering="crispEdges" className="absolute inset-0 h-full w-full" aria-hidden>
        <rect width={W} height={22} fill="#323e3e" />
        <rect y={22} width={W} height={14} fill="#3c4848" />
        <rect y={36} width={W} height={9} fill="#475454" />
        <rect y={45} width={W} height={6} fill="#546161" />
        <rect y={50} width={W} height={1} fill="#5f6c6c" />
        <rect y={51} width={W} height={6} fill="#243133" />
        <rect y={57} width={W} height={33} fill="#1c2729" />
        <Loop dist={W} t={22}><Tile rects={WAVES_SLOW} /></Loop>
        <Loop dist={W} t={13}><Tile rects={WAVES_FAST} /></Loop>

        {/* estaca de madeira e a corda até o motor */}
        <rect x={141} y={38} width={2} height={2} fill="#3b3229" />
        <rect x={140} y={40} width={4} height={32} fill="#3b3229" />
        <rect x={140} y={40} width={1} height={32} fill="#4f4436" />
        <g className="sp-bob">
          {[[122, 59], [125, 59], [128, 60], [131, 60], [134, 61], [137, 61]].map(([x, y]) => (
            <rect key={x} x={x} y={y} width={3} height={1} fill="#6b5a40" />
          ))}
        </g>

        <g transform="translate(70 57)"><Boat /></g>
        {/* marolas batendo no casco */}
        <rect className="sp-blink" x={74} y={70} width={4} height={1} fill="#3a4b4e" />
        <rect className="sp-blink-b" x={100} y={70} width={5} height={1} fill="#3a4b4e" />
        <rect className="sp-blink" x={112} y={71} width={3} height={1} fill="#3a4b4e" />

        <Loop dist={W} t={30}><Tile rects={FOG} /></Loop>
      </svg>

      <motion.div
        className="absolute inset-x-0 top-[7cqw] text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { delay: 1, duration: 0.6, ease: steps(4) } }}
      >
        <p className="font-display leading-none text-[#dfe6e6]" style={{ fontSize: 'clamp(22px, 5cqw, 64px)', textShadow: '0.4cqw 0.4cqw 0 #1c2729' }}>
          Ninguém acertou essa.
        </p>
        <p className="mt-[1cqw] font-display leading-tight text-[#a9b8b8]" style={{ fontSize: 'clamp(13px, 2.2cqw, 28px)' }}>
          {result.category}: {result.winner}
        </p>
        <p className="mt-[0.6cqw] font-display text-[#7d8f8f]" style={{ fontSize: 'clamp(11px, 1.6cqw, 20px)' }}>
          Os {result.value} pontos ficaram no barco.
        </p>
      </motion.div>
    </motion.div>
  )
}
