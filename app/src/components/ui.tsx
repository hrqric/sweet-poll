import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { sfx } from '../lib/sfx'

// ───── ícones de pixel ─────
export function CoinIcon({ size = 20, spin = false }: { size?: number; spin?: boolean }) {
  return (
    <svg viewBox="0 0 8 8" width={size} height={size} shapeRendering="crispEdges" className={spin ? 'anim-coin' : ''} aria-hidden>
      <path fill="#181020" d="M2 0h4v1H2zM1 1h1v1H1zM6 1h1v1H6zM0 2h1v4H0zM7 2h1v4H7zM1 6h1v1H1zM6 6h1v1H6zM2 7h4v1H2z" />
      <path fill="#f8b800" d="M2 1h4v1H2zM1 2h6v4H1zM2 6h4v1H2z" />
      <path fill="#ac7c00" d="M4 2h1v4H4zM6 3h1v3H6zM5 6h1v1H5z" />
      <path fill="#fcf4b0" d="M2 2h1v2H2z" />
    </svg>
  )
}

export function TrophyIcon({ size = 24 }: { size?: number }) {
  return (
    <svg viewBox="0 0 8 8" width={size} height={size} shapeRendering="crispEdges" aria-hidden>
      <path fill="#181020" d="M1 0h6v1H1zM0 1h1v2H0zM7 1h1v2H7zM1 3h1v1H1zM6 3h1v1H6zM2 4h1v1H2zM5 4h1v1H5zM3 5h2v1H3zM2 6h4v2H2z" />
      <path fill="#f8b800" d="M1 1h6v2H1zM2 3h4v1H2zM3 4h2v1H3zM3 6h2v1H3z" />
      <path fill="#fcfcfc" d="M2 1h1v1H2z" />
    </svg>
  )
}

export function Coins({ value, size = 20, className = '' }: { value: number; size?: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 font-display tabular-nums leading-none ${className}`}>
      <CoinIcon size={size} />
      <span style={{ fontSize: size * 1.15 }}>{value}</span>
    </span>
  )
}

/** Ordinal "1º" — a Jersey 10 não tem o glifo º, então ele vem da fonte de texto. */
export function Ord({ n }: { n: number | null | undefined }) {
  return (
    <>
      {n ?? '–'}
      <span className="font-body align-[0.35em] text-[0.5em] font-bold">º</span>
    </>
  )
}

// ───── painéis ─────
export function Panel({
  children,
  className = '',
  title,
  aside,
}: {
  children: ReactNode
  className?: string
  title?: ReactNode
  aside?: ReactNode
}) {
  return (
    <section className={`px-box p-5 sm:p-6 ${className}`}>
      {(title || aside) && (
        <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
          {title && <h2 className="font-display text-3xl leading-none sm:text-4xl">{title}</h2>}
          {aside}
        </header>
      )}
      {children}
    </section>
  )
}

export function Loading({ label = 'Carregando' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-16" role="status">
      <span className="font-display text-3xl text-paper drop-shadow-[3px_3px_0_#181020]">
        {label}
        <span className="anim-blink">_</span>
      </span>
    </div>
  )
}

export function Tag({ children, color = '#181020', className = '' }: { children: ReactNode; color?: string; className?: string }) {
  return (
    <span
      className={`inline-block px-2 pt-0.5 pb-1 font-display text-lg leading-none text-paper ${className}`}
      style={{ background: color }}
    >
      {children}
    </span>
  )
}

export const STATUS_TAG = {
  open: { label: 'Palpites abertos', color: '#00a844' },
  locked: { label: 'Palpites fechados', color: '#c84c0c' },
  finished: { label: 'Encerrado', color: '#181020' },
} as const

// ───── modal ─────
export function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal
            className="px-dialog w-full max-w-md p-6"
            initial={{ scale: 0.6 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.6 }}
            transition={{ type: 'tween', ease: [0, 0, 1, 1], duration: 0.12 }}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ───── toasts ─────
type Toast = { id: number; text: string; kind: 'ok' | 'err' | 'coin' }
const ToastCtx = createContext<(text: string, kind?: Toast['kind']) => void>(() => {})

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([])
  const push = useCallback((text: string, kind: Toast['kind'] = 'ok') => {
    const id = Date.now() + Math.random()
    if (kind === 'err') sfx.error()
    setItems((xs) => [...xs, { id, text, kind }])
    setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), 3200)
  }, [])
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex flex-col items-center gap-3 px-4" aria-live="polite">
        <AnimatePresence>
          {items.map((t) => (
            <motion.div
              key={t.id}
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ type: 'tween', duration: 0.15 }}
              className={`px-dialog flex items-center gap-3 px-5 py-3 font-body text-lg ${t.kind === 'err' ? 'text-[#fc9c8c]' : ''}`}
            >
              {t.kind === 'coin' && <CoinIcon size={22} spin />}
              {t.kind === 'err' && <span className="font-display text-2xl leading-none">!</span>}
              {t.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  )
}

export function useToast() {
  return useContext(ToastCtx)
}
