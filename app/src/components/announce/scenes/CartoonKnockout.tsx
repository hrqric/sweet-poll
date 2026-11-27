import { useMemo } from 'react'
import { motion } from 'motion/react'
import type { FeedResult } from '../../../lib/resultsFeed'
import { Body, Burst, Caption, H, Stage, W, cast, cq, seeded, steps } from '../kit'

/**
 * Duas pessoas · "Knockout" (homenagem a desenho animado dos anos 30): os dois enfrentam um
 * chefão cartunesco atirando juntos, a barra de vida zera, ele explode e cai, e a dupla faz uma
 * dancinha sincronizada. Tudo em filme velho: sépia, granulado, riscos e tremidinha.
 */
const KO = 3.3

function Field() {
  return (
    <>
      <rect width={W} height={H} fill="#d9e4d0" />
      {[[16, 12, 20], [70, 6, 26], [124, 16, 18]].map(([x, y, w]) => (
        <g key={x} fill="#f4f1e6"><rect x={x} y={y} width={w} height={5} /><rect x={x + 3} y={y - 3} width={w - 8} height={3} /><rect x={x + 6} y={y + 5} width={w - 10} height={2} /></g>
      ))}
      {/* morros redondinhos */}
      {[[-10, 54, 60, 16], [40, 58, 70, 12], [100, 52, 70, 18]].map(([x, y, w, h], i) => (
        <g key={i}>
          {Array.from({ length: h }, (_, k) => {
            const rw = Math.round(w * Math.sqrt(1 - ((h - k) / h) ** 2))
            return <rect key={k} x={x + (w - rw) / 2} y={y + k - h + 8} width={rw} height={1} fill={i % 2 ? '#a8c08e' : '#98b47e'} />
          })}
        </g>
      ))}
      <rect y={62} width={W} height={28} fill="#c4b48a" />
      <rect y={62} width={W} height={1} fill="#8a7a54" />
    </>
  )
}

/** Chefão redondo de borracha: corpo laranja, sobrancelhas bravas, luvas brancas. */
function Boss() {
  return (
    <g>
      {/* corpo em "círculo" de degraus */}
      {Array.from({ length: 34 }, (_, k) => {
        const rw = Math.round(2 * Math.sqrt(17 ** 2 - (k - 17) ** 2))
        return <rect key={k} x={124 - rw / 2} y={24 + k} width={rw} height={1} fill={k < 6 ? '#f08a5a' : '#e86a3a'} />
      })}
      <rect x={110} y={35} width={7} height={6} fill="#fff" />
      <rect x={124} y={35} width={7} height={6} fill="#fff" />
      <rect x={112} y={37} width={3} height={3} fill="#111" />
      <rect x={126} y={37} width={3} height={3} fill="#111" />
      <rect x={108} y={31} width={9} height={2} fill="#111" transform="rotate(12 112 32)" />
      <rect x={124} y={31} width={9} height={2} fill="#111" transform="rotate(-12 128 32)" />
      <rect x={113} y={47} width={14} height={3} fill="#5a1a10" />
      <rect x={115} y={47} width={3} height={2} fill="#fff" />
      <rect x={122} y={47} width={3} height={2} fill="#fff" />
      {/* braços de mangueira e luvas */}
      <rect x={98} y={44} width={10} height={2} fill="#111" />
      <rect x={93} y={41} width={6} height={6} fill="#fff" />
      <rect x={140} y={44} width={8} height={2} fill="#111" />
      <rect x={147} y={41} width={6} height={6} fill="#fff" />
      <rect x={116} y={57} width={2} height={6} fill="#111" />
      <rect x={130} y={57} width={2} height={6} fill="#111" />
      <rect x={112} y={62} width={8} height={3} fill="#5a1a10" />
      <rect x={128} y={62} width={8} height={3} fill="#5a1a10" />
    </g>
  )
}

/** Película velha: granulado, riscos e cantos escuros. */
function OldFilm() {
  const rnd = seeded(91)
  return (
    <g>
      {Array.from({ length: 18 }, (_, i) => (
        <motion.rect
          key={i}
          x={Math.floor(rnd() * W)}
          y={Math.floor(rnd() * H)}
          width={1}
          height={1}
          fill={i % 3 ? '#2a2016' : '#fff8e0'}
          animate={{ opacity: [0, 0.8, 0] }}
          transition={{ duration: 0.25, delay: rnd() * 0.5, repeat: 30, repeatDelay: rnd() * 0.4, ease: steps(1) }}
        />
      ))}
      {[30, 112].map((x, i) => (
        <motion.rect key={x} x={x} y={0} width={1} height={H} fill="#2a2016" opacity={0.25} animate={{ x: [0, 6, -4, 10, 0] }} transition={{ duration: 2 + i, repeat: 4, ease: steps(5) }} />
      ))}
      <rect width={W} height={4} fill="#2a2016" opacity={0.35} />
      <rect y={H - 4} width={W} height={4} fill="#2a2016" opacity={0.35} />
      <rect width={5} height={H} fill="#2a2016" opacity={0.3} />
      <rect x={W - 5} width={5} height={H} fill="#2a2016" opacity={0.3} />
    </g>
  )
}

export function CartoonKnockout({ result }: { result: FeedResult }) {
  const duo = useMemo(() => cast(result.hits, 2), [result])
  const hx = [24, 44]

  return (
    <Stage
      className="[filter:sepia(0.65)_contrast(1.1)]"
      overlay={
        <>
          <motion.p
            className="absolute inset-x-0 text-center font-display leading-none text-[#fbefcf]"
            style={{ top: cq(14), fontSize: cq(17), textShadow: `${cq(1)} ${cq(1)} 0 #3a2410, -${cq(0.5)} -${cq(0.5)} 0 #3a2410` }}
            initial={{ opacity: 0, scale: 0.4, rotate: -6 }}
            animate={{ opacity: 1, scale: [0.4, 1.15, 1], rotate: [-6, 3, -2] }}
            transition={{ delay: KO + 0.3, duration: 0.6, ease: steps(5) }}
          >
            A KNOCKOUT!
          </motion.p>
          <Caption result={result} note={`${duo[0]?.username} e ${duo[1]?.username} acertaram juntos.`} tone="light" delay={KO + 1.4} />
        </>
      }
    >
      {/* o filme inteiro dá umas tremidinhas */}
      <motion.g animate={{ y: [0, 1, 0, -1, 0] }} transition={{ duration: 0.5, repeat: 18, ease: steps(4) }}>
        <Field />
        {/* barra de vida do chefão esvaziando */}
        <motion.g animate={{ opacity: [1, 1, 0] }} transition={{ delay: KO, duration: 0.3, times: [0, 0.5, 1] }}>
          <rect x={98} y={6} width={52} height={5} fill="#2a2016" />
          <motion.rect x={99} y={7} width={50} height={3} fill="#c0262d" style={{ originX: 0 }} initial={{ scaleX: 1 }} animate={{ scaleX: 0 }} transition={{ delay: 1.2, duration: KO - 1.2, ease: steps(10) }} />
        </motion.g>
        {/* chefão: pula provocando, pisca quando leva tiro, depois explode e cai */}
        <motion.g
          style={{ originX: 0.5, originY: 0.5 }}
          animate={{ y: [0, -3, 0, -3, 0, -3, 0, 0, 90], rotate: [0, 0, 0, 0, 0, 0, 0, 0, 160] }}
          transition={{ duration: KO + 1.2, times: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, KO / (KO + 1.2), 1], ease: steps(3) }}
        >
          <Boss />
          <motion.g fill="#fff" animate={{ opacity: [0, 0.7, 0, 0.7, 0, 0.7, 0, 0.7, 0] }} transition={{ delay: 1.3, duration: KO - 1.3, ease: steps(1) }}>
            <rect x={108} y={24} width={32} height={34} />
          </motion.g>
        </motion.g>
        <Burst x={124} y={40} n={24} delay={KO} colors={['#fff8e0', '#e86a3a', '#2a2016']} spread={40} up={26} size={2} dur={1} seed={92} />
        {/* dupla atirando junto e depois dançando no mesmo compasso */}
        {duo.map((p, i) => (
          <g key={i}>
            {Array.from({ length: 7 }, (_, k) => (
              <motion.rect
                key={k}
                x={hx[i] + 8}
                y={52 - i * 2}
                width={3}
                height={2}
                fill="#fff8e0"
                initial={{ opacity: 0 }}
                animate={{ x: [0, 0, 82], opacity: [0, 1, 1] }}
                transition={{ delay: 1.2 + k * 0.28 + i * 0.12, duration: 0.32, times: [0, 0.01, 1], ease: steps(6) }}
              />
            ))}
            <motion.g
              style={{ originX: 0.5, originY: 1 }}
              animate={{ y: [0, 0, -5, 0, -5, 0, -7, 0, -5, 0], scaleX: [1, 1, -1, -1, 1, 1, -1, -1, 1, 1] }}
              transition={{ delay: KO + 1.1, duration: 3.2, ease: steps(1) }}
            >
              <Body avatar={p.avatar} x={hx[i]} y={66} s={0.8} />
            </motion.g>
          </g>
        ))}
        <OldFilm />
      </motion.g>
    </Stage>
  )
}
