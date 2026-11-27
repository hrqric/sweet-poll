import { useEffect, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import type { FeedResult } from '../../../lib/resultsFeed'
import { Body, Caption, H, Loop, W, cast, cq, seeded, steps } from '../kit'

/**
 * Três ou mais · "Cavalgada ao pôr do sol" (homenagem a faroeste de mundo aberto): o bando
 * cavalga pelo deserto, a câmera acompanha de lado, todos levantam o chapéu e a imagem congela
 * num filtro vermelho: THE GANG WAS RIGHT.
 */
const HATS = 4.4
const FREEZE = 5.1

function Desert() {
  return (
    <>
      <rect width={W} height={H} fill="#3a1a3a" />
      <rect y={10} width={W} height={10} fill="#6a2a4a" />
      <rect y={20} width={W} height={10} fill="#a8404a" />
      <rect y={30} width={W} height={10} fill="#e0603a" />
      <rect y={40} width={W} height={10} fill="#f89a3a" />
      {/* sol se pondo */}
      {Array.from({ length: 14 }, (_, k) => {
        const rw = Math.round(2 * Math.sqrt(14 ** 2 - (14 - k) ** 2))
        return <rect key={k} x={110 - rw / 2} y={36 + k} width={rw} height={1} fill={k < 5 ? '#ffe08a' : '#ffc26a'} />
      })}
    </>
  )
}

const rnd = seeded(51)
const MESAS = Array.from({ length: 5 }, (_, i) => ({ x: i * 32 + Math.floor(rnd() * 10), w: 14 + Math.floor(rnd() * 12), h: 6 + Math.floor(rnd() * 10) }))
const CACTI = [12, 58, 104, 140]

function Horse({ x, y, coat }: { x: number; y: number; coat: string }) {
  const dark = '#2a1a10'
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={0} y={0} width={18} height={7} fill={coat} />
      <rect x={16} y={-5} width={5} height={7} fill={coat} />
      <rect x={20} y={-4} width={4} height={3} fill={coat} />
      <rect x={16} y={-6} width={3} height={2} fill={dark} />
      <rect x={21} y={-3} width={1} height={1} fill="#111" />
      <rect x={-3} y={1} width={4} height={2} fill={dark} />
      <rect x={-4} y={3} width={2} height={3} fill={dark} />
      {/* patas: duas poses alternando (galope) */}
      <g className="sp-gallop-a" fill={coat}>
        <rect x={1} y={7} width={2} height={6} /><rect x={5} y={7} width={2} height={5} /><rect x={12} y={7} width={2} height={6} /><rect x={15} y={7} width={2} height={5} />
      </g>
      <g className="sp-gallop-b" fill={coat}>
        <rect x={-1} y={7} width={2} height={5} transform="rotate(25 0 7)" /><rect x={6} y={7} width={2} height={6} /><rect x={13} y={7} width={2} height={5} transform="rotate(-25 14 7)" /><rect x={17} y={7} width={2} height={6} />
      </g>
    </g>
  )
}

export function SunsetRide({ result }: { result: FeedResult }) {
  const gang = useMemo(() => cast(result.hits, 6), [result])
  const [frozen, setFrozen] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setFrozen(true), FREEZE * 1000)
    return () => clearTimeout(t)
  }, [])
  const coats = ['#6b3a1a', '#3a2a1a', '#8a5a2a', '#d8c8b0', '#5a2a1a', '#2a2020']

  return (
    <motion.div
      className="absolute inset-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.3, ease: steps(3) } }}
      exit={{ opacity: 0, transition: { duration: 0.35, ease: steps(3) } }}
    >
      {/* a foto congelada ganha o filtro vermelho */}
      <motion.div
        className={`absolute inset-0 ${frozen ? 'sp-frozen' : ''}`}
        initial={{ filter: 'sepia(0) saturate(1) hue-rotate(0deg) contrast(1)' }}
        animate={{ filter: 'sepia(1) saturate(3.5) hue-rotate(-40deg) contrast(1.25)' }}
        transition={{ delay: FREEZE, duration: 0.4, ease: steps(3) }}
      >
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" shapeRendering="crispEdges" className="absolute inset-0 h-full w-full" aria-hidden>
          <Desert />
          <Loop dist={W} t={16}>
            {MESAS.map((m, i) => <rect key={i} x={m.x} y={50 - m.h} width={m.w} height={m.h} fill="#5a2a3a" />)}
          </Loop>
          <rect y={50} width={W} height={40} fill="#c87a4a" />
          <rect y={50} width={W} height={1} fill="#e09a5a" />
          <Loop dist={40} t={0.9}>
            {CACTI.slice(0, 1).map((x) => (
              <g key={x}><rect x={x} y={54} width={2} height={10} fill="#3a5a2a" /><rect x={x - 3} y={57} width={2} height={4} fill="#3a5a2a" /><rect x={x + 3} y={56} width={2} height={4} fill="#3a5a2a" /></g>
            ))}
            <rect x={28} y={84} width={4} height={1} fill="#a85a3a" />
          </Loop>
          <Loop dist={20} t={0.35}>
            <rect x={0} y={74} width={5} height={1} fill="#b86a3a" />
          </Loop>
          {/* o bando, em fila escalonada, galopando no lugar (o cenário é que corre) */}
          {gang.map((p, i) => {
            const x = 18 + (i % 3) * 40 + Math.floor(i / 3) * 18
            const y = 60 + Math.floor(i / 3) * 10 - (i % 3) * 2
            return (
              <g key={i} className="sp-bounce">
                <Body avatar={p.avatar} x={x + 10} y={y + 3} s={0.55} />
                <Horse x={x} y={y} coat={coats[i % coats.length]} />
                {/* chapéu de vaqueiro: sobe no aceno */}
                <motion.g initial={{ y: 0 }} animate={{ y: [0, -5] }} transition={{ delay: HATS + i * 0.08, duration: 0.25, ease: steps(2) }}>
                  <rect x={x + 5} y={y - 9} width={10} height={1} fill="#4a2a10" />
                  <rect x={x + 7} y={y - 12} width={6} height={3} fill="#5a3418" />
                </motion.g>
              </g>
            )
          })}
        </svg>
      </motion.div>

      <motion.p
        className="absolute inset-x-0 text-center font-display leading-none text-[#fbe7c8]"
        style={{ top: cq(12), fontSize: cq(12), letterSpacing: '0.04em', textShadow: `${cq(0.8)} ${cq(0.8)} 0 #3a0a0a` }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: FREEZE + 0.4, duration: 0.6, ease: steps(4) }}
      >
        THE GANG WAS RIGHT
      </motion.p>
      <Caption result={result} note={`${result.hits.length} acertaram. +${result.value} pro bando todo.`} delay={FREEZE + 1.1} />
    </motion.div>
  )
}
