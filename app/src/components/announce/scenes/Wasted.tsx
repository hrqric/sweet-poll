import { useMemo } from 'react'
import { motion } from 'motion/react'
import type { FeedResult } from '../../../lib/resultsFeed'
import { Body, Burst, Caption, H, W, cast, seeded, shake, steps } from '../kit'

/**
 * Ninguém acertou · "Atropelados" (homenagem a mundo aberto de crime): o grupo comemora antes
 * da hora na calçada de uma cidade ensolarada, um carro desgovernado sobe no meio-fio e leva
 * todo mundo. Câmera lenta, preto e branco: WASTED.
 */
const HIT = 3.1

function City() {
  const rnd = seeded(31)
  const houses = []
  for (let x = -4; x < W; ) {
    const w = 18 + Math.round(rnd() * 14)
    const h = 14 + Math.round(rnd() * 16)
    const c = ['#e0c08f', '#d8a982', '#c9b6a0', '#e6d2b0'][Math.floor(rnd() * 4)]
    houses.push(
      <g key={x}>
        <rect x={x} y={58 - h} width={w} height={h} fill={c} />
        <rect x={x} y={58 - h} width={w} height={2} fill="#8a5a3a" />
        {Array.from({ length: Math.floor((w - 4) / 6) }, (_, k) => (
          <rect key={k} x={x + 3 + k * 6} y={58 - h + 5} width={3} height={4} fill="#5a7fa0" />
        ))}
      </g>,
    )
    x += w + 2
  }
  return (
    <>
      <rect width={W} height={H} fill="#8ccaf2" />
      <rect y={28} width={W} height={8} fill="#a9d8f5" />
      <rect x={128} y={8} width={10} height={10} fill="#fff3b0" />
      {houses}
      {/* coqueiros */}
      {[22, 92, 150].map((x) => (
        <g key={x}>
          <rect x={x} y={30} width={2} height={28} fill="#7a5a3a" />
          <rect x={x - 6} y={28} width={14} height={2} fill="#3f8a3a" />
          <rect x={x - 4} y={26} width={10} height={2} fill="#4fa046" />
          <rect x={x - 8} y={30} width={4} height={2} fill="#3f8a3a" />
          <rect x={x + 6} y={30} width={4} height={2} fill="#3f8a3a" />
        </g>
      ))}
      <rect y={58} width={W} height={12} fill="#bdb6a9" />
      <rect y={58} width={W} height={1} fill="#d6d0c4" />
      <rect y={70} width={W} height={2} fill="#8a857c" />
      <rect y={72} width={W} height={18} fill="#4a4a50" />
      {Array.from({ length: 10 }, (_, i) => <rect key={i} x={i * 18} y={81} width={10} height={1} fill="#e8e8e0" />)}
    </>
  )
}

function Car() {
  return (
    <motion.g
      initial={{ x: 200, y: 8 }}
      animate={{ x: [200, 120, 20, -90], y: [8, 0, -4, 0] }}
      transition={{ delay: HIT - 0.35, duration: 0.8, times: [0, 0.35, 0.7, 1], ease: steps(8) }}
    >
      {/* sedã vermelho, de lado, indo pra esquerda */}
      <rect x={0} y={54} width={38} height={7} fill="#c8282e" />
      <rect x={8} y={49} width={20} height={5} fill="#c8282e" />
      <rect x={10} y={50} width={7} height={4} fill="#9fd0ea" />
      <rect x={19} y={50} width={7} height={4} fill="#9fd0ea" />
      <rect x={0} y={55} width={2} height={2} fill="#fff6a8" />
      <rect x={36} y={55} width={2} height={2} fill="#7a1015" />
      <rect x={2} y={58} width={34} height={1} fill="#8a1a1e" />
      {[5, 27].map((x) => (
        <g key={x}>
          <rect x={x} y={59} width={6} height={5} fill="#16161a" />
          <rect x={x + 2} y={60} width={2} height={2} fill="#9a9aa4" />
        </g>
      ))}
      {/* fumaça de pneu */}
      <rect x={40} y={60} width={6} height={3} fill="#e0e0e0" opacity={0.6} />
      <rect x={48} y={59} width={4} height={2} fill="#e0e0e0" opacity={0.35} />
    </motion.g>
  )
}

export function Wasted({ result }: { result: FeedResult }) {
  const players = useMemo(() => cast(result.players, 6), [result])
  const gap = Math.min(14, 84 / players.length)
  const x0 = 34

  return (
    <motion.div
      className="absolute inset-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.3, ease: steps(3) } }}
      exit={{ opacity: 0, transition: { duration: 0.35, ease: steps(3) } }}
    >
      {/* câmera lenta: o mundo perde a cor e dá um zoom leve depois da batida */}
      <motion.div
        className="absolute inset-0"
        initial={{ filter: 'grayscale(0) contrast(1)', scale: 1 }}
        animate={{ filter: 'grayscale(1) contrast(1.15)', scale: 1.08 }}
        transition={{ delay: HIT + 0.25, duration: 1.2, ease: steps(6) }}
      >
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" shapeRendering="crispEdges" className="absolute inset-0 h-full w-full" aria-hidden>
          <motion.g {...shake(HIT, 2)}>
            <City />
            {players.map((p, i) => {
              const rnd = seeded(i + 9)
              // arremesso curto o bastante pra todo mundo cair dentro do quadro
              const flyX = -(8 + rnd() * 18) - i * 2
              const flyY = -(14 + rnd() * 18)
              return (
                // comemoração antecipada: pulinhos fora de compasso
                <motion.g
                  key={p.username}
                  animate={{ y: [0, -4, 0, -3, 0, -4, 0] }}
                  transition={{ delay: 0.3 + i * 0.13, duration: 2.2, ease: steps(7) }}
                >
                  {/* a pancada: voa girando e desaba no asfalto, cada um pra um lado */}
                  <motion.g
                    style={{ originX: 0.5, originY: 0.5 }}
                    animate={{ x: [0, flyX * 0.6, flyX], y: [0, flyY, 10 + rnd() * 6], rotate: [0, 200, 270 + rnd() * 60] }}
                    transition={{ delay: HIT + i * 0.06, duration: 1.6, times: [0, 0.4, 1], ease: steps(10) }}
                  >
                    <Body avatar={p.avatar} x={x0 + i * gap} y={68} s={0.66} flip />
                  </motion.g>
                </motion.g>
              )
            })}
            {/* confete da comemoração */}
            <Burst x={x0 + 30} y={40} n={18} delay={0.6} colors={['#ff4d6d', '#ffd23f', '#3ec1d3', '#7bd389']} spread={45} up={6} size={1} dur={2.2} seed={5} />
            <Car />
            <Burst x={x0 + 20} y={64} n={14} delay={HIT} colors={['#ffffff', '#d0d0d0']} spread={40} up={16} size={2} dur={0.8} seed={8} />
          </motion.g>
        </svg>
      </motion.div>

      <motion.p
        className="absolute inset-x-0 top-[34%] text-center font-display leading-none"
        style={{ color: '#e8434a', fontSize: 'clamp(30px, 11cqw, 140px)', letterSpacing: '0.04em', textShadow: '0.5cqw 0.5cqw 0 #000, -0.3cqw -0.3cqw 0 #000' }}
        initial={{ opacity: 0, scale: 1.3 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: HIT + 1, duration: 0.5, ease: steps(4) }}
      >
        WASTED
      </motion.p>
      <Caption result={result} note="Comemoraram cedo demais. Ninguém acertou." delay={HIT + 1.8} />
    </motion.div>
  )
}
