import { motion } from 'motion/react'
import type { FeedResult } from '../../../lib/resultsFeed'
import { SKIN } from '../../../lib/sprites'
import { Body, Caption, H, Sparkles, Stage, W, cq, seeded, steps } from '../kit'

/**
 * Acertou sozinho · "Item lendário" (homenagem a aventura de masmorra): numa sala escura o
 * vencedor abre um baú dourado, a luz toma a sala e ele ergue o troféu acima da cabeça,
 * com brilhos e fanfarra.
 */
const OPEN = 1.6
const RAISE = 2.3

function Dungeon() {
  const rnd = seeded(17)
  const bricks = []
  for (let y = 0; y < 62; y += 5) {
    for (let x = (y / 5) % 2 ? -5 : 0; x < W; x += 10) {
      bricks.push(<rect key={`${x}-${y}`} x={x} y={y} width={9} height={4} fill={rnd() < 0.15 ? '#27325a' : '#222b4d'} />)
    }
  }
  return (
    <>
      <rect width={W} height={H} fill="#141a33" />
      {bricks}
      {/* porta em arco ao fundo */}
      <rect x={70} y={26} width={20} height={36} fill="#0a0d1c" />
      <rect x={72} y={23} width={16} height={3} fill="#0a0d1c" />
      <rect x={75} y={21} width={10} height={2} fill="#0a0d1c" />
      <rect y={62} width={W} height={28} fill="#2a2f4a" />
      {Array.from({ length: 16 }, (_, i) => <rect key={i} x={i * 10} y={62} width={1} height={28} fill="#22273e" />)}
      <rect y={62} width={W} height={1} fill="#3c4266" />
    </>
  )
}

function Chest() {
  return (
    <g>
      <rect x={96} y={52} width={22} height={12} fill="#8a5a14" />
      <rect x={96} y={52} width={22} height={2} fill="#c8961e" />
      <rect x={96} y={62} width={22} height={2} fill="#c8961e" />
      <rect x={96} y={52} width={2} height={12} fill="#f8d35a" />
      <rect x={116} y={52} width={2} height={12} fill="#f8d35a" />
      <rect x={105} y={55} width={4} height={4} fill="#f8d35a" />
      {/* tampa: sobe e tomba pra trás */}
      <motion.g
        style={{ originX: 1, originY: 1 }}
        animate={{ rotate: [0, 0, 70], y: [0, -1, -2] }}
        transition={{ delay: OPEN, duration: 0.5, times: [0, 0.3, 1], ease: steps(4) }}
      >
        <rect x={96} y={45} width={22} height={7} fill="#a06a1a" />
        <rect x={96} y={45} width={22} height={2} fill="#f8d35a" />
        <rect x={96} y={45} width={2} height={7} fill="#f8d35a" />
        <rect x={116} y={45} width={2} height={7} fill="#f8d35a" />
      </motion.g>
    </g>
  )
}

/** Troféu em pixel (12×12), com o canto em (0,0). */
function Trophy() {
  return (
    <g>
      <rect x={1} y={0} width={10} height={5} fill="#f8d35a" />
      <rect x={2} y={1} width={2} height={3} fill="#fff4b0" />
      <rect x={0} y={1} width={1} height={3} fill="#f8d35a" />
      <rect x={11} y={1} width={1} height={3} fill="#f8d35a" />
      <rect x={3} y={5} width={6} height={1} fill="#c8961e" />
      <rect x={5} y={6} width={2} height={3} fill="#c8961e" />
      <rect x={3} y={9} width={6} height={1} fill="#f8d35a" />
      <rect x={2} y={10} width={8} height={2} fill="#8a5a14" />
    </g>
  )
}

export function LegendaryItem({ result }: { result: FeedResult }) {
  const who = result.hits[0]
  const skin = SKIN[who?.avatar?.skin ?? 0] ?? SKIN[0]
  return (
    <Stage
      overlay={
        <>
          <motion.div
            className="absolute border-[0.6cqw] border-paper bg-black/85 text-center font-display leading-tight text-paper"
            style={{ left: cq(30), width: cq(100), top: cq(4), padding: cq(2), fontSize: cq(5) }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: RAISE + 0.8, duration: 0.3, ease: steps(3) }}
          >
            Você obteve o <span className="text-coin">Troféu da Previsão</span>!
            <span className="block text-paper-3" style={{ fontSize: cq(3.6) }}>Só {who?.username} acertou essa.</span>
          </motion.div>
          <Caption result={result} note={`+${result.value} pro inventário de ${who?.username ?? ''}`} delay={RAISE + 2} />
        </>
      }
    >
      <Dungeon />
      {/* raios de luz saindo do baú */}
      <motion.g initial={{ opacity: 0 }} animate={{ opacity: [0, 0.9, 0.55] }} transition={{ delay: OPEN + 0.2, duration: 1.2, ease: steps(5) }}>
        {[-40, -20, 0, 20, 40].map((d, i) => (
          <polygon key={i} points={`105,52 109,52 ${107 + d + 10},0 ${107 + d - 6},0`} fill="#fff1a8" opacity={0.18} />
        ))}
      </motion.g>
      <Chest />
      {/* anda até o baú e depois vira pra câmera erguendo o troféu */}
      <motion.g initial={{ x: -70 }} animate={{ x: 0 }} transition={{ duration: 1.2, ease: steps(10) }}>
        <motion.g animate={{ y: [0, 0, -3, 0] }} transition={{ delay: RAISE, duration: 0.5, times: [0, 0.2, 0.6, 1], ease: steps(4) }}>
          <Body avatar={who?.avatar} x={84} y={63} s={0.9} />
          {/* braços pra cima segurando */}
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: RAISE, duration: 0.01 }}>
            {/* braços colados na lateral da cabeça, mãos nas alças do troféu */}
            <rect x={76} y={31} width={2} height={14} fill={skin} />
            <rect x={90} y={31} width={2} height={14} fill={skin} />
            <rect x={76} y={45} width={2} height={2} fill={skin} opacity={0.7} />
            <rect x={90} y={45} width={2} height={2} fill={skin} opacity={0.7} />
          </motion.g>
        </motion.g>
      </motion.g>
      {/* o troféu sai do baú e para em cima da cabeça */}
      <motion.g
        initial={{ opacity: 0, x: 101, y: 50 }}
        animate={{ opacity: [0, 1, 1], x: [101, 101, 78], y: [50, 40, 26] }}
        transition={{ delay: OPEN + 0.3, duration: RAISE - OPEN + 0.2, times: [0, 0.3, 1], ease: steps(6) }}
      >
        <motion.g animate={{ y: [0, -1, 0] }} transition={{ delay: RAISE + 0.4, duration: 0.8, repeat: 6, ease: steps(2) }}>
          <Trophy />
        </motion.g>
      </motion.g>
      <Sparkles x={84} y={30} n={16} delay={RAISE} spread={26} seed={9} />
      {/* a sala clareia quando a luz sai */}
      <motion.rect width={W} height={H} fill="#000" initial={{ opacity: 0.55 }} animate={{ opacity: [0.55, 0.55, 0.05] }} transition={{ duration: OPEN + 0.9, times: [0, 0.65, 1], ease: steps(5) }} />
      <motion.rect width={W} height={H} fill="#fff7c0" initial={{ opacity: 0 }} animate={{ opacity: [0, 0.5, 0.12] }} transition={{ delay: OPEN + 0.2, duration: 0.9, ease: steps(4) }} />
    </Stage>
  )
}
