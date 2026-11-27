import { useMemo } from 'react'
import { motion } from 'motion/react'
import type { FeedResult } from '../../../lib/resultsFeed'
import { Body, BigText, Burst, Caption, H, Stage, W, cast, shake, steps } from '../kit'

/**
 * Ninguém acertou · "Chefe da arena" (homenagem a soulslike): o grupo entra numa arena de pedra,
 * um cavaleiro gigante surge do escuro, crava a espada no chão e derruba todo mundo de uma vez.
 * Tela escurece: YOU ALL DIED.
 */
const SLAM = 3.4

function Arena() {
  const blocks = []
  for (let y = 4; y < 60; y += 6) {
    for (let x = (y / 6) % 2 ? -6 : 0; x < W; x += 12) blocks.push(<rect key={`${x}-${y}`} x={x} y={y} width={11} height={5} fill="#2a231e" />)
  }
  return (
    <>
      <rect width={W} height={H} fill="#16110e" />
      {blocks}
      {/* arcos escuros na parede */}
      {[18, 58, 98, 138].map((x) => (
        <g key={x} fill="#0b0807">
          <rect x={x - 6} y={22} width={14} height={38} />
          <rect x={x - 4} y={19} width={10} height={3} />
          <rect x={x - 2} y={17} width={6} height={2} />
        </g>
      ))}
      {/* tochas */}
      {[6, 152].map((x) => (
        <g key={x}>
          <rect x={x} y={34} width={2} height={8} fill="#4a3a2a" />
          <rect className="sp-spin-a" x={x - 1} y={30} width={4} height={4} fill="#f08a24" />
          <rect className="sp-spin-b" x={x} y={29} width={2} height={5} fill="#ffd25a" />
          <rect x={x - 5} y={26} width={12} height={12} fill="#f08a24" opacity={0.08} />
        </g>
      ))}
      <rect y={60} width={W} height={30} fill="#2b2520" />
      {[64, 70, 78, 87].map((y) => <rect key={y} y={y} width={W} height={1} fill="#352d27" />)}
      <rect y={60} width={W} height={1} fill="#4a4038" />
    </>
  )
}

function Boss() {
  return (
    <motion.g
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: [0, 0, 1], y: [8, 8, 0] }}
      transition={{ duration: 2.4, times: [0, 0.6, 1], ease: steps(6) }}
    >
      {/* agacha no impacto */}
      <motion.g animate={{ y: [0, 0, 4, 4, 0] }} transition={{ duration: 1.4, delay: SLAM - 0.2, times: [0, 0.15, 0.25, 0.8, 1], ease: steps(4) }}>
        <rect x={110} y={24} width={32} height={44} fill="#3a0f12" />
        <rect x={116} y={44} width={7} height={26} fill="#1b1613" />
        <rect x={127} y={44} width={7} height={26} fill="#1b1613" />
        <rect x={114} y={70} width={10} height={4} fill="#100d0b" />
        <rect x={126} y={70} width={10} height={4} fill="#100d0b" />
        <rect x={112} y={20} width={26} height={25} fill="#221c18" />
        <rect x={116} y={22} width={18} height={2} fill="#3a322c" />
        <rect x={118} y={30} width={14} height={1} fill="#3a322c" />
        <rect x={134} y={19} width={9} height={7} fill="#3a322c" />
        <rect x={118} y={7} width={14} height={13} fill="#2a2420" />
        <rect x={116} y={4} width={2} height={7} fill="#4a4038" />
        <rect x={132} y={4} width={2} height={7} fill="#4a4038" />
        {/* olhos acendem depois que ele aparece */}
        <motion.rect x={120} y={13} width={10} height={1} fill="#ff3b30" initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0.4, 1] }} transition={{ delay: 2.3, duration: 0.6, ease: steps(4) }} />
        {/* braço + espadão giram em torno da mão (101, 24): caixa do grupo vai de (95,-37) a (114,27) */}
        <motion.g
          style={{ originX: (101 - 95) / (114 - 95), originY: (24 + 37) / (27 + 37) }}
          initial={{ rotate: 0 }}
          animate={{ rotate: [0, 18, -121, -121] }}
          transition={{ delay: 2.6, duration: SLAM - 2.6 + 0.3, times: [0, 0.75, 0.97, 1], ease: steps(5) }}
        >
          <rect x={101} y={21} width={13} height={6} fill="#2a2420" />
          <rect x={97} y={21} width={5} height={6} fill="#3a322c" />
          <rect x={95} y={19} width={9} height={2} fill="#6b5a40" />
          <rect x={98} y={-34} width={4} height={53} fill="#a7adb2" />
          <rect x={99} y={-34} width={1} height={53} fill="#e6eaee" />
          <rect x={99} y={-37} width={2} height={3} fill="#a7adb2" />
        </motion.g>
      </motion.g>
    </motion.g>
  )
}

export function BossSlam({ result }: { result: FeedResult }) {
  const players = useMemo(() => cast(result.players, 6), [result])
  const gap = Math.min(13, 70 / players.length)

  return (
    <Stage
      overlay={
        <>
          <BigText color="#c0262d" delay={5.2} style={{ textShadow: '0.5cqw 0.5cqw 0 #000' }}>
            YOU ALL DIED
          </BigText>
          <Caption result={result} note="Ninguém acertou essa." delay={6} />
        </>
      }
    >
      <motion.g {...shake(SLAM + 0.05, 3)}>
        <Arena />
        {players.map((p, i) => (
          // entra pela esquerda...
          <motion.g
            key={p.username}
            initial={{ x: -60 - i * 10 }}
            animate={{ x: 0 }}
            transition={{ delay: 0.2 + i * 0.12, duration: 1.3, ease: steps(10) }}
          >
            {/* ...e cai de costas quando o chão treme */}
            <motion.g
              style={{ originX: 0.5, originY: 1 }}
              animate={{ rotate: [0, 0, -90], opacity: [1, 1, 0.55] }}
              transition={{ delay: SLAM + 0.08 + i * 0.05, duration: 0.45, times: [0, 0.2, 1], ease: steps(3) }}
            >
              <Body avatar={p.avatar} x={14 + i * gap} y={74} s={0.72} />
            </motion.g>
          </motion.g>
        ))}
        <Boss />
        <Burst x={60} y={72} n={22} delay={SLAM + 0.05} colors={['#6b5d52', '#8a7a6c', '#4a4038']} spread={55} up={14} size={2} dur={1.1} seed={4} />
        <motion.rect width={W} height={H} fill="#fff" initial={{ opacity: 0 }} animate={{ opacity: [0, 0.7, 0] }} transition={{ delay: SLAM, duration: 0.3, ease: steps(3) }} />
      </motion.g>
      {/* escurece tudo antes do letreiro */}
      <motion.rect width={W} height={H} fill="#000" initial={{ opacity: 0 }} animate={{ opacity: 0.86 }} transition={{ delay: 4.5, duration: 0.8, ease: steps(5) }} />
    </Stage>
  )
}
