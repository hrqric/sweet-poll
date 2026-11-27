import { useMemo, type ReactNode } from 'react'
import { motion } from 'motion/react'
import type { FeedResult } from '../../../lib/resultsFeed'
import { BigText, Body, Burst, Caption, H, Stage, W, cast, seeded, shake, steps } from '../kit'

/**
 * Três ou mais · "Caçada concluída" (homenagem a caça de monstros): cada vencedor com uma arma
 * diferente, o dragão ruge, o grupo avança e acerta um ataque conjunto, o bicho tomba e todo
 * mundo posa com as armas: QUEST COMPLETE.
 */
const ROAR = 1.2
const CHARGE = 2.2
const HIT = 3.0
const POSE = 4.2

/** Armas na mão, desenhadas a partir da mão (x, y) apontando pra cima. */
const WEAPONS: ((x: number, y: number) => ReactNode)[] = [
  (x, y) => <g><rect x={x} y={y - 12} width={2} height={12} fill="#d9e3f0" /><rect x={x - 2} y={y - 1} width={6} height={1} fill="#8a5a2a" /></g>, // espadão
  (x, y) => <g><rect x={x} y={y - 10} width={1} height={10} fill="#6b4a2b" /><rect x={x - 3} y={y - 13} width={7} height={4} fill="#7d7d8a" /></g>, // martelo
  (x, y) => <g><rect x={x} y={y - 12} width={1} height={12} fill="#8a5a2a" /><rect x={x + 1} y={y - 11} width={1} height={10} fill="#e8e8e0" opacity={0.6} /></g>, // arco
  (x, y) => <g><rect x={x} y={y - 16} width={1} height={16} fill="#9aa8b8" /><rect x={x - 1} y={y - 18} width={3} height={3} fill="#d9e3f0" /></g>, // lança
  (x, y) => <g><rect x={x} y={y - 10} width={1} height={10} fill="#6b4a2b" /><rect x={x + 1} y={y - 10} width={4} height={4} fill="#aebccb" /></g>, // machado
  (x, y) => <g><rect x={x - 1} y={y - 8} width={3} height={8} fill="#3d4248" /><rect x={x - 1} y={y - 10} width={2} height={2} fill="#7d7d8a" /></g>, // arma de fogo
]

function Plains() {
  const rnd = seeded(41)
  return (
    <>
      <rect width={W} height={H} fill="#8fc6e8" />
      <rect y={30} width={W} height={10} fill="#a9d4ec" />
      {/* serra e floresta */}
      {[[-10, 40, 60, 18], [40, 40, 80, 24], [110, 40, 70, 20]].map(([x, y, w, h], i) => (
        <g key={i}>{Array.from({ length: h }, (_, k) => { const rw = Math.round((w * (k + 1)) / h); return <rect key={k} x={x + (w - rw) / 2} y={y - h + k} width={rw} height={1} fill="#6a8aa8" /> })}</g>
      ))}
      {Array.from({ length: 20 }, (_, i) => <rect key={i} x={i * 8} y={40 + (i % 3)} width={7} height={12} fill={i % 2 ? '#2f6b3a' : '#3a7a44'} />)}
      <rect y={52} width={W} height={38} fill="#6ab04c" />
      <rect y={52} width={W} height={1} fill="#8ad06a" />
      {Array.from({ length: 30 }, (_, i) => <rect key={i} x={Math.floor(rnd() * W)} y={54 + Math.floor(rnd() * 34)} width={2} height={1} fill="#5a9a3e" />)}
    </>
  )
}

/** Dragão (wyvern) de lado, virado pra esquerda; asas batem. */
function Dragon() {
  return (
    <g>
      {/* asa de trás */}
      <motion.g style={{ originX: 0.1, originY: 1 }} animate={{ scaleY: [1, 0.5, 1] }} transition={{ duration: 0.6, repeat: 6, ease: steps(2) }}>
        <rect x={112} y={14} width={4} height={20} fill="#6a1a1a" />
        <rect x={116} y={18} width={20} height={14} fill="#8a2a2a" />
        <rect x={136} y={24} width={10} height={6} fill="#8a2a2a" />
      </motion.g>
      {/* corpo, cauda e pernas */}
      <rect x={104} y={32} width={34} height={16} fill="#3a7a3a" />
      <rect x={104} y={44} width={34} height={4} fill="#c8a85a" />
      <rect x={138} y={36} width={14} height={6} fill="#3a7a3a" />
      <rect x={150} y={40} width={10} height={4} fill="#3a7a3a" />
      <rect x={110} y={48} width={6} height={14} fill="#2a5a2a" />
      <rect x={128} y={48} width={6} height={14} fill="#2a5a2a" />
      <rect x={108} y={61} width={9} height={2} fill="#1a3a1a" />
      <rect x={126} y={61} width={9} height={2} fill="#1a3a1a" />
      {/* pescoço e cabeça com a bocarra */}
      <rect x={96} y={24} width={12} height={12} fill="#3a7a3a" />
      <rect x={82} y={20} width={18} height={10} fill="#4a8a4a" />
      <rect x={82} y={28} width={14} height={3} fill="#c8a85a" />
      <rect x={88} y={22} width={2} height={2} fill="#ffe27a" />
      <rect x={96} y={16} width={3} height={5} fill="#e8e0c8" />
      <rect x={83} y={30} width={1} height={2} fill="#ffffff" />
      <rect x={86} y={30} width={1} height={2} fill="#ffffff" />
      {/* espinhos nas costas */}
      {[106, 114, 122, 130].map((x) => <rect key={x} x={x} y={29} width={3} height={3} fill="#2a5a2a" />)}
    </g>
  )
}

export function QuestComplete({ result }: { result: FeedResult }) {
  const party = useMemo(() => cast(result.hits, 6), [result])
  const gap = Math.min(13, 72 / party.length)
  const px = (i: number) => 12 + i * gap

  return (
    <Stage
      overlay={
        <>
          <BigText color="#f8d35a" delay={POSE + 0.2} style={{ textShadow: '0.5cqw 0.5cqw 0 #3a2a08, -0.3cqw -0.3cqw 0 #3a2a08', top: '14%' }}>
            QUEST COMPLETE
          </BigText>
          <Caption result={result} note={`${result.hits.length} caçadores acertaram. Recompensa: +${result.value} cada.`} delay={POSE + 0.9} />
        </>
      }
    >
      <motion.g {...shake(ROAR, 2)}>
        <motion.g {...shake(HIT, 3)}>
          <Plains />
          {/* rugido: ondas saindo da boca */}
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: [0, 0.8, 0] }} transition={{ delay: ROAR, duration: 0.8, ease: steps(4) }}>
            {[6, 12, 18].map((r) => <rect key={r} x={82 - r} y={25 - r / 2} width={2} height={r} fill="#ffffff" opacity={0.6} />)}
          </motion.g>
          {/* dragão: pisca no golpe e tomba de lado */}
          <motion.g style={{ originX: 0.5, originY: 1 }} animate={{ rotate: [0, 0, -38], y: [0, 0, 10], opacity: [1, 1, 1, 0.85] }} transition={{ delay: HIT + 0.3, duration: 0.8, times: [0, 0.05, 1], ease: steps(5) }}>
            <Dragon />
            <motion.rect x={80} y={14} width={80} height={50} fill="#ffffff" initial={{ opacity: 0 }} animate={{ opacity: [0, 0.8, 0, 0.8, 0] }} transition={{ delay: HIT, duration: 0.5, ease: 'linear' }} />
          </motion.g>
          <Burst x={98} y={40} n={26} delay={HIT} colors={['#ffe27a', '#ffffff', '#ff6b3d']} spread={30} up={24} size={2} dur={0.9} seed={42} />
          <Burst x={118} y={62} n={18} delay={HIT + 0.9} colors={['#8a6a3a', '#a0805a']} spread={40} up={10} size={2} dur={0.9} seed={43} />
          {/* caçadores: avançam juntos no ataque e voltam pra posar */}
          {party.map((p, i) => (
            <motion.g key={i} animate={{ x: [0, 0, 30 - i * 2, 30 - i * 2, 6] }} transition={{ delay: CHARGE, duration: POSE - CHARGE, times: [0, 0.05, 0.4, 0.7, 1], ease: steps(6) }}>
              <motion.g animate={{ y: [0, 0, -6, 0] }} transition={{ delay: POSE, duration: 0.5, times: [0, 0.1, 0.5, 1], ease: steps(3) }}>
                <Body avatar={p.avatar} x={px(i)} y={66} s={0.62} />
                {WEAPONS[i % WEAPONS.length](px(i) + 5, 60)}
              </motion.g>
            </motion.g>
          ))}
        </motion.g>
      </motion.g>
    </Stage>
  )
}
