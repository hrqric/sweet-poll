import { useMemo } from 'react'
import { motion } from 'motion/react'
import type { FeedResult } from '../../../lib/resultsFeed'
import { DEFAULT_AVATAR, type Avatar } from '../../../lib/sprites'
import { Body, Burst, Caption, H, Stage, W, cast, cq, seeded, shake, steps } from '../kit'

/**
 * Duas pessoas · "Fusão" (homenagem a anime de luta): os dois fazem uma dança espelhada,
 * encostam os dedos, uma explosão de energia toma a tela e surge um guerreiro temporário com
 * pedaços dos dois. Depois se separam e comemoram.
 */
const TOUCH = 2.7
const SPLIT = 6.2

function Wasteland() {
  const rnd = seeded(61)
  return (
    <>
      <rect width={W} height={H} fill="#f2b45a" />
      <rect y={18} width={W} height={14} fill="#f0a040" />
      <rect y={32} width={W} height={14} fill="#e88a34" />
      {/* mesas de pedra ao fundo */}
      {[[4, 30, 22], [40, 36, 16], [104, 28, 26], [138, 38, 20]].map(([x, top, w], i) => (
        <g key={i}><rect x={x} y={top} width={w} height={58 - top} fill="#b0602e" /><rect x={x} y={top} width={w} height={2} fill="#c87a3e" /></g>
      ))}
      <rect y={58} width={W} height={32} fill="#c08048" />
      <rect y={58} width={W} height={1} fill="#d89a5e" />
      {Array.from({ length: 24 }, (_, i) => <rect key={i} x={Math.floor(rnd() * W)} y={60 + Math.floor(rnd() * 28)} width={2 + Math.floor(rnd() * 3)} height={1} fill="#a86c3a" />)}
    </>
  )
}

/** Mistura os dois: corpo e rosto do primeiro, cabelo, camisa e chapéu do segundo. */
function fuse(a: Avatar | null | undefined, b: Avatar | null | undefined): Avatar {
  const A = a ?? DEFAULT_AVATAR
  const B = b ?? DEFAULT_AVATAR
  return { ...A, hairStyle: B.hairStyle, hairColor: B.hairColor, shirt: B.shirt, hat: B.hat ?? A.hat, outfit: B.outfit ?? A.outfit, pet: null, bg: null }
}

/** Nome da fusão: metade de cada um ("host_teste" + "amigo_1" → "HOSTIGO_1"). */
function fusedName(a: string, b: string) {
  return (a.slice(0, Math.ceil(a.length / 2)) + b.slice(Math.floor(b.length / 2))).toUpperCase()
}

export function Fusion({ result }: { result: FeedResult }) {
  const [a, b] = useMemo(() => cast(result.hits, 2), [result])
  const fused = useMemo(() => fuse(a?.avatar, b?.avatar), [a, b])

  // linha do tempo dos dois (segundos), espelhada: entra, 6 passos de dança até o centro,
  // some no clarão, volta na separação e comemora pulando
  const T = 7.6
  const xAt = [0, 1.0, 1.3, 1.55, 1.8, 2.05, 2.3, 2.55, SPLIT, T]
  const xs = [-70, 0, 0, 8, 8, 16, 16, 22, 6, 6]
  const yAt = [0, 1.3, 1.55, 1.8, 2.05, 2.3, 2.55, 6.4, 6.6, 6.8, 7.0, 7.2, T]
  const ys = [0, 0, -5, 0, -3, 0, 0, -6, 0, -6, 0, -6, 0]
  const frac = (arr: number[]) => arr.map((t) => t / T)

  return (
    <Stage
      overlay={
        <>
          <motion.p
            className="absolute inset-x-0 text-center font-display leading-none text-[#fff3a0]"
            style={{ top: cq(6), fontSize: cq(9), textShadow: `${cq(0.7)} ${cq(0.7)} 0 #8a3a10` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 1, 0] }}
            transition={{ delay: TOUCH + 0.6, duration: SPLIT - TOUCH - 0.4, times: [0, 0.05, 0.9, 1], ease: steps(3) }}
          >
            {fusedName(a?.username ?? 'a', b?.username ?? 'b')}
          </motion.p>
          <Caption result={result} note={`${a?.username} + ${b?.username} acertaram juntos.`} delay={SPLIT + 0.4} />
        </>
      }
    >
      <motion.g {...shake(TOUCH + 0.1, 3)}>
        <Wasteland />
        {/* os dois: entram, dançam espelhados e somem no clarão */}
        {[a, b].map((p, side) => {
          const dir = side === 0 ? 1 : -1
          const home = side === 0 ? 44 : 116
          return (
            <motion.g
              key={side}
              initial={{ x: xs[0] * dir }}
              animate={{ x: xs.map((v) => v * dir) }}
              // a entrada anda em degraus; a dança troca de pose de uma vez
              transition={{ duration: T, times: frac(xAt), ease: [steps(8), ...Array(xs.length - 2).fill(steps(1))] }}
            >
              <motion.g
                animate={{ opacity: [1, 1, 0, 0, 1, 1] }}
                // corte seco por keyframes a 20 ms; easing em degrau não roda em opacity
                transition={{ duration: T, times: frac([0, TOUCH, TOUCH + 0.02, SPLIT, SPLIT + 0.02, T]), ease: 'linear' }}
              >
                <motion.g animate={{ y: ys }} transition={{ duration: T, times: frac(yAt), ease: steps(1) }}>
                  <Body avatar={p?.avatar} x={home} y={68} s={0.8} flip={side === 1} />
                </motion.g>
              </motion.g>
            </motion.g>
          )
        })}
        {/* explosão de energia no toque */}
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0.6, 0] }} transition={{ delay: TOUCH, duration: 1.4, ease: steps(5) }}>
          {Array.from({ length: 12 }, (_, i) => {
            const ang = (i / 12) * Math.PI * 2
            return <polygon key={i} points={`80,48 ${80 + Math.cos(ang - 0.08) * 120},${48 + Math.sin(ang - 0.08) * 120} ${80 + Math.cos(ang + 0.08) * 120},${48 + Math.sin(ang + 0.08) * 120}`} fill="#fff6c0" opacity={0.5} />
          })}
        </motion.g>
        <Burst x={80} y={50} n={26} delay={TOUCH} colors={['#ffffff', '#fff3a0', '#ffd23f']} spread={60} up={30} size={2} dur={1.1} seed={62} />
        {/* guerreiro fundido, com aura dourada piscando */}
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: [0, 0, 1, 1, 0] }} transition={{ delay: TOUCH, duration: SPLIT - TOUCH + 0.1, times: [0, 0.14, 0.145, 0.97, 0.975], ease: 'linear' }}>
          <motion.g animate={{ opacity: [0.35, 0.35, 0.8, 0.8, 0.35] }} transition={{ duration: 0.3, repeat: 12, times: [0, 0.49, 0.5, 0.99, 1], ease: 'linear' }}>
            <rect x={66} y={34} width={28} height={36} fill="#ffe14a" opacity={0.35} />
            <rect x={70} y={28} width={20} height={8} fill="#ffe14a" opacity={0.3} />
            <rect x={63} y={44} width={34} height={24} fill="#ffe14a" opacity={0.2} />
          </motion.g>
          <motion.g animate={{ y: [0, -2, 0] }} transition={{ duration: 0.6, repeat: 5, ease: steps(2) }}>
            <Body avatar={fused} x={80} y={69} s={1.25} />
          </motion.g>
          <Burst x={80} y={60} n={14} delay={TOUCH + 0.8} colors={['#ffe14a', '#fff6c0']} spread={18} up={30} size={1} dur={2.4} seed={63} />
        </motion.g>
        {/* clarão do toque e da separação */}
        <motion.rect width={W} height={H} fill="#fff" initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0] }} transition={{ delay: TOUCH, duration: 0.5, ease: steps(3) }} />
        <motion.rect width={W} height={H} fill="#fff" initial={{ opacity: 0 }} animate={{ opacity: [0, 0.8, 0] }} transition={{ delay: SPLIT, duration: 0.35, ease: steps(3) }} />
      </motion.g>
    </Stage>
  )
}
