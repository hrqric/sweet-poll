import { motion } from 'motion/react'
import { Sprite } from '../Sprite'
import { CoinIcon, TrophyIcon } from '../ui'
import type { FeedResult } from '../../lib/resultsFeed'
import { steps } from './shared'

export const MAX_SPRITES = 7

/**
 * Animação A ("Placa de NES"): placa que sobe do pé da tela com os bonecos de quem acertou.
 * Hoje é a cena de quando 2+ pessoas acertam, e o plano B se alguma cena nova não agradar.
 */
export function CardA({ result }: { result: FeedResult }) {
  const shown = result.hits.slice(0, MAX_SPRITES)
  const extra = result.hits.length - shown.length

  return (
    <div className="absolute inset-0 flex items-end justify-center">
      <motion.div
        className="px-dialog mb-[4cqw] w-[min(92cqw,980px)] text-paper"
        style={{ padding: 'max(12px, 2.2cqw) max(14px, 2.6cqw)' }}
        initial={{ y: '140%' }}
        animate={{ y: 0, transition: { duration: 0.45, ease: steps(6) } }}
        exit={{ y: '140%', transition: { duration: 0.35, ease: steps(5) } }}
      >
        <div className="flex items-center justify-between gap-[2cqw]">
          <div className="flex min-w-0 items-center gap-[1.6cqw]">
            <motion.span
              className="shrink-0"
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.3, 1], transition: { delay: 0.35, duration: 0.4, ease: steps(4) } }}
            >
              <span className="block w-[max(24px,4.6cqw)] [&>svg]:h-auto [&>svg]:w-full"><TrophyIcon size={48} /></span>
            </motion.span>
            <div className="min-w-0">
              <p className="font-display leading-none text-coin" style={{ fontSize: 'clamp(13px, 2.1cqw, 26px)' }}>
                {result.category}
              </p>
              {/* nome do vencedor é a informação principal: quebra em 2 linhas em vez de cortar */}
              <motion.p
                className="mt-[0.3cqw] line-clamp-2 font-display leading-[0.95] break-words"
                style={{ fontSize: 'clamp(20px, 4.6cqw, 58px)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { delay: 0.5, duration: 0.2, ease: steps(2) } }}
              >
                {result.winner}
              </motion.p>
            </div>
          </div>
          <span className="flex shrink-0 items-center gap-[0.8cqw] font-display leading-none text-coin" style={{ fontSize: 'clamp(16px, 2.6cqw, 32px)' }}>
            {/* moeda acompanha o tamanho do texto em vez de ficar fixa em 28px */}
            <span className="block w-[0.9em] [&>svg]:h-auto [&>svg]:w-full"><CoinIcon size={28} spin /></span>
            +{result.value}
            <span className="sr-only"> moedas</span>
          </span>
        </div>

        <div className="mt-[1.6cqw] border-t-4 border-dashed border-paper/25 pt-[1.4cqw]">
          {shown.length === 0 ? (
            <motion.p
              className="font-display text-paper-3"
              style={{ fontSize: 'clamp(14px, 2.6cqw, 32px)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.9, duration: 0.2, ease: steps(2) } }}
            >
              Ninguém acertou essa.
            </motion.p>
          ) : (
            <div className="flex items-end gap-[1.6cqw]">
              <span className="mr-[0.6cqw] shrink-0 self-center font-display leading-none text-paper-3" style={{ fontSize: 'clamp(13px, 2cqw, 24px)' }}>
                {result.hits.length === 1 ? 'Acertou:' : `Acertaram (${result.hits.length}):`}
              </span>
              {shown.map((h, i) => (
                <motion.div
                  key={h.username}
                  className="flex min-w-0 flex-col items-center"
                  initial={{ y: '60%', opacity: 0 }}
                  animate={{
                    y: ['60%', '-25%', '0%'],
                    opacity: 1,
                    transition: { delay: 0.9 + i * 0.16, duration: 0.42, ease: steps(5) },
                  }}
                >
                  <Sprite avatar={h.avatar} size={64} transparent bob className="h-auto w-[max(28px,6.4cqw)]" />
                  <span
                    className="mt-[0.4cqw] max-w-[max(52px,9cqw)] truncate font-display leading-none"
                    style={{ fontSize: 'clamp(12px, 1.6cqw, 20px)' }}
                  >
                    {h.username}
                  </span>
                </motion.div>
              ))}
              {extra > 0 && (
                <span className="self-center font-display text-coin" style={{ fontSize: 'clamp(14px, 2.4cqw, 30px)' }}>
                  +{extra}
                </span>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
