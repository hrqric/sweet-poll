import { useMemo } from 'react'
import { motion } from 'motion/react'
import type { FeedResult } from '../../../lib/resultsFeed'
import { SKIN } from '../../../lib/sprites'
import { BigText, Body, Burst, Caption, H, Stage, W, cast, seeded, shake, steps } from '../kit'

/**
 * Três ou mais · "Extração bem-sucedida" (homenagem a co-op de tiro sci-fi): os vencedores caem
 * em cápsulas orbitais, seguram a posição contra os insetos, correm pra nave de extração e batem
 * continência antes de decolar.
 */
const LAND = 1.2
const FIGHT = 1.8
const SHIP = 3.8
const RUN = 4.5
const SALUTE = 5.4
const LIFT = 6.6

function Planet() {
  const rnd = seeded(13)
  return (
    <>
      <rect width={W} height={H} fill="#2a1616" />
      <rect y={20} width={W} height={16} fill="#3a1e1a" />
      <rect y={36} width={W} height={20} fill="#4d2620" />
      <rect x={20} y={8} width={6} height={6} fill="#e8b070" opacity={0.6} />
      {[[0, 56, 30, 8], [40, 58, 24, 6], [100, 54, 36, 10], [138, 57, 24, 7]].map(([x, y, w, h], i) => (
        <rect key={i} x={x} y={y - h} width={w} height={h} fill="#3a2018" />
      ))}
      <rect y={56} width={W} height={34} fill="#5a3a2a" />
      <rect y={56} width={W} height={1} fill="#7a4e36" />
      {Array.from({ length: 24 }, (_, i) => <rect key={i} x={Math.floor(rnd() * W)} y={58 + Math.floor(rnd() * 30)} width={2 + Math.floor(rnd() * 4)} height={1} fill="#4a2e20" />)}
    </>
  )
}

function Pod({ x, at }: { x: number; at: number }) {
  return (
    <motion.g initial={{ y: -80 }} animate={{ y: 0 }} transition={{ delay: at, duration: 0.5, ease: steps(5) }}>
      <motion.g animate={{ opacity: [1, 1, 0] }} transition={{ delay: at, duration: 0.6, times: [0, 0.8, 1] }}>
        <rect x={x - 1} y={18} width={4} height={18} fill="#ffb13b" opacity={0.6} />
        <rect x={x} y={26} width={2} height={14} fill="#ffe27a" opacity={0.8} />
      </motion.g>
      <rect x={x - 3} y={42} width={8} height={14} fill="#3d4248" />
      <rect x={x - 3} y={45} width={8} height={2} fill="#f2c230" />
      <rect x={x - 2} y={40} width={6} height={2} fill="#5a6168" />
      <rect x={x - 1} y={49} width={4} height={3} fill="#9fd0ea" />
    </motion.g>
  )
}

/** Insetão alienígena andando da direita. */
function Bug({ x, y, dieAt }: { x: number; y: number; dieAt: number }) {
  return (
    <motion.g initial={{ x: 40 }} animate={{ x: [40, 0], opacity: [1, 1, 0] }} transition={{ delay: FIGHT - 0.4, duration: dieAt - FIGHT + 0.4, times: [0, 1], ease: steps(10), opacity: { delay: dieAt, duration: 0.05 } }}>
      <rect x={x} y={y - 6} width={10} height={5} fill="#d2691e" />
      <rect x={x + 8} y={y - 8} width={4} height={4} fill="#a0522d" />
      <rect x={x + 10} y={y - 7} width={1} height={1} fill="#ffe27a" />
      <rect x={x + 1} y={y - 1} width={1} height={2} fill="#2a1616" />
      <rect x={x + 4} y={y - 1} width={1} height={2} fill="#2a1616" />
      <rect x={x + 7} y={y - 1} width={1} height={2} fill="#2a1616" />
      <rect x={x - 2} y={y - 5} width={2} height={1} fill="#a0522d" />
    </motion.g>
  )
}

export function Extraction({ result }: { result: FeedResult }) {
  const squad = useMemo(() => cast(result.hits, 6), [result])
  const gap = Math.min(14, 70 / squad.length)
  const px = (i: number) => 40 + i * gap
  const bugs = [0, 1, 2, 3, 4].map((k) => ({ x: 118 + (k % 3) * 9, y: 66 + (k % 2) * 4, die: FIGHT + 0.5 + k * 0.35 }))

  return (
    <Stage
      overlay={
        <>
          <BigText color="#f2c230" delay={LIFT + 0.2} style={{ textShadow: '0.5cqw 0.5cqw 0 #000', fontSize: 'clamp(22px, 7cqw, 96px)' }}>
            EXTRACTION COMPLETE
          </BigText>
          <Caption result={result} note={`${result.hits.length} acertaram. Ninguém ficou pra trás.`} delay={LIFT + 0.8} />
        </>
      }
    >
      <motion.g {...shake(LAND, 2)}>
        <Planet />
        {squad.map((_, i) => <Pod key={i} x={px(i)} at={0.3 + i * 0.12} />)}
        <Burst x={70} y={56} n={20} delay={LAND} colors={['#7a4e36', '#a0705a']} spread={50} up={10} size={2} dur={0.8} seed={15} />
        {bugs.map((b, k) => (
          <g key={k}>
            <Bug x={b.x} y={b.y} dieAt={b.die} />
            <Burst x={b.x + 4} y={b.y - 4} n={8} delay={b.die} colors={['#7fff3a', '#d2691e']} spread={8} up={8} size={1} dur={0.5} seed={k + 20} />
          </g>
        ))}
        {/* nave de extração desce pela esquerda e depois decola com todo mundo */}
        <motion.g initial={{ y: -60 }} animate={{ y: [-60, 0, 0, -90] }} transition={{ delay: SHIP, duration: LIFT - SHIP + 1, times: [0, 0.3, 0.72, 1], ease: steps(10) }}>
          <rect x={2} y={40} width={34} height={12} fill="#5a6168" />
          <rect x={8} y={34} width={22} height={6} fill="#7a828a" />
          <rect x={12} y={35} width={8} height={4} fill="#9fd0ea" />
          <rect x={2} y={52} width={34} height={2} fill="#3d4248" />
          <rect className="sp-blink" x={4} y={42} width={2} height={2} fill="#ff4d4d" />
          <rect className="sp-blink-b" x={32} y={42} width={2} height={2} fill="#7fff3a" />
          <rect x={34} y={46} width={6} height={8} fill="#3d4248" />
        </motion.g>
        {/* esquadrão: aparece das cápsulas, atira, corre pra nave, continência, some no embarque */}
        {squad.map((p, i) => (
          <motion.g key={i} initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 1, 0] }} transition={{ delay: LAND + 0.3, duration: LIFT - LAND - 0.2, times: [0, 0.02, 0.97, 1], ease: 'linear' }}>
            {/* corre e forma fila ao lado da nave pra continência */}
            <motion.g animate={{ x: [0, 0, 44 + i * 9 - (px(i) + 6)] }} transition={{ delay: RUN, duration: 0.8, times: [0, 0.01, 1], ease: steps(8) }}>
              <Body avatar={p.avatar} x={px(i) + 6} y={68} s={0.6} />
              {/* tiros: tracejado amarelo até os insetos */}
              <motion.rect x={px(i) + 12} y={58} height={1} fill="#ffe27a" initial={{ width: 0, opacity: 0 }} animate={{ width: [0, 60, 0], opacity: [0, 1, 0] }} transition={{ delay: FIGHT + 0.3 + (i % 3) * 0.2, duration: 0.3, repeat: 3, repeatDelay: 0.25, ease: steps(3) }} />
              {/* continência: mão na testa */}
              <motion.rect x={px(i) + 7} y={55} width={3} height={2} fill={SKIN[p.avatar?.skin ?? 0]} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: SALUTE + i * 0.08, duration: 0.01 }} />
            </motion.g>
          </motion.g>
        ))}
      </motion.g>
    </Stage>
  )
}
