import { useMemo } from 'react'
import { motion } from 'motion/react'
import type { FeedResult } from '../../../lib/resultsFeed'
import { Body, Burst, Caption, H, Stage, W, cast, cq, steps } from '../kit'

/**
 * Duas pessoas · "Dupla dimensional" (homenagem a puzzle de portais): numa sala de testes,
 * cada um dispara um portal no chão à sua frente (um azul, outro laranja), mergulha nele, sai
 * pelo teto lá no meio, os dois caem juntos no centro e batem um high five.
 */
const FIRE = 0.9
const DIVE = 1.6
const DROP = 2.3
const FIVE = 3.0

const BLUE = ['#3fa9ff', '#a8dcff']
const ORANGE = ['#ff9a2a', '#ffd29a']

function Lab() {
  const tiles = []
  for (let y = 0; y < 66; y += 11) for (let x = 0; x < W; x += 16) tiles.push(<rect key={`${x}-${y}`} x={x} y={y} width={15} height={10} fill={(x / 16 + y / 11) % 3 ? '#e8ecef' : '#dde2e6'} />)
  return (
    <>
      <rect width={W} height={H} fill="#c8ced4" />
      {tiles}
      <rect y={0} width={W} height={6} fill="#5a6168" />
      <rect y={66} width={W} height={24} fill="#7a828a" />
      <rect y={66} width={W} height={2} fill="#9aa2aa" />
      {Array.from({ length: 10 }, (_, i) => <rect key={i} x={i * 16} y={68} width={1} height={22} fill="#6a7178" />)}
      {/* plataformas dos lados */}
      <rect x={0} y={50} width={36} height={4} fill="#5a6168" />
      <rect x={124} y={50} width={36} height={4} fill="#5a6168" />
    </>
  )
}

/** Portal oval na horizontal (no chão/teto) ou vertical; `open` controla o tamanho. */
function Portal({ x, y, colors, at }: { x: number; y: number; colors: string[]; at: number }) {
  return (
    <motion.g style={{ originX: 0.5, originY: 0.5 }} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: at, duration: 0.25, ease: steps(4) }}>
      <rect x={x - 9} y={y - 2} width={18} height={4} fill={colors[0]} />
      <rect x={x - 7} y={y - 3} width={14} height={6} fill={colors[0]} />
      <rect x={x - 6} y={y - 1} width={12} height={2} fill="#10141a" />
      <motion.rect x={x - 10} y={y - 4} width={20} height={8} fill={colors[1]} opacity={0.25} animate={{ opacity: [0.1, 0.35, 0.1] }} transition={{ delay: at, duration: 0.6, repeat: 8, ease: steps(2) }} />
    </motion.g>
  )
}

export function DualPortals({ result }: { result: FeedResult }) {
  const duo = useMemo(() => cast(result.hits, 2), [result])
  // cada um: posição inicial na plataforma, portal no chão, saída no teto
  const plan = [
    { start: 18, floor: 40, exit: 72, land: 71, colors: BLUE, flip: false },
    { start: 142, floor: 120, exit: 88, land: 89, colors: ORANGE, flip: true },
  ]

  return (
    <Stage
      overlay={
        <>
          <motion.p
            className="absolute inset-x-0 text-center font-display leading-none text-[#2b3036]"
            style={{ top: cq(14), fontSize: cq(12) }}
            initial={{ opacity: 0, scale: 1.3 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: FIVE + 0.1, duration: 0.3, ease: steps(3) }}
          >
            HIGH FIVE!
          </motion.p>
          <Caption result={result} note={`${duo[0]?.username} e ${duo[1]?.username} acertaram juntos.`} delay={FIVE + 1} />
        </>
      }
    >
      <Lab />
      {plan.map((p, i) => (
        <g key={i}>
          {/* tiro do portal: um raio rápido até o chão */}
          <motion.rect
            x={Math.min(p.start, p.floor)}
            y={44}
            width={Math.abs(p.floor - p.start)}
            height={1}
            fill={p.colors[0]}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ delay: FIRE + i * 0.1, duration: 0.25, ease: steps(3) }}
          />
          <Portal x={p.floor} y={66} colors={p.colors} at={FIRE + 0.15 + i * 0.1} />
          {/* pula da plataforma pro portal do chão... */}
          <motion.g
            initial={{ x: 0, y: 0, opacity: 1 }}
            animate={{ x: [0, 0, p.floor - p.start, p.floor - p.start], y: [0, 0, -6, 22], opacity: [1, 1, 1, 0] }}
            transition={{ delay: DIVE + i * 0.05, duration: 0.6, times: [0, 0.1, 0.5, 1], ease: steps(6) }}
          >
            <Body avatar={p.flip ? duo[1]?.avatar : duo[0]?.avatar} x={p.start} y={50} s={0.72} flip={p.flip} />
          </motion.g>
          {/* ...e cai do teto no meio */}
          <motion.g
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: [-60, -60, 0], opacity: [0, 1, 1] }}
            transition={{ delay: DROP, duration: 0.6, times: [0, 0.05, 1], ease: steps(6) }}
          >
            <motion.g animate={{ y: [0, 0, -4, 0, -4, 0] }} transition={{ delay: FIVE + 0.6, duration: 1.6, ease: steps(1) }}>
              <Body avatar={p.flip ? duo[1]?.avatar : duo[0]?.avatar} x={p.land} y={66} s={0.72} flip={p.flip} />
            </motion.g>
          </motion.g>
        </g>
      ))}
      {/* teto e portais de saída por cima: eles "saem" de dentro do teto */}
      <rect y={0} width={W} height={6} fill="#5a6168" />
      {plan.map((p, i) => <Portal key={i} x={p.exit} y={6} colors={p.colors} at={FIRE + 0.4 + i * 0.1} />)}
      {/* as mãos se encontram */}
      <motion.g initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 1, 0] }} transition={{ delay: FIVE, duration: 0.8, times: [0, 0.1, 0.7, 1], ease: steps(2) }}>
        <rect x={77} y={46} width={3} height={4} fill="#f0b888" />
        <rect x={80} y={46} width={3} height={4} fill="#d89060" />
      </motion.g>
      <Burst x={80} y={46} n={16} delay={FIVE} colors={[...BLUE, ...ORANGE]} spread={16} up={12} size={1} dur={0.8} seed={101} />
    </Stage>
  )
}
