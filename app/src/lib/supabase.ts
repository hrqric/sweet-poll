import { createClient } from '@supabase/supabase-js'
import type { Avatar, Slot } from './sprites'

const url = import.meta.env.VITE_SUPABASE_URL as string
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string

if (!url || !key) {
  throw new Error('Defina VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY em app/.env.local')
}

export const supabase = createClient(url, key)

export type Profile = {
  id: string
  username: string
  coins: number
  avatar: Avatar | null
}

export type PoolStatus = 'open' | 'locked' | 'finished'

export type Pool = {
  id: string
  owner_id: string
  name: string
  description: string
  invite_code: string
  mode: 'server' | 'user'
  year: number
  status: PoolStatus
  lock_at: string | null
  created_at: string
  finished_at: string | null
}

export type Nominee = { id: string; category_id: string; title: string; subtitle: string; position: number }
export type Category = {
  id: string
  pool_id: string
  name: string
  position: number
  points: number
  winner_nominee_id: string | null
  pool_nominees: Nominee[]
}
export type Member = {
  pool_id: string
  user_id: string
  score: number
  hits: number
  coins_earned: number
  rank: number | null
  profiles: { username: string; avatar: Avatar | null }
}
export type Pick = { pool_id: string; user_id: string; category_id: string; nominee_id: string }

export type ShopItem = {
  id: string
  slot: Slot
  name: string
  description: string
  price: number
  rarity: 'comum' | 'raro' | 'epico' | 'lendario'
  sort: number
}

export type CatalogCategory = {
  id: number
  year: number
  position: number
  category: string
  nominees: { title: string; subtitle: string }[]
}

export type PoolPreview = {
  id: string
  name: string
  description: string
  owner_username: string
  owner_avatar: Avatar | null
  status: PoolStatus
  mode: 'server' | 'user'
  member_count: number
  category_count: number
  is_member: boolean
}

/** Pega a mensagem legível de um erro do PostgREST/RPC. */
export function errMsg(e: unknown): string {
  if (e && typeof e === 'object' && 'message' in e) return String((e as { message: string }).message)
  return 'Algo deu errado. Tenta de novo?'
}

export function picksOpen(pool: Pool): boolean {
  return pool.status === 'open' && (!pool.lock_at || new Date(pool.lock_at) > new Date())
}
