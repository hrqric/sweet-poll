import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../lib/auth'
import { supabase, errMsg, type Profile, type ShopItem } from '../lib/supabase'
import { sfx } from '../lib/sfx'
import { DEFAULT_AVATAR, RARITY, SLOT_LABEL, SLOTS, type Avatar, type Slot } from '../lib/sprites'
import { Sprite } from '../components/Sprite'
import { CoinIcon, Coins, Loading, Tag, useToast } from '../components/ui'

type Filter = Slot | 'mine'

export default function Shop() {
  const { profile, setProfile } = useAuth()
  const [items, setItems] = useState<ShopItem[] | null>(null)
  const [owned, setOwned] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState<Filter>('hat')
  const [selected, setSelected] = useState<ShopItem | null>(null)
  const [busy, setBusy] = useState(false)
  const toast = useToast()

  useEffect(() => {
    if (!profile) return
    Promise.all([
      supabase.from('shop_items').select('*').order('sort'),
      supabase.from('inventory').select('item_id').eq('user_id', profile.id),
    ]).then(([s, inv]) => {
      if (s.error) return toast(errMsg(s.error), 'err')
      setItems(s.data as ShopItem[])
      setOwned(new Set((inv.data ?? []).map((r) => r.item_id as string)))
    })
    // depende só do id: o profile muda a cada compra e não precisa recarregar a loja
  }, [profile?.id, toast])

  const base: Avatar = profile?.avatar ?? DEFAULT_AVATAR
  const preview: Avatar = selected ? { ...base, [selected.slot]: selected.id } : base
  const visible = useMemo(
    () => items?.filter((i) => (filter === 'mine' ? owned.has(i.id) : i.slot === filter)) ?? [],
    [items, filter, owned],
  )

  const fitting = useRef<HTMLElement>(null)

  if (!profile || !items) return <Loading />

  function pick(item: ShopItem | null) {
    setSelected(item)
    sfx.select()
    // no celular o provador fica lá em cima: sobe até ele pra ver o item no boneco
    if (item && !window.matchMedia('(min-width: 1024px)').matches) {
      fitting.current?.scrollIntoView({ block: 'start' })
    }
  }

  async function saveAvatar(next: Avatar) {
    const { data, error } = await supabase.from('profiles').update({ avatar: next }).eq('id', profile!.id).select('id, username, coins, avatar').single()
    if (error) { toast(errMsg(error), 'err'); return false }
    setProfile(data as Profile)
    return true
  }

  async function buy(item: ShopItem) {
    setBusy(true)
    const { data, error } = await supabase.rpc('buy_item', { p_item: item.id })
    if (error) { setBusy(false); return toast(errMsg(error), 'err') }
    sfx.buy()
    setOwned((s) => new Set(s).add(item.id))
    setProfile({ ...profile!, coins: data as number })
    await saveAvatar({ ...base, [item.slot]: item.id })
    setBusy(false)
    toast(`${item.name} é seu! Já tá equipado.`, 'coin')
  }

  async function toggleEquip(item: ShopItem) {
    setBusy(true)
    const equipped = base[item.slot] === item.id
    if (await saveAvatar({ ...base, [item.slot]: equipped ? null : item.id })) sfx.select()
    setBusy(false)
  }

  const sel = selected
  const selOwned = sel ? owned.has(sel.id) : false
  const selEquipped = sel ? base[sel.slot] === sel.id : false

  return (
    <div className="grid gap-10 lg:grid-cols-[340px_1fr]">
      <aside ref={fitting} className="scroll-mt-20 lg:sticky lg:top-24 lg:self-start">
        <div className="px-dialog p-6">
          <div className="flex items-center justify-between">
            <p className="font-display text-3xl leading-none text-coin">Provador</p>
            <Coins value={profile.coins} size={22} className="text-paper" />
          </div>
          <div className="mt-5 flex justify-center">
            <div className="shadow-[0_0_0_4px_#fcf4dc]">
              <Sprite avatar={preview} size={230} bob title="Prévia do seu boneco" />
            </div>
          </div>
          {sel ? (
            <div className="mt-6">
              <p className="font-display text-3xl leading-none">{sel.name}</p>
              <p className="mt-2 flex items-center gap-2 text-sm text-paper-3">
                <Tag color={RARITY[sel.rarity].color}>{RARITY[sel.rarity].label}</Tag>
                {SLOT_LABEL[sel.slot]}
              </p>
              <p className="mt-3 text-paper-3">{sel.description}</p>
              <div className="mt-5">
                {selOwned ? (
                  <button type="button" className={`btn w-full ${selEquipped ? 'btn-paper' : 'btn-green'}`} onClick={() => toggleEquip(sel)} disabled={busy}>
                    {selEquipped ? 'Tirar' : 'Equipar'}
                  </button>
                ) : (
                  <button type="button" className="btn w-full" onClick={() => buy(sel)} disabled={busy || profile.coins < sel.price}>
                    <CoinIcon size={22} /> {profile.coins < sel.price ? `Faltam ${sel.price - profile.coins} moedas` : `Comprar por ${sel.price}`}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <p className="mt-6 text-paper-3">Toca num item pra provar antes de comprar. Moeda vem de palpite certo.</p>
          )}
        </div>
      </aside>

      <div>
        <h1 className="font-display text-5xl leading-none text-paper drop-shadow-[3px_3px_0_#181020] sm:text-6xl">Loja</h1>
        <nav className="mt-6 mb-6 flex flex-wrap gap-2" role="tablist" aria-label="Categorias da loja">
          {[...SLOTS, 'mine' as const].map((s) => (
            <button
              key={s}
              type="button"
              role="tab"
              aria-selected={filter === s}
              onClick={() => { setFilter(s); sfx.select() }}
              className={`px-3 pt-1 pb-1.5 font-display text-xl leading-none px-box-flat ${filter === s ? 'bg-ink text-coin' : 'bg-paper hover:bg-paper-2'}`}
            >
              {s === 'mine' ? `Meus itens (${owned.size})` : SLOT_LABEL[s]}
            </button>
          ))}
        </nav>

        {visible.length === 0 ? (
          <p className="px-dialog p-5 text-lg">Nada aqui ainda. Ganhe um bolão e volte com o bolso cheio.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-6 sm:grid-cols-3 xl:grid-cols-4">
            {visible.map((item) => {
              const has = owned.has(item.id)
              const on = base[item.slot] === item.id
              const active = sel?.id === item.id
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => pick(active ? null : item)}
                    aria-pressed={active}
                    className={`px-box relative flex w-full flex-col text-left hover:-translate-y-1 ${
                      active ? '-translate-y-1 !bg-paper-2 outline-4 outline-offset-4 outline-coin' : ''
                    }`}
                  >
                    <Tag color={RARITY[item.rarity].color} className="absolute top-2 left-2">{RARITY[item.rarity].label}</Tag>
                    <div className="flex justify-center pt-7">
                      <Sprite avatar={{ ...base, [item.slot]: item.id }} size={96} />
                    </div>
                    <div className="p-3 pt-2">
                      <p className="truncate font-semibold leading-tight">{item.name}</p>
                      <div className="mt-1.5 flex items-center">
                        {has ? (
                          <span className={`font-display text-lg leading-none ${on ? 'text-grass-dark' : 'text-muted'}`}>{on ? 'Equipado' : 'No baú'}</span>
                        ) : (
                          <Coins value={item.price} size={16} className={profile.coins < item.price ? 'opacity-50' : ''} />
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
