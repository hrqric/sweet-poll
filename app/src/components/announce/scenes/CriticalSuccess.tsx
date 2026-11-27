import { useEffect, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import type { FeedResult } from '../../../lib/resultsFeed'
import { SKIN } from '../../../lib/sprites'
import { BigText, Body, Burst, Caption, H, Sparkles, Stage, W, cast, seeded, steps } from '../kit'

/**
 * Três ou mais · "Acerto crítico" (homenagem a RPG de mesa): os vencedores estão numa taverna,
 * um D20 gigante rola pela mesa mostrando números até parar no 20. CRITICAL SUCCESS, e todo
 * mundo ergue a caneca.
 */
const ROLL = 0.8
const STOP = 3.0
const CHEERS = 3.8

function Tavern() {
  const rnd = seeded(33)
  return (
    <>
      <rect width={W} height={H} fill="#3a2414" />
      {Array.from({ length: 11 }, (_, i) => (
        <rect key={i} x={i * 15} y={0} width={14} height={50} fill={i % 2 ? '#4a2e18' : '#45291a'} />
      ))}
      {/* lareira acesa ao fundo */}
      <rect x={118} y={20} width={30} height={30} fill="#5a5048" />
      <rect x={122} y={30} width={22} height={20} fill="#1a1008" />
      <rect className="sp-spin-a" x={126} y={38} width={14} height={12} fill="#f08a24" />
      <rect className="sp-spin-b" x={129} y={34} width={8} height={16} fill="#ffd25a" />
      <rect x={100} y={14} width={60} height={46} fill="#f08a24" opacity={0.08} />
      {/* prateleira com garrafas */}
      <rect x={10} y={22} width={40} height={2} fill="#2a1a0c" />
      {[14, 20, 26, 34, 42].map((x, i) => <rect key={x} x={x} y={14 + (i % 2)} width={3} height={8 - (i % 2)} fill={['#3f8a3a', '#8a2a2a', '#c8961e'][i % 3]} />)}
      <rect y={50} width={W} height={40} fill="#2a1a0c" />
      {Array.from({ length: 16 }, (_, i) => <rect key={i} x={Math.floor(rnd() * W)} y={52 + Math.floor(rnd() * 36)} width={4} height={1} fill="#22150a" />)}
    </>
  )
}

/** D20 em pixel: hexágono (silhueta do icosaedro) com a face triangular da frente e o número. */
function D20({ value, crit }: { value: number; crit: boolean }) {
  const face = crit ? '#f8d35a' : '#d9d9e0'
  const side = crit ? '#e0b030' : '#b8b8c8'
  const edge = crit ? '#8a5a10' : '#6a6a80'
  // linhas do hexágono, de cima (-11) a baixo (+11)
  const rows = Array.from({ length: 23 }, (_, k) => {
    const y = k - 11
    const w = Math.abs(y) > 5 ? Math.round(22 - (Math.abs(y) - 5) * 3.2) : 22
    return { y, w }
  })
  // triângulo da face da frente: topo (0,-8), base de (-8,5) a (8,5)
  const tri = Array.from({ length: 14 }, (_, k) => ({ y: -8 + k, half: Math.round((k / 13) * 8) }))
  return (
    <g>
      {rows.map(({ y, w }) => <rect key={y} x={-w / 2} y={y} width={w} height={1} fill={side} />)}
      {tri.map(({ y, half }) => <rect key={y} x={-half} y={y} width={half * 2 + 1} height={1} fill={face} />)}
      {tri.map(({ y, half }) => (
        <g key={`e${y}`}><rect x={-half - 1} y={y} width={1} height={1} fill={edge} /><rect x={half + 1} y={y} width={1} height={1} fill={edge} /></g>
      ))}
      <rect x={-9} y={6} width={19} height={1} fill={edge} />
      <rect x={-3} y={-6} width={2} height={1} fill="#ffffff" opacity={0.7} />
      <text x={0.5} y={3.5} fontSize={8} textAnchor="middle" fill={crit ? '#7a1010' : '#2a2a3a'} fontFamily="'Jersey 10', monospace">{value}</text>
    </g>
  )
}

export function CriticalSuccess({ result }: { result: FeedResult }) {
  const party = useMemo(() => cast(result.hits, 6), [result])
  const gap = Math.min(18, 100 / party.length)
  const px = (i: number) => 80 - ((party.length - 1) * gap) / 2 + i * gap

  // o número trocando enquanto rola, até cravar o 20
  const [face, setFace] = useState(7)
  useEffect(() => {
    const rnd = seeded(5)
    const t = setInterval(() => setFace(1 + Math.floor(rnd() * 19)), 120)
    const stop = setTimeout(() => { clearInterval(t); setFace(20) }, STOP * 1000)
    return () => { clearInterval(t); clearTimeout(stop) }
  }, [])
  const crit = face === 20

  return (
    <Stage
      overlay={
        <>
          <BigText color="#f8d35a" delay={STOP + 0.2} style={{ textShadow: '0.5cqw 0.5cqw 0 #3a1a08', top: '12%', fontSize: 'clamp(24px, 8cqw, 110px)' }}>
            CRITICAL SUCCESS
          </BigText>
          <Caption result={result} note={`${result.hits.length} acertaram. Rodada por conta da casa.`} delay={CHEERS + 0.8} />
        </>
      }
    >
      <Tavern />
      {/* galera atrás da mesa (a mesa cobre as pernas) */}
      {party.map((p, i) => (
        <motion.g key={i} animate={{ y: [0, 0, -3, 0, -3, 0] }} transition={{ delay: CHEERS, duration: 1.4, ease: steps(1) }}>
          {/* em pé atrás da mesa: aparece da cintura pra cima */}
          <Body avatar={p.avatar} x={px(i)} y={60} s={0.7} />
          {/* caneca: sobe no brinde */}
          <motion.g initial={{ y: 0 }} animate={{ y: [0, -10] }} transition={{ delay: CHEERS + i * 0.06, duration: 0.3, ease: steps(3) }}>
            <rect x={px(i) + 5} y={50} width={5} height={6} fill="#8a5a2a" />
            <rect x={px(i) + 5} y={49} width={5} height={2} fill="#f4f1e6" />
            <rect x={px(i) + 10} y={51} width={2} height={3} fill="#8a5a2a" />
            <rect x={px(i) + 4} y={51} width={2} height={3} fill={SKIN[p.avatar?.skin ?? 0]} />
          </motion.g>
        </motion.g>
      ))}
      {/* mesa */}
      <rect x={14} y={56} width={132} height={6} fill="#7a4a22" />
      <rect x={14} y={56} width={132} height={1} fill="#9a6a3a" />
      <rect x={14} y={62} width={132} height={4} fill="#5a3418" />
      <rect x={20} y={66} width={4} height={18} fill="#5a3418" />
      <rect x={136} y={66} width={4} height={18} fill="#5a3418" />
      {/* D20 rolando da direita até o meio da mesa, quicando */}
      <motion.g
        initial={{ x: 180, y: 44 }}
        animate={{ x: [180, 130, 100, 80, 80], y: [44, 36, 44, 40, 44] }}
        transition={{ delay: ROLL, duration: STOP - ROLL, times: [0, 0.3, 0.6, 0.85, 1], ease: steps(4) }}
      >
        <motion.g animate={{ rotate: [0, -360, -720, -720] }} transition={{ delay: ROLL, duration: STOP - ROLL, times: [0, 0.4, 0.85, 1], ease: steps(8) }}>
          <D20 value={face} crit={crit} />
        </motion.g>
      </motion.g>
      {crit && <Sparkles x={80} y={40} n={14} delay={0} spread={16} color="#f8d35a" seed={34} />}
      <Burst x={80} y={46} n={16} delay={STOP} colors={['#f8d35a', '#ffffff']} spread={30} up={20} size={1} dur={1} seed={35} />
      {/* espuma voando no brinde */}
      <Burst x={80} y={38} n={20} delay={CHEERS + 0.25} colors={['#f4f1e6', '#e8d8a8']} spread={50} up={16} size={1} dur={1} seed={36} />
      <motion.rect width={W} height={H} fill="#fff7c0" initial={{ opacity: 0 }} animate={{ opacity: [0, 0.6, 0] }} transition={{ delay: STOP, duration: 0.4, ease: steps(3) }} />
    </Stage>
  )
}
