import { motion } from 'motion/react'
import type { FeedResult } from '../../../lib/resultsFeed'
import { Burst, Caption, H, Portrait, Stage, W, cq, seeded, shake, steps } from '../kit'

/**
 * Acertou sozinho · "Cartaz de procurado" (homenagem a faroeste): um cartaz cai pregado numa
 * parede de madeira com a cara do vencedor, e um carimbo vermelho bate em cima:
 * MOST WANTED PREDICTOR.
 */
const STAMP = 3.2

function Wall() {
  const rnd = seeded(21)
  return (
    <>
      <rect width={W} height={H} fill="#5a3d23" />
      {Array.from({ length: 12 }, (_, i) => (
        <g key={i}>
          <rect x={i * 14} y={0} width={13} height={H} fill={i % 2 ? '#6b4a2b' : '#634428'} />
          <rect x={i * 14 + 13} y={0} width={1} height={H} fill="#3e2a17" />
          {Array.from({ length: 4 }, (_, k) => (
            <rect key={k} x={i * 14 + 2 + Math.floor(rnd() * 9)} y={Math.floor(rnd() * H)} width={1 + Math.floor(rnd() * 3)} height={1} fill="#4c3320" />
          ))}
        </g>
      ))}
      {/* luz quente de fim de tarde */}
      <rect width={W} height={H} fill="#ff9a3c" opacity={0.08} />
    </>
  )
}

export function WantedPoster({ result }: { result: FeedResult }) {
  const who = result.hits[0]
  return (
    <Stage
      overlay={
        <>
          {/* textos do cartaz: posicionados nas mesmas coordenadas do SVG */}
          <motion.div
            className="absolute text-center font-display leading-none text-[#3a2410]"
            style={{ left: cq(48), width: cq(64), top: cq(10) }}
            initial={{ y: '-200cqw' }}
            animate={{ y: 0, rotate: [0, -3, 2, -1, 0] }}
            transition={{ duration: 1.1, ease: steps(8) }}
          >
            <p style={{ fontSize: cq(13), letterSpacing: '0.05em' }}>WANTED</p>
            <p className="truncate" style={{ fontSize: cq(8), marginTop: cq(40) }}>{who?.username}</p>
            <p style={{ fontSize: cq(3.6), marginTop: cq(1.5) }}>For predicting the winner</p>
            <p style={{ fontSize: cq(4.2), marginTop: cq(1.5) }}>REWARD: {result.value} COINS</p>
          </motion.div>
          <motion.div
            className="absolute border-[0.8cqw] border-[#b3261e] px-[1.2cqw] text-center font-display leading-none text-[#b3261e]"
            style={{ left: cq(26), top: cq(52), fontSize: cq(9), background: 'rgba(179,38,30,0.08)' }}
            initial={{ opacity: 0, scale: 2.4, rotate: -14 }}
            animate={{ opacity: 1, scale: 1, rotate: -9 }}
            transition={{ delay: STAMP, duration: 0.25, ease: steps(3) }}
          >
            MOST WANTED PREDICTOR
          </motion.div>
          <Caption result={result} note={`Só ${who?.username ?? ''} acertou. +${result.value}`} delay={STAMP + 1.2} place="side" />
        </>
      }
    >
      <motion.g {...shake(STAMP + 0.2, 2)}>
        <Wall />
        <motion.g initial={{ y: -110 }} animate={{ y: 0, rotate: [0, -3, 2, -1, 0] }} transition={{ duration: 1.1, ease: steps(8) }} style={{ originX: 0.5, originY: 0 }}>
          {/* papel envelhecido com cantos rasgados */}
          <rect x={46} y={5} width={68} height={81} fill="#c9ab70" />
          <rect x={47} y={6} width={66} height={79} fill="#e8d3a0" />
          <rect x={46} y={5} width={4} height={3} fill="#5a3d23" />
          <rect x={110} y={83} width={4} height={3} fill="#634428" />
          <rect x={48} y={20} width={64} height={1} fill="#8a6a3a" />
          {/* retrato */}
          <rect x={62} y={23} width={36} height={30} fill="#3a2410" />
          <rect x={63} y={24} width={34} height={28} fill="#d9c08a" />
          <g style={{ filter: 'sepia(0.55)' }}>
            <Portrait avatar={who?.avatar} x={66.5} y={25} s={1.9} />
          </g>
          {/* prego */}
          <rect x={79} y={6} width={2} height={2} fill="#2a2a2a" />
          <rect x={80} y={6} width={1} height={1} fill="#8a8a8a" />
        </motion.g>
        <Burst x={58} y={58} n={12} delay={STAMP + 0.15} colors={['#c9ab70', '#8a6a3a']} spread={30} up={10} size={1} dur={0.7} seed={6} />
        {/* bola de feno passando no chão */}
        <motion.g initial={{ x: 180 }} animate={{ x: -30 }} transition={{ delay: 1.2, duration: 3, ease: steps(30) }}>
          <motion.g style={{ originX: 0.5, originY: 0.5 }} animate={{ rotate: -720 }} transition={{ delay: 1.2, duration: 3, ease: steps(16) }}>
            <rect x={0} y={80} width={8} height={8} fill="#a8803e" opacity={0.85} />
            <rect x={2} y={78} width={4} height={2} fill="#a8803e" opacity={0.85} />
            <rect x={2} y={82} width={4} height={1} fill="#6b4a2b" />
          </motion.g>
        </motion.g>
      </motion.g>
    </Stage>
  )
}
