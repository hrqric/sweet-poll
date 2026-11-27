import type { ComponentType } from 'react'
import { cue, sfx } from '../../lib/sfx'
import { BossSlam } from './scenes/BossSlam'
import { Wasted } from './scenes/Wasted'
import { BombCritter } from './scenes/BombCritter'
import type { FeedResult } from '../../lib/resultsFeed'
import { CardA, MAX_SPRITES } from './CardA'
import { DriveScene } from './DriveScene'
import { BoatScene } from './BoatScene'

/** As quatro situações de um resultado; cada uma tem sua própria lista de animações. */
export type Situation = 'solo' | 'none' | 'duo' | 'group'

export const SITUATION_LABEL: Record<Situation, string> = {
  solo: 'Acertou sozinho',
  none: 'Ninguém acertou',
  duo: 'Duas pessoas',
  group: 'Três ou mais',
}

export type SceneDef = {
  /** id estável: entra no sorteio, então não renomeie depois de publicado */
  id: string
  name: string
  Component: ComponentType<{ result: FeedResult }>
  duration: (r: FeedResult) => number
  sound: () => void
}

const cardA: Omit<SceneDef, 'id'> = {
  name: 'Placa de NES',
  Component: CardA,
  duration: (r) => 8000 + Math.max(0, Math.min(r.hits.length, MAX_SPRITES) - 3) * 500,
  sound: sfx.win,
}

/**
 * Catálogo de cenas. Pra adicionar uma animação nova: crie o componente em announce/ e
 * coloque aqui na situação certa. O sorteio passa a considerá-la sozinho.
 */
export const SCENES: Record<Situation, SceneDef[]> = {
  solo: [{ id: 'drive-neon', name: 'Carro na cidade neon', Component: DriveScene, duration: () => 9500, sound: sfx.drive }],
  none: [
    { id: 'boat-fog', name: 'Barco na neblina', Component: BoatScene, duration: () => 9000, sound: sfx.sad },
    { id: 'boss-slam', name: 'Chefe da arena (YOU ALL DIED)', Component: BossSlam, duration: () => 10000, sound: cue([3.4, sfx.thud], [5.2, sfx.doom]) },
    { id: 'wasted', name: 'Atropelados (WASTED)', Component: Wasted, duration: () => 9000, sound: cue([0.4, sfx.win], [3.0, sfx.crash], [4.1, sfx.doom]) },
    { id: 'bomb-critter', name: 'Bicho-bomba', Component: BombCritter, duration: () => 10000, sound: cue([3.1, sfx.hiss], [4.9, sfx.boom]) },
  ],
  duo: [{ id: 'card-a-duo', ...cardA }],
  group: [{ id: 'card-a', ...cardA }],
}

export const ALL_SCENES: (SceneDef & { situation: Situation })[] = (Object.keys(SCENES) as Situation[]).flatMap((s) =>
  SCENES[s].map((d) => ({ ...d, situation: s })),
)

export function situationOf(r: FeedResult): Situation {
  if (r.hits.length === 0) return 'none'
  if (r.hits.length === 1) return 'solo'
  if (r.hits.length === 2) return 'duo'
  return 'group'
}

/** FNV-1a: mesmo texto, mesmo número, em qualquer navegador. */
function hash(s: string) {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/**
 * Sorteia a cena de cada resultado, na ordem em que os vencedores saíram.
 * - Determinístico (semente = categoria): todos os amigos e o telão do OBS veem a mesma cena.
 * - Evita repetir a cena do resultado anterior quando a situação tem mais de uma opção.
 */
export function assignScenes(history: FeedResult[]): Map<string, string> {
  const out = new Map<string, string>()
  let last = ''
  for (const r of history) {
    const list = SCENES[situationOf(r)]
    let i = hash(r.category_id) % list.length
    if (list.length > 1 && list[i].id === last) i = (i + 1) % list.length
    out.set(r.category_id, list[i].id)
    last = list[i].id
  }
  return out
}

/** Cena de um resultado: a escolhida à força (teste), a do sorteio, ou um sorteio avulso. */
export function sceneFor(r: FeedResult, assigned: Map<string, string>): SceneDef {
  const list = SCENES[situationOf(r)]
  const id = r.scene ?? assigned.get(r.category_id)
  return ALL_SCENES.find((d) => d.id === id) ?? list[hash(r.category_id) % list.length]
}
