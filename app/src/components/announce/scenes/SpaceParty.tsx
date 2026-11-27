import { motion } from 'motion/react'
import type { FeedResult } from '../../../lib/resultsFeed'
import { Body, Burst, Caption, H, Stage, W, seeded, steps } from '../kit'

/**
 * Acertou sozinho · "Celebração espacial" (homenagem a plataforma com robôs): uma navezinha
 * pousa num planeta, o vencedor pula pra fora e faz a dança da vitória enquanto robôs
 * espectadores surgem dos lados jogando confete e soltando fogos.
 */
const LAND = 1.4
const JUMP = 1.9
const DANCE = 2.5

function Space() {
  const rnd = seeded(77)
  return (
    <>
      <rect width={W} height={H} fill="#0b0f2a" />
      {Array.from({ length: 40 }, (_, i) => {
        const x = Math.floor(rnd() * W)
        const y = Math.floor(rnd() * 60)
        return <rect key={i} className={i % 3 ? undefined : i % 2 ? 'sp-blink' : 'sp-blink-b'} x={x} y={y} width={1} height={1} fill={i % 5 ? '#ffffff' : '#9fd8ff'} />
      })}
      {/* planeta grande no céu */}
      {Array.from({ length: 18 }, (_, k) => {
        const rw = Math.round(2 * Math.sqrt(81 - (k - 9) ** 2) * 1.1)
        return <rect key={k} x={128 - rw / 2} y={8 + k} width={rw} height={1} fill={k < 5 ? '#f78fb3' : k < 11 ? '#e0648f' : '#b84a75'} />
      })}
      <rect x={110} y={17} width={36} height={1} fill="#ffd1e3" opacity={0.7} />
      {/* chão roxo com crateras */}
      <rect y={66} width={W} height={24} fill="#5b3f9c" />
      <rect y={66} width={W} height={2} fill="#7d5fc4" />
      {[[14, 72, 10], [60, 78, 14], [118, 74, 8], [140, 82, 12]].map(([x, y, w], i) => (
        <g key={i}><rect x={x} y={y} width={w} height={2} fill="#45307a" /><rect x={x + 1} y={y + 2} width={w - 2} height={1} fill="#7d5fc4" /></g>
      ))}
    </>
  )
}

function Ship() {
  return (
    <motion.g
      initial={{ x: -60, y: -50 }}
      animate={{ x: [-60, -10, 0], y: [-50, -12, 0] }}
      transition={{ duration: LAND, times: [0, 0.7, 1], ease: steps(12) }}
    >
      {/* fogo do propulsor, apaga no pouso */}
      <motion.g animate={{ opacity: [1, 1, 0] }} transition={{ duration: LAND + 0.1, times: [0, 0.9, 1] }}>
        <rect className="sp-spin-a" x={70} y={66} width={8} height={3} fill="#ffb13b" />
        <rect className="sp-spin-b" x={71} y={66} width={6} height={5} fill="#ffe27a" />
      </motion.g>
      <rect x={62} y={56} width={24} height={10} fill="#e8eef5" />
      <rect x={66} y={50} width={16} height={6} fill="#e8eef5" />
      <rect x={62} y={63} width={24} height={3} fill="#9aa8b8" />
      <rect x={58} y={60} width={4} height={6} fill="#ff5a5a" />
      <rect x={86} y={60} width={4} height={6} fill="#ff5a5a" />
      {/* escotilha: abre quando ele pula */}
      <motion.rect x={69} y={51} width={10} height={5} fill="#4fc3f7" animate={{ fill: ['#4fc3f7', '#4fc3f7', '#0b0f2a'] }} transition={{ delay: JUMP - 0.2, duration: 0.2, times: [0, 0.5, 1] }} />
      <rect x={70} y={52} width={2} height={1} fill="#ffffff" />
    </motion.g>
  )
}

/** Robozinho espectador (cabeça de visor, antena), pés em (x, y). */
function Robot({ x, y, flip }: { x: number; y: number; flip?: boolean }) {
  const f = flip ? -1 : 1
  return (
    <g transform={`translate(${x} ${y}) scale(${f} 1)`}>
      <rect x={-4} y={-14} width={8} height={7} fill="#cfd8e3" />
      <rect x={-3} y={-12} width={6} height={3} fill="#1c2b4a" />
      <rect x={-2} y={-11} width={1} height={1} fill="#4fe0ff" />
      <rect x={1} y={-11} width={1} height={1} fill="#4fe0ff" />
      <rect x={0} y={-17} width={1} height={3} fill="#9aa8b8" />
      <rect x={-1} y={-18} width={2} height={1} fill="#ff5a5a" />
      <rect x={-3} y={-7} width={6} height={5} fill="#aebccb" />
      <rect x={-5} y={-6} width={2} height={3} fill="#cfd8e3" />
      <rect x={3} y={-8} width={2} height={3} fill="#cfd8e3" />
      <rect x={-3} y={-2} width={2} height={2} fill="#7d8a99" />
      <rect x={1} y={-2} width={2} height={2} fill="#7d8a99" />
    </g>
  )
}

export function SpaceParty({ result }: { result: FeedResult }) {
  const who = result.hits[0]
  const fireworks = [[40, 20, DANCE + 0.6, ['#ff5a5a', '#ffe27a']], [120, 30, DANCE + 1.6, ['#4fe0ff', '#ffffff']], [80, 14, DANCE + 2.6, ['#7bd389', '#f78fb3']]] as const
  return (
    <Stage overlay={<Caption result={result} note={`Só ${who?.username ?? ''} acertou. Pouso perfeito: +${result.value}`} delay={DANCE + 1} />}>
      <Space />
      <Ship />
      {/* pulo pra fora da nave e dança: pulinhos virando de um lado pro outro */}
      <motion.g initial={{ opacity: 0, x: 74, y: 54 }} animate={{ opacity: [0, 1, 1, 1], x: [74, 64, 50, 50], y: [54, 38, 66, 66] }} transition={{ delay: JUMP, duration: 0.6, times: [0, 0.1, 0.9, 1], ease: steps(6) }}>
        <motion.g animate={{ y: [0, -4, 0, -4, 0, -6, 0, -4, 0, -4, 0, -6, 0], scaleX: [1, 1, -1, -1, 1, 1, -1, -1, 1, 1, -1, -1, 1] }} transition={{ delay: DANCE, duration: 4.2, ease: steps(1) }} style={{ originX: 0.5, originY: 1 }}>
          <Body avatar={who?.avatar} x={0} y={0} s={0.85} />
        </motion.g>
      </motion.g>
      {/* robôs surgindo dos cantos */}
      {[[12, false], [26, false], [134, true], [148, true]].map(([x, flip], i) => (
        <motion.g key={i} initial={{ y: 40, opacity: 0 }} animate={{ y: [40, 0, 0], opacity: [0, 1, 1] }} transition={{ delay: DANCE + 0.2 + i * 0.15, duration: 0.5, ease: steps(4) }}>
          <motion.g animate={{ y: [0, -2, 0] }} transition={{ delay: DANCE + 0.8, duration: 0.5, repeat: 8, ease: steps(2) }}>
            <Robot x={x as number} y={70} flip={flip as boolean} />
          </motion.g>
        </motion.g>
      ))}
      <Burst x={20} y={52} n={16} delay={DANCE + 0.9} colors={['#ff5a5a', '#ffe27a', '#4fe0ff', '#7bd389']} spread={22} up={26} size={1} dur={2} seed={71} />
      <Burst x={140} y={52} n={16} delay={DANCE + 1.2} colors={['#f78fb3', '#ffe27a', '#4fe0ff', '#ffffff']} spread={22} up={26} size={1} dur={2} seed={72} />
      {/* fogos: sobem e estouram */}
      {fireworks.map(([x, y, t, colors], i) => (
        <g key={i}>
          <motion.rect x={x} y={66} width={1} height={3} fill="#ffffff" initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 1, 0], y: [0, 0, y - 66, y - 66] }} transition={{ delay: t - 0.6, duration: 0.65, times: [0, 0.05, 0.95, 1], ease: steps(6) }} />
          <Burst x={x} y={y} n={18} delay={t} colors={[...colors]} spread={18} up={10} size={1} dur={1.2} seed={i + 80} />
        </g>
      ))}
    </Stage>
  )
}
