import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from './supabase'
import type { Avatar } from './sprites'

export type FeedHit = { username: string; avatar: Avatar | null }
export type FeedResult = {
  category_id: string
  category: string
  position: number
  value: number
  winner: string
  winner_sub: string
  set_at: string | null
  hits: FeedHit[]
  /** todos os participantes do bolão (bonecos, não palpites), pras cenas que mostram o grupo inteiro */
  players: FeedHit[]
  /** só em teste: força uma cena específica em vez do sorteio */
  scene?: string
}
export type FeedPool = { id: string; name: string; status: string; members: number; players: FeedHit[] }

const keyOf = (r: FeedResult) => `${r.winner}|${r.set_at ?? ''}`

/**
 * Lê os vencedores do bolão pelo código de convite (funciona sem login, pro overlay do OBS) e
 * enfileira só os que saíram DEPOIS que a tela abriu: quem chega no meio da cerimônia não leva
 * uma rajada de animações antigas. Polling a cada `intervalMs`; com `realtime` (precisa de login,
 * por causa do RLS) também escuta as categorias do bolão pra animar na hora.
 */
export function useResultsFeed(code: string, opts: { realtime?: boolean; intervalMs?: number } = {}) {
  const { realtime = false, intervalMs = 5000 } = opts
  const [pool, setPool] = useState<FeedPool | null>(null)
  const [results, setResults] = useState<FeedResult[]>([])
  const [queue, setQueue] = useState<FeedResult[]>([])
  const [error, setError] = useState(false)
  const seen = useRef<Map<string, string> | null>(null)

  const fetchFeed = useCallback(async () => {
    const { data, error } = await supabase.rpc('pool_results_feed', { p_code: code })
    if (error || !data) { setError(true); return }
    setError(false)
    const raw = data as { pool: FeedPool; results: Omit<FeedResult, 'players'>[] }
    const players = raw.pool.players ?? []
    const feed = { pool: raw.pool, results: raw.results.map((r) => ({ ...r, players })) }
    setPool(feed.pool)
    setResults(feed.results)
    const next = new Map(feed.results.map((r) => [r.category_id, keyOf(r)]))
    if (seen.current) {
      const fresh = feed.results.filter((r) => seen.current!.get(r.category_id) !== keyOf(r))
      if (fresh.length) setQueue((q) => [...q, ...fresh])
    }
    seen.current = next
  }, [code])

  useEffect(() => {
    fetchFeed()
    const t = setInterval(fetchFeed, intervalMs)
    return () => clearInterval(t)
  }, [fetchFeed, intervalMs])

  const poolId = pool?.id
  useEffect(() => {
    if (!realtime || !poolId) return
    const ch = supabase
      .channel(`feed-${poolId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pool_categories', filter: `pool_id=eq.${poolId}` }, () => fetchFeed())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [realtime, poolId, fetchFeed])

  // estáveis: a animação usa `next` como dependência do timer, e não pode reiniciar a cada render
  const next = useCallback(() => setQueue((q) => q.slice(1)), [])
  const replay = useCallback((r: FeedResult) => setQueue((q) => [...q, { ...r, set_at: `${r.set_at}-${Date.now()}` }]), [])

  return { pool, results, error, current: queue[0] ?? null, pending: Math.max(0, queue.length - 1), next, replay }
}

/** Resultado de mentira pra testar a animação (e posicionar o overlay no OBS). */
export function demoResult(hits: FeedHit[], scene?: string, players?: FeedHit[]): FeedResult {
  return {
    scene,
    // sem lista de participantes, o grupo é quem acertou (ou um trio genérico, pras cenas de "ninguém")
    players: players ?? hits,
    category_id: `demo-${Date.now()}`,
    category: 'Game of the Year',
    position: 0,
    value: 10,
    winner: 'Jogo de Teste',
    winner_sub: 'Estúdio Pixel',
    set_at: new Date().toISOString(),
    hits,
  }
}
