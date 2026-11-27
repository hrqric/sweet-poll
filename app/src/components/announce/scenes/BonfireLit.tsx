import { useMemo } from 'react'
import { motion } from 'motion/react'
import type { FeedResult } from '../../../lib/resultsFeed'
import { BigText, Body, Caption, H, Sparkles, Stage, W, cast, seeded, steps } from '../kit'

/**
 * Três ou mais · "A fogueira" (homenagem a soulslike): nas ruínas, à noite, os vencedores
 * chegam um a um com espada e escudo e sentam em volta de uma fogueira. O fogo cresce, ilumina
 * o nome de cada um: BONFIRE LIT.
 */
const LIT = 3.6

function Ruins() {
  const rnd = seeded(71)
  return (
    <>
      <rect width={W} height={H} fill="#0c0e16" />
      {Array.from({ length: 24 }, (_, i) => <rect key={i} className={i % 4 ? undefined : 'sp-blink'} x={Math.floor(rnd() * W)} y={Math.floor(rnd() * 30)} width={1} height={1} fill="#9aa4c0" />)}
      {/* colunas quebradas e arco ao fundo */}
      {[[14, 22, 8], [36, 30, 7], [118, 18, 8], [142, 28, 7]].map(([x, top, w], i) => (
        <g key={i}><rect x={x} y={top} width={w} height={60 - top} fill="#23262f" /><rect x={x - 1} y={top} width={w + 2} height={2} fill="#2c303a" /></g>
      ))}
      <rect x={62} y={20} width={36} height={4} fill="#1c1f27" />
      <rect x={62} y={24} width={5} height={36} fill="#1c1f27" />
      <rect x={93} y={24} width={5} height={36} fill="#1c1f27" />
      <rect y={60} width={W} height={30} fill="#1a1c22" />
      {Array.from({ length: 18 }, (_, i) => <rect key={i} x={Math.floor(rnd() * W)} y={62 + Math.floor(rnd() * 26)} width={4 + Math.floor(rnd() * 5)} height={2} fill="#23262f" />)}
    </>
  )
}

function Fire() {
  return (
    <g>
      {/* lenha cruzada e pedras */}
      <rect x={72} y={66} width={16} height={2} fill="#4a2e18" transform="rotate(-12 80 67)" />
      <rect x={72} y={66} width={16} height={2} fill="#5a3418" transform="rotate(12 80 67)" />
      {[70, 74, 84, 88].map((x) => <rect key={x} x={x} y={68} width={3} height={2} fill="#3a3a44" />)}
      {/* chamas: crescem quando acende de vez */}
      <motion.g style={{ originX: 0.5, originY: 1 }} initial={{ scale: 0.4 }} animate={{ scale: [0.4, 0.6, 0.55, 0.65, 1.5, 1.35] }} transition={{ duration: LIT + 0.6, times: [0, 0.2, 0.4, 0.7, 0.92, 1], ease: steps(4) }}>
        <rect className="sp-spin-a" x={74} y={56} width={12} height={10} fill="#e8601c" />
        <rect className="sp-spin-b" x={75} y={54} width={10} height={12} fill="#f08a24" />
        <rect className="sp-spin-a" x={77} y={52} width={6} height={12} fill="#ffc24a" />
        <rect className="sp-spin-b" x={78} y={58} width={4} height={7} fill="#fff1a8" />
      </motion.g>
    </g>
  )
}

export function BonfireLit({ result }: { result: FeedResult }) {
  const crew = useMemo(() => cast(result.hits, 6), [result])
  // lugares em volta do fogo: metade de cada lado
  const seats = crew.map((_, i) => {
    const side = i % 2 ? 1 : -1
    const k = Math.floor(i / 2)
    return { x: 80 + side * (18 + k * 16), y: 70 + k * 3, side }
  })

  return (
    <Stage
      overlay={
        <>
          <BigText color="#ffcf6a" delay={LIT + 0.5} style={{ textShadow: '0.5cqw 0.5cqw 0 #2a1004', top: '10%', fontSize: 'clamp(28px, 10cqw, 130px)' }}>
            BONFIRE LIT
          </BigText>
          <Caption result={result} note={`${result.hits.length} acertaram. Descansem, campeões.`} delay={LIT + 1.4} />
        </>
      }
    >
      <Ruins />
      {/* brilho da fogueira no chão: aumenta quando acende */}
      <motion.g initial={{ opacity: 0.25 }} animate={{ opacity: [0.25, 0.25, 0.7] }} transition={{ duration: LIT + 0.4, times: [0, 0.88, 1], ease: steps(3) }}>
        <rect x={40} y={56} width={80} height={24} fill="#f08a24" opacity={0.12} />
        <rect x={56} y={50} width={48} height={32} fill="#f08a24" opacity={0.14} />
        <rect x={68} y={46} width={24} height={36} fill="#ffc24a" opacity={0.12} />
      </motion.g>
      {crew.map((p, i) => {
        const s = seats[i]
        const from = s.side * 110
        return (
          <motion.g key={i} initial={{ x: from }} animate={{ x: 0 }} transition={{ delay: 0.3 + i * 0.45, duration: 0.9, ease: steps(8) }}>
            {/* senta: abaixa um pouco quando chega */}
            <motion.g animate={{ y: [0, 0, 3] }} transition={{ delay: 1.2 + i * 0.45, duration: 0.2, times: [0, 0.5, 1], ease: steps(1) }}>
              <Body avatar={p.avatar} x={s.x} y={s.y} s={0.6} flip={s.side === 1} />
              {/* escudo e espada */}
              <rect x={s.x + (s.side === 1 ? 4 : -8)} y={s.y - 8} width={4} height={5} fill="#5a5a6a" />
              <rect x={s.x + (s.side === 1 ? -6 : 6)} y={s.y - 12} width={1} height={8} fill="#b8b8c8" />
            </motion.g>
            {/* nome iluminado pelo fogo */}
            <motion.text
              x={s.x}
              y={s.y - 16}
              fontSize={3.6}
              textAnchor="middle"
              fill="#ffcf6a"
              stroke="#000"
              strokeWidth={0.5}
              paintOrder="stroke"
              fontFamily="'Jersey 10', monospace"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0, 1] }}
              transition={{ delay: LIT, duration: 0.5 + i * 0.1, times: [0, 0.4, 1], ease: 'linear' }}
            >
              {p.username.slice(0, 10)}
            </motion.text>
          </motion.g>
        )
      })}
      <Fire />
      <Sparkles x={80} y={44} n={18} delay={0.6} spread={10} color="#ffb13b" seed={72} dur={2.4} />
      <Sparkles x={80} y={36} n={18} delay={LIT} spread={18} color="#ffcf6a" seed={73} dur={2.4} />
    </Stage>
  )
}
