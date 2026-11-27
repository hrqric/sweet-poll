import { useMemo } from 'react'
import { motion } from 'motion/react'
import type { FeedHit, FeedResult } from '../../../lib/resultsFeed'
import { SKIN } from '../../../lib/sprites'
import { Body, Burst, Caption, H, Portrait, Stage, W, cast, cq, seeded, steps } from '../kit'

/**
 * Três ou mais · "Seleção de personagens" (homenagem a jogo de luta): tela de seleção com os
 * retratos, os cursores escolhem cada vencedor em sequência, corta pra arena e todo mundo faz
 * pose de vitória: PERFECT!
 */
const PICK = 0.6
const CUT = 2.9
const WIN = 3.5

const CURSORS = ['#ff3b30', '#2e8bff', '#3ccf4e', '#ffd23f', '#c050ff', '#ff8a2a']

function SelectScreen({ crew }: { crew: FeedHit[] }) {
  const cols = 4
  const slot = (i: number) => ({ x: 28 + (i % cols) * 27, y: 20 + Math.floor(i / cols) * 30 })
  const total = 8
  const rnd = seeded(81)
  return (
    <g>
      <rect width={W} height={H} fill="#141a3a" />
      {Array.from({ length: 12 }, (_, i) => <rect key={i} x={0} y={i * 8} width={W} height={1} fill="#1c2450" />)}
      {Array.from({ length: total }, (_, i) => {
        const { x, y } = slot(i)
        const p = crew[i]
        return (
          <g key={i}>
            <rect x={x} y={y} width={24} height={26} fill="#0a0e24" />
            <rect x={x + 1} y={y + 1} width={22} height={24} fill={p ? '#2a3570' : '#1a2050'} />
            {p ? (
              <Portrait avatar={p.avatar} x={x + 1.5} y={y + 3} s={1.3} />
            ) : (
              <text x={x + 12} y={y + 17} fontSize={10} textAnchor="middle" fill="#3a4580" fontFamily="'Jersey 10', monospace">?</text>
            )}
            <rect x={x + 1} y={y + 21} width={22} height={4} fill="#0a0e24" opacity={0.8} />
            {p && <text x={x + 12} y={y + 24.4} fontSize={3.2} textAnchor="middle" fill="#ffffff" fontFamily="'Jersey 10', monospace">{p.username.slice(0, 9)}</text>}
          </g>
        )
      })}
      {/* cursores: cada jogador seleciona o seu retrato, um depois do outro */}
      {crew.map((_, i) => {
        const { x, y } = slot(i)
        const from = slot(Math.floor(rnd() * total))
        const at = PICK + i * 0.32
        return (
          <motion.g key={i} initial={{ opacity: 0, x: from.x - x, y: from.y - y }} animate={{ opacity: 1, x: [from.x - x, 0], y: [from.y - y, 0] }} transition={{ delay: at - 0.25, duration: 0.25, ease: steps(3) }}>
            <rect x={x - 1} y={y - 1} width={26} height={1} fill={CURSORS[i]} />
            <rect x={x - 1} y={y + 26} width={26} height={1} fill={CURSORS[i]} />
            <rect x={x - 1} y={y - 1} width={1} height={28} fill={CURSORS[i]} />
            <rect x={x + 24} y={y - 1} width={1} height={28} fill={CURSORS[i]} />
            <text x={x + 2} y={y + 4} fontSize={3.4} fill={CURSORS[i]} fontFamily="'Jersey 10', monospace">P{i + 1}</text>
            {/* clarão de "selecionado" */}
            <motion.rect x={x} y={y} width={24} height={26} fill="#ffffff" initial={{ opacity: 0 }} animate={{ opacity: [0, 0.7, 0] }} transition={{ delay: at, duration: 0.3, ease: 'linear' }} />
          </motion.g>
        )
      })}
    </g>
  )
}

function Arena() {
  const rnd = seeded(82)
  return (
    <g>
      <rect width={W} height={H} fill="#c0303a" />
      <rect y={18} width={W} height={14} fill="#e0503a" />
      <rect y={32} width={W} height={10} fill="#f08a3a" />
      {/* torcida em silhueta */}
      {Array.from({ length: 40 }, (_, i) => (
        <motion.rect key={i} x={i * 4} y={40 - Math.floor(rnd() * 4)} width={3} height={8} fill="#3a1018" animate={{ y: [0, -2, 0] }} transition={{ duration: 0.4, repeat: 12, delay: rnd() * 0.4, ease: steps(2) }} />
      ))}
      <rect y={46} width={W} height={14} fill="#5a2a1a" />
      <rect y={60} width={W} height={30} fill="#8a5a3a" />
      {Array.from({ length: 10 }, (_, i) => <rect key={i} x={i * 16} y={60} width={1} height={30} fill="#7a4a2a" />)}
      <rect y={60} width={W} height={1} fill="#a87a4a" />
    </g>
  )
}

export function SelectPerfect({ result }: { result: FeedResult }) {
  const crew = useMemo(() => cast(result.hits, 6), [result])
  const gap = Math.min(20, 110 / crew.length)
  const px = (i: number) => 80 - ((crew.length - 1) * gap) / 2 + i * gap

  return (
    <Stage
      overlay={
        <>
          <motion.p
            className="absolute inset-x-0 text-center font-display leading-none text-[#e8ecff]"
            style={{ top: cq(4), fontSize: cq(7) }}
            initial={{ opacity: 1 }}
            animate={{ opacity: [1, 1, 0] }}
            transition={{ duration: CUT, times: [0, 0.97, 1], ease: 'linear' }}
          >
            SELECT YOUR PREDICTOR
          </motion.p>
          <motion.p
            className="absolute inset-x-0 text-center font-display leading-none text-[#ffe14a]"
            style={{ top: cq(10), fontSize: cq(20), textShadow: `${cq(1)} ${cq(1)} 0 #b3261e, -${cq(0.5)} -${cq(0.5)} 0 #b3261e` }}
            initial={{ opacity: 0, scale: 2 }}
            animate={{ opacity: 1, scale: [2, 0.9, 1] }}
            transition={{ delay: WIN, duration: 0.45, ease: steps(4) }}
          >
            PERFECT!
          </motion.p>
          <Caption result={result} note={`${result.hits.length} acertaram sem levar dano.`} delay={WIN + 1.2} />
        </>
      }
    >
      <Arena />
      {/* lutadores em pose de vitória: cada um pula e vira num tempo diferente */}
      {crew.map((p, i) => (
        <motion.g key={i} initial={{ opacity: 0 }} animate={{ opacity: [0, 0, 1] }} transition={{ duration: CUT + 0.05, times: [0, 0.98, 1], ease: 'linear' }}>
          <motion.g
            style={{ originX: 0.5, originY: 1 }}
            animate={{ y: [0, 0, -6, 0, 0, -4, 0], scaleX: [1, 1, 1, 1, -1, -1, 1] }}
            transition={{ delay: WIN + i * 0.12, duration: 2.4, ease: steps(1) }}
          >
            <Body avatar={p.avatar} x={px(i)} y={72} s={0.8} />
            {/* punho erguido */}
            <motion.rect x={px(i) + 6} y={50} width={2} height={5} fill={SKIN[p.avatar?.skin ?? 0]} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: WIN + 0.3 + i * 0.12, duration: 0.01 }} />
          </motion.g>
        </motion.g>
      ))}
      <Burst x={80} y={30} n={24} delay={WIN} colors={['#ffe14a', '#ffffff', '#ff8a2a']} spread={70} up={20} size={2} dur={1.2} seed={83} />
      {/* tela de seleção por cima até o corte */}
      <motion.g initial={{ opacity: 1 }} animate={{ opacity: [1, 1, 0] }} transition={{ duration: CUT, times: [0, 0.98, 1], ease: 'linear' }}>
        <SelectScreen crew={crew} />
      </motion.g>
      <motion.rect width={W} height={H} fill="#ffffff" initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0] }} transition={{ delay: CUT - 0.1, duration: 0.4, ease: 'linear' }} />
    </Stage>
  )
}
