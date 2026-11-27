import { useMemo } from 'react'
import { motion } from 'motion/react'
import type { FeedResult } from '../../../lib/resultsFeed'
import { SKIN } from '../../../lib/sprites'
import { Body, Burst, Caption, H, Stage, W, cq, seeded, shake, steps } from '../kit'

/**
 * Acertou sozinho · "O retorno do machado" (homenagem a aventura nórdica): o vencedor estende a
 * mão, o machado volta girando pela tela quebrando as placas de quem errou, cai na mão dele, e
 * a pancada no chão congela o cenário.
 */
const CATCH = 2.6
const SLAM = 3.6

function Snowland() {
  const rnd = seeded(5)
  return (
    <>
      <rect width={W} height={H} fill="#16243a" />
      <rect y={30} width={W} height={20} fill="#1d2f4a" />
      {/* montanhas */}
      {/* montanhas: triângulos em degrau, pico nevado */}
      {[[-6, 50, 52, 30], [28, 50, 64, 38], [80, 50, 50, 26], [112, 50, 60, 34]].map(([x, y, w, h], i) => (
        <g key={i}>
          {Array.from({ length: h }, (_, k) => {
            const rw = Math.max(1, Math.round((w * (k + 1)) / h))
            return <rect key={k} x={Math.round(x + (w - rw) / 2)} y={y - h + k} width={rw} height={1} fill={k < 6 ? '#dce6f0' : i % 2 ? '#4e6683' : '#5d7591'} />
          })}
        </g>
      ))}
      <rect y={50} width={W} height={40} fill="#cfdcea" />
      <rect y={50} width={W} height={1} fill="#e8f0f8" />
      {Array.from({ length: 30 }, (_, i) => <rect key={i} x={Math.floor(rnd() * W)} y={54 + Math.floor(rnd() * 34)} width={2 + Math.floor(rnd() * 4)} height={1} fill="#b6c6d8" />)}
    </>
  )
}

/** Flocos caindo em loop (param no congelamento). */
function Snow() {
  const rnd = seeded(8)
  return (
    <>
      {Array.from({ length: 26 }, (_, i) => {
        const x = Math.floor(rnd() * W)
        return (
          <motion.rect
            key={i}
            x={x}
            y={-4}
            width={1}
            height={1}
            fill="#ffffff"
            animate={{ y: [-4, H] }}
            transition={{ duration: 3 + rnd() * 2, delay: rnd() * 3, repeat: 1, ease: steps(30) }}
          />
        )
      })}
    </>
  )
}

/** Machado de cabo curto; desenhado em volta de (0,0) pra girar no centro. */
function Axe() {
  return (
    <g>
      <rect x={-1} y={-7} width={2} height={14} fill="#6b4a2b" />
      <rect x={-1} y={5} width={2} height={2} fill="#3a2a1a" />
      <rect x={1} y={-7} width={5} height={6} fill="#aebccb" />
      <rect x={5} y={-8} width={2} height={8} fill="#e8f2fa" />
      <rect x={2} y={-6} width={1} height={1} fill="#4fc3f7" />
    </g>
  )
}

export function AxeReturn({ result }: { result: FeedResult }) {
  const who = result.hits[0]
  const skin = SKIN[who?.avatar?.skin ?? 0] ?? SKIN[0]
  // as placas são de quem errou; sozinho no bolão, placas genéricas
  const losers = useMemo(() => {
    const names = result.players.filter((p) => p.username !== who?.username).map((p) => p.username)
    return (names.length ? names : ['errou', 'errou', 'errou']).slice(0, 4)
  }, [result, who])
  const signX = (i: number) => 64 + i * (84 / losers.length)
  // hora em que o machado passa por cada placa (vem da direita pra esquerda)
  const passAt = (i: number) => 0.9 + ((150 - signX(i)) / 115) * (CATCH - 0.9)

  return (
    <Stage
      overlay={
        <>
          <motion.p
            className="absolute inset-x-0 text-center font-display leading-none text-[#e8f6ff]"
            style={{ top: cq(10), fontSize: cq(11), textShadow: `${cq(0.8)} ${cq(0.8)} 0 #16243a` }}
            initial={{ opacity: 0, scale: 1.2 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: SLAM + 0.5, duration: 0.4, ease: steps(4) }}
          >
            +{result.value}
          </motion.p>
          <Caption result={result} note={`Só ${who?.username ?? ''} acertou. O resto virou gelo.`} delay={SLAM + 1.2} />
        </>
      }
    >
      <motion.g {...shake(SLAM, 3)}>
        <Snowland />
        <Snow />
        {/* placas de quem errou, quebrando quando o machado passa */}
        {losers.map((name, i) => (
          <g key={i}>
            <rect x={signX(i) + 7} y={50} width={2} height={14} fill="#5a3d23" />
            <motion.g
              style={{ originX: 0.5, originY: 0.5 }}
              animate={{ y: [0, 0, 18], rotate: [0, 0, 70], opacity: [1, 1, 0.6] }}
              transition={{ delay: passAt(i), duration: 0.6, times: [0, 0.05, 1], ease: steps(5) }}
            >
              <rect x={signX(i)} y={40} width={16} height={10} fill="#8a5a2a" />
              <rect x={signX(i)} y={40} width={16} height={1} fill="#a87a44" />
              <text x={signX(i) + 8} y={47} fontSize={3.6} textAnchor="middle" fill="#2a1a0a" fontFamily="'Jersey 10', monospace">{name.slice(0, 7)}</text>
            </motion.g>
            <Burst x={signX(i) + 8} y={44} n={8} delay={passAt(i)} colors={['#8a5a2a', '#a87a44']} spread={10} up={8} size={1} dur={0.6} seed={i + 30} />
          </g>
        ))}
        {/* vencedor com a mão estendida */}
        <Body avatar={who?.avatar} x={36} y={66} s={0.9} />
        <rect x={45} y={52} width={6} height={2} fill={skin} />
        {/* machado voltando girando até a mão */}
        <motion.g initial={{ x: 190, y: 40 }} animate={{ x: [190, 120, 52, 52], y: [40, 46, 52, 52] }} transition={{ delay: 0.9, duration: CATCH - 0.9 + 0.01, times: [0, 0.5, 0.99, 1], ease: steps(16) }}>
          <motion.g animate={{ rotate: [0, -1080, -1080] }} transition={{ delay: 0.9, duration: CATCH - 0.9, ease: steps(18) }}>
            <Axe />
          </motion.g>
        </motion.g>
        {/* trilho de vento atrás do machado */}
        <motion.rect y={46} height={1} fill="#e8f2fa" initial={{ x: 160, width: 0, opacity: 0 }} animate={{ x: [160, 60], width: [0, 40, 0], opacity: [0, 0.6, 0] }} transition={{ delay: 1.1, duration: 1.4, ease: steps(8) }} />
        {/* gelo espalhando a partir da pancada */}
        {Array.from({ length: 9 }, (_, i) => {
          const x = 30 + i * 14
          const h = 6 + ((i * 7) % 9)
          return (
            <motion.g key={i} style={{ originX: 0.5, originY: 1 }} initial={{ scaleY: 0, opacity: 0 }} animate={{ scaleY: 1, opacity: 1 }} transition={{ delay: SLAM + 0.05 + i * 0.07, duration: 0.25, ease: steps(3) }}>
              <rect x={x} y={66 - h} width={3} height={h} fill="#9fdcff" />
              <rect x={x + 1} y={66 - h} width={1} height={h} fill="#e6f7ff" />
            </motion.g>
          )
        })}
        <Burst x={52} y={64} n={14} delay={SLAM} colors={['#e6f7ff', '#9fdcff']} spread={30} up={14} size={1} dur={0.8} seed={44} />
      </motion.g>
      {/* tudo congela: véu azul gelado */}
      <motion.rect width={W} height={H} fill="#9fdcff" initial={{ opacity: 0 }} animate={{ opacity: 0.32 }} transition={{ delay: SLAM + 0.1, duration: 0.6, ease: steps(4) }} />
      <motion.rect width={W} height={H} fill="#fff" initial={{ opacity: 0 }} animate={{ opacity: [0, 0.8, 0] }} transition={{ delay: SLAM, duration: 0.3, ease: steps(3) }} />
    </Stage>
  )
}
