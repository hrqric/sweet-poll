import { composeGrid, gridToRects, DEFAULT_AVATAR, type Avatar } from '../../lib/sprites'

/** Movimento em degraus, igual sprite de NES: nada de easing liso. */
export const steps = (n: number) => (t: number) => Math.round(t * n) / n

/** Retângulos da cabeça do boneco (linhas 0–12 do grid 20×22), pra desenhar dentro de outras cenas. */
export function headRects(avatar: Avatar | null | undefined) {
  return gridToRects(composeGrid(avatar ?? DEFAULT_AVATAR, { transparent: true })).filter((r) => r.y < 13)
}

/** Gerador pseudoaleatório com semente: o cenário sai igual em toda tela (e entre renders). */
export function seeded(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
