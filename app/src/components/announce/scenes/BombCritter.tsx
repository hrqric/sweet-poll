import { useMemo, type ReactNode } from 'react'
import { motion } from 'motion/react'
import type { FeedResult } from '../../../lib/resultsFeed'
import { Body, Burst, Caption, H, Stage, W, cast, seeded, shake, steps } from '../kit'

/**
 * Ninguém acertou · "Bicho-bomba" (homenagem a sandbox de blocos): o grupo está distraído num
 * mundo de blocos, um bichinho verde chega por trás, chia, pisca cada vez mais rápido e explode.
 * Quando a fumaça baixa, só sobraram os itens de cada um boiando no buraco.
 */
const BOOM = 4.9

function BlockWorld() {
  const rnd = seeded(12)
  const dirt = []
  for (let y = 64; y < H; y += 6) {
    for (let x = 0; x < W; x += 6) {
      const stone = y > 76 && rnd() < 0.3
      dirt.push(<rect key={`${x}-${y}`} x={x} y={y} width={6} height={6} fill={stone ? '#7d7d7d' : rnd() < 0.5 ? '#7a5232' : '#6e4a2d'} />)
      dirt.push(<rect key={`d${x}-${y}`} x={x + 1 + Math.floor(rnd() * 4)} y={y + 1 + Math.floor(rnd() * 4)} width={1} height={1} fill={stone ? '#5e5e5e' : '#5a3a22'} />)
    }
  }
  return (
    <>
      <rect width={W} height={H} fill="#8ec5ff" />
      <rect x={128} y={8} width={10} height={10} fill="#fff7c0" />
      {[[14, 12, 22], [70, 8, 28], [104, 18, 18]].map(([x, y, w]) => (
        <g key={x} fill="#ffffff"><rect x={x} y={y} width={w} height={4} /><rect x={x + 4} y={y - 2} width={w - 10} height={2} /></g>
      ))}
      {/* árvore de blocos */}
      <rect x={10} y={40} width={4} height={22} fill="#6b4a2b" />
      <rect x={2} y={28} width={20} height={14} fill="#3f8a2a" />
      <rect x={6} y={24} width={12} height={4} fill="#4f9f36" />
      <rect y={62} width={W} height={2} fill="#5fa83a" />
      {Array.from({ length: 27 }, (_, i) => <rect key={i} x={i * 6 + 2} y={64} width={2} height={1} fill="#4f9230" />)}
      {dirt}
      {/* florzinha que distrai todo mundo */}
      <rect x={30} y={58} width={1} height={4} fill="#3f8a2a" />
      <rect x={29} y={56} width={3} height={2} fill="#ff5a5a" />
    </>
  )
}

/** Bichinho verde de blocos, de lado, virado pra esquerda. */
function Critter() {
  return (
    <motion.g
      initial={{ x: 70 }}
      // chega colado nas costas do último da fila
      animate={{ x: [70, -38, -38], opacity: [1, 1, 1, 0] }}
      transition={{ delay: 1.6, duration: BOOM - 1.6 + 0.05, times: [0, 0.35, 0.99, 1], ease: steps(10) }}
    >
      {/* do tamanho de um boneco; incha antes de estourar */}
      <motion.g style={{ originX: 0.5, originY: 1 }} initial={{ scale: 0.62 }} animate={{ scale: [0.62, 0.62, 0.8] }} transition={{ delay: 3.2, duration: BOOM - 3.2, ease: steps(6) }}>
        <rect x={118} y={36} width={12} height={10} fill="#4fb84a" />
        <rect x={119} y={37} width={2} height={2} fill="#6fd468" />
        <rect x={126} y={42} width={2} height={2} fill="#3a9a38" />
        <rect x={120} y={39} width={2} height={2} fill="#111" />
        <rect x={120} y={43} width={4} height={1} fill="#111" />
        <rect x={120} y={46} width={10} height={10} fill="#45a842" />
        <rect x={124} y={48} width={2} height={2} fill="#6fd468" />
        <rect x={121} y={53} width={2} height={2} fill="#3a9a38" />
        <rect x={119} y={56} width={4} height={6} fill="#3a9a38" />
        <rect x={127} y={56} width={4} height={6} fill="#3a9a38" />
        {/* pisca branco cada vez mais rápido */}
        <motion.g
          fill="#ffffff"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.85, 0, 0.85, 0, 0.85, 0, 0.85, 0, 0.85, 0, 0.9, 0.9] }}
          transition={{ delay: 3.2, duration: BOOM - 3.2, times: [0, 0.12, 0.24, 0.34, 0.44, 0.52, 0.6, 0.67, 0.74, 0.8, 0.86, 0.92, 1], ease: steps(1) }}
        >
          <rect x={118} y={36} width={12} height={10} />
          <rect x={120} y={46} width={10} height={10} />
          <rect x={119} y={56} width={12} height={6} />
        </motion.g>
      </motion.g>
    </motion.g>
  )
}

const ITEMS: ((x: number, y: number) => ReactNode)[] = [
  // espada
  (x, y) => <g><rect x={x} y={y} width={1} height={6} fill="#c8ccd0" /><rect x={x - 1} y={y + 5} width={3} height={1} fill="#6b4a2b" /><rect x={x} y={y + 6} width={1} height={2} fill="#6b4a2b" /></g>,
  // picareta
  (x, y) => <g><rect x={x - 2} y={y} width={5} height={1} fill="#7d7d7d" /><rect x={x} y={y + 1} width={1} height={6} fill="#6b4a2b" /></g>,
  // maçã
  (x, y) => <g><rect x={x - 1} y={y + 2} width={4} height={4} fill="#d6302e" /><rect x={x} y={y} width={1} height={2} fill="#6b4a2b" /></g>,
  // diamante
  (x, y) => <g><rect x={x - 1} y={y + 1} width={4} height={3} fill="#4fe0e0" /><rect x={x} y={y} width={2} height={5} fill="#4fe0e0" /><rect x={x} y={y + 1} width={1} height={1} fill="#fff" /></g>,
  // moeda
  (x, y) => <g><rect x={x - 1} y={y + 1} width={4} height={4} fill="#f8b800" /><rect x={x} y={y + 2} width={1} height={2} fill="#ac7c00" /></g>,
  // bota
  (x, y) => <g><rect x={x} y={y} width={2} height={5} fill="#5a3a22" /><rect x={x} y={y + 4} width={4} height={2} fill="#5a3a22" /></g>,
]

export function BombCritter({ result }: { result: FeedResult }) {
  const players = useMemo(() => cast(result.players, 6), [result])
  const gap = Math.min(12, 64 / players.length)
  const px = (i: number) => 42 + i * gap

  return (
    <Stage overlay={<Caption result={result} note="Ninguém acertou. Só sobraram os itens." delay={6.4} />}>
      <motion.g {...shake(BOOM, 3)}>
        <BlockWorld />
        {/* cratera depois da explosão */}
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: BOOM + 0.1, duration: 0.01 }}>
          <rect x={36} y={62} width={84} height={8} fill="#3a2616" />
          <rect x={44} y={70} width={68} height={6} fill="#2e1e12" />
          <rect x={56} y={76} width={44} height={4} fill="#24170e" />
        </motion.g>
        {players.map((p, i) => (
          <motion.g key={p.username} animate={{ opacity: [1, 1, 0] }} transition={{ delay: BOOM, duration: 0.05, times: [0, 0.5, 1] }}>
            {/* distraídos: balançam olhando pra esquerda (pra flor), de costas pro perigo */}
            <motion.g animate={{ y: [0, -1, 0] }} transition={{ duration: 0.8, repeat: 5, delay: i * 0.15, ease: steps(2) }}>
              <Body avatar={p.avatar} x={px(i)} y={62} s={0.62} flip />
            </motion.g>
          </motion.g>
        ))}
        {/* "?" e "..." de quem está distraído */}
        <motion.g fill="#ffffff" initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 1, 0] }} transition={{ delay: 0.8, duration: 2.4, times: [0, 0.1, 0.9, 1], ease: steps(2) }}>
          <rect x={px(0) - 1} y={40} width={3} height={1} /><rect x={px(0) + 1} y={41} width={1} height={2} /><rect x={px(0)} y={44} width={1} height={1} />
        </motion.g>
        <Critter />
        {/* "sss..." */}
        <motion.text x={80} y={40} fontSize={6} fill="#2a6b28" fontFamily="'Jersey 10', monospace" initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 1, 0] }} transition={{ delay: 3.1, duration: 1.8, times: [0, 0.1, 0.9, 1], ease: steps(2) }}>
          sss...
        </motion.text>

        {/* explosão: clarão + fumaça em blocos */}
        <motion.rect width={W} height={H} fill="#fff" initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0] }} transition={{ delay: BOOM, duration: 0.4, ease: steps(3) }} />
        {Array.from({ length: 14 }, (_, k) => {
          const rnd = seeded(k + 40)
          const cx = 60 + rnd() * 60
          const cy = 30 + rnd() * 30
          const s = 6 + Math.round(rnd() * 8)
          return (
            <motion.rect
              key={k}
              x={cx - s / 2}
              y={cy - s / 2}
              width={s}
              height={s}
              fill={k % 3 ? '#cfcfcf' : '#9a9a9a'}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 1, 1, 0], scale: [0, 1.2, 1.6, 2] }}
              transition={{ delay: BOOM + 0.05 + rnd() * 0.2, duration: 1.6, times: [0, 0.15, 0.6, 1], ease: steps(6) }}
            />
          )
        })}
        <Burst x={110} y={50} n={16} delay={BOOM} colors={['#4fb84a', '#7a5232', '#7d7d7d']} spread={50} up={24} size={2} dur={1.2} seed={14} />

        {/* itens que ficaram, boiando no buraco, com o nome de cada um */}
        {players.map((p, i) => (
          <motion.g key={`it-${p.username}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: BOOM + 1.3 + i * 0.12, duration: 0.2, ease: steps(2) }}>
            <motion.g animate={{ y: [0, -2, 0] }} transition={{ duration: 1, repeat: 4, delay: BOOM + 1.3, ease: steps(2) }}>
              {ITEMS[i % ITEMS.length](px(i), 56)}
            </motion.g>
            {/* nomes em dois andares pra não encavalarem */}
            <text x={px(i) + 1} y={i % 2 ? 48 : 53} fontSize={3.4} textAnchor="middle" fill="#ffffff" stroke="#000" strokeWidth={0.6} paintOrder="stroke" fontFamily="'Jersey 10', monospace">
              {p.username.slice(0, 9)}
            </text>
          </motion.g>
        ))}
      </motion.g>
    </Stage>
  )
}
