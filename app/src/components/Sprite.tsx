import { useMemo, type CSSProperties } from 'react'
import { composeGrid, gridToRects, GRID_H, GRID_W, DEFAULT_AVATAR, type Avatar } from '../lib/sprites'

type Props = {
  avatar: Avatar | null | undefined
  /** largura em px; a altura segue a proporção 20×22 */
  size?: number
  transparent?: boolean
  bob?: boolean
  className?: string
  title?: string
}

export function Sprite({ avatar, size = 80, transparent, bob, className = '', title }: Props) {
  const rects = useMemo(
    () => gridToRects(composeGrid(avatar ?? DEFAULT_AVATAR, { transparent })),
    [avatar, transparent],
  )
  return (
    <svg
      viewBox={`0 0 ${GRID_W} ${GRID_H}`}
      width={size}
      height={Math.round((size * GRID_H) / GRID_W)}
      shapeRendering="crispEdges"
      className={`${bob ? 'anim-bob' : ''} ${className}`}
      style={bob ? ({ '--bob': `${Math.max(2, Math.round(size / 20))}px` } as CSSProperties) : undefined}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {rects.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={1} fill={r.fill} />
      ))}
    </svg>
  )
}

/** Só a cabeça (recorte das linhas 0–12), pra HUD e listas. */
export function Head({ avatar, size = 36, className = '' }: { avatar: Avatar | null | undefined; size?: number; className?: string }) {
  const rects = useMemo(() => gridToRects(composeGrid(avatar ?? DEFAULT_AVATAR)), [avatar])
  return (
    <svg
      viewBox="2 0 16 13"
      width={size}
      height={Math.round((size * 13) / 16)}
      shapeRendering="crispEdges"
      className={className}
      aria-hidden
    >
      {rects.filter((r) => r.y < 13).map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={1} fill={r.fill} />
      ))}
    </svg>
  )
}
