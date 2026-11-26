import { useState, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { useAuth } from '../lib/auth'
import { supabase, errMsg, type Profile } from '../lib/supabase'
import { sfx } from '../lib/sfx'
import {
  DEFAULT_AVATAR, EYE_COUNT, EYE_NAMES, HAIR_COLORS, HAIR_COUNT, HAIR_NAMES, PANTS, SHIRT, SKIN,
  randomAvatar, type Avatar,
} from '../lib/sprites'
import { Layout } from '../components/Layout'
import { Sprite } from '../components/Sprite'
import { useToast } from '../components/ui'

function Swatches({ colors, value, onChange, label }: { colors: string[]; value: number; onChange: (i: number) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2.5">
      {colors.map((c, i) => (
        <button
          key={c}
          type="button"
          role="radio"
          aria-checked={value === i}
          aria-label={`${label} ${i + 1}`}
          onClick={() => { onChange(i); sfx.select() }}
          className="relative h-9 w-9 px-box-flat"
          style={{ background: c }}
        >
          {value === i && (
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 font-display text-xl leading-none text-ink">▼</span>
          )}
        </button>
      ))}
    </div>
  )
}

function Stepper({ value, count, names, onChange, label }: { value: number; count: number; names: string[]; onChange: (i: number) => void; label: string }) {
  const go = (d: number) => { onChange((value + d + count) % count); sfx.select() }
  return (
    <div className="flex items-center gap-3">
      <button type="button" className="btn btn-paper btn-sm" onClick={() => go(-1)} aria-label={`${label} anterior`}>◀</button>
      <span className="min-w-28 text-center font-display text-2xl leading-none" aria-live="polite">{names[value]}</span>
      <button type="button" className="btn btn-paper btn-sm" onClick={() => go(1)} aria-label={`Próximo ${label}`}>▶</button>
    </div>
  )
}

function Row({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="grid items-center gap-3 border-b-2 border-dashed border-paper-3 py-4 last:border-0 sm:grid-cols-[9rem_1fr]">
      <span className="font-body font-semibold">{title}</span>
      {children}
    </div>
  )
}

export default function CharacterCreator() {
  const { profile, setProfile } = useAuth()
  const [params] = useSearchParams()
  const next = params.get('next') || '/hub'
  const firstTime = !profile?.avatar
  const [a, setA] = useState<Avatar>(profile?.avatar ?? DEFAULT_AVATAR)
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()
  const toast = useToast()

  const set = <K extends keyof Avatar>(k: K) => (v: Avatar[K]) => setA((x) => ({ ...x, [k]: v }))

  async function save() {
    if (!profile) return
    setBusy(true)
    const { data, error } = await supabase.from('profiles').update({ avatar: a }).eq('id', profile.id).select('id, username, coins, avatar').single()
    setBusy(false)
    if (error) return toast(errMsg(error), 'err')
    setProfile(data as Profile)
    sfx.confirm()
    if (firstTime) {
      toast('Boneco criado! Você começa com 150 moedas.', 'coin')
      navigate(next)
    } else toast('Visual salvo.')
  }

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="font-display text-5xl leading-none text-paper drop-shadow-[3px_3px_0_#181020] sm:text-6xl">
          {firstTime ? 'Crie seu boneco' : 'Seu boneco'}
        </h1>
        <p className="mt-3 max-w-xl text-lg">
          {firstTime
            ? 'É ele que aparece no ranking de todos os seus bolões. Dá pra mudar depois, e as roupas da loja entram por cima.'
            : 'Base do personagem. Chapéu, roupa, pet e cenário você troca na loja.'}
        </p>
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,360px)_1fr]">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="px-box flex flex-col items-center bg-paper-2 p-6">
            <div className="px-box-flat">
              <Sprite avatar={a} size={260} bob title={`Boneco de ${profile?.username}`} />
            </div>
            <p className="mt-5 font-display text-3xl leading-none">{profile?.username}</p>
            <button
              type="button"
              className="btn btn-paper btn-sm mt-5"
              onClick={() => { setA(randomAvatar(a)); sfx.select() }}
            >
              Sortear visual
            </button>
          </div>
        </div>

        <div className="px-box p-5 sm:p-7">
          <Row title="Pele"><Swatches label="Tom de pele" colors={SKIN} value={a.skin} onChange={set('skin')} /></Row>
          <Row title="Cabelo"><Stepper label="cabelo" value={a.hairStyle} count={HAIR_COUNT} names={HAIR_NAMES} onChange={set('hairStyle')} /></Row>
          <Row title="Cor do cabelo"><Swatches label="Cor do cabelo" colors={HAIR_COLORS} value={a.hairColor} onChange={set('hairColor')} /></Row>
          <Row title="Olhos"><Stepper label="olhar" value={a.eyes} count={EYE_COUNT} names={EYE_NAMES} onChange={set('eyes')} /></Row>
          <Row title="Camisa"><Swatches label="Cor da camisa" colors={SHIRT} value={a.shirt} onChange={set('shirt')} /></Row>
          <Row title="Calça"><Swatches label="Cor da calça" colors={PANTS} value={a.pants} onChange={set('pants')} /></Row>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <button type="button" className="btn btn-green" onClick={save} disabled={busy}>
              {busy ? 'Salvando...' : firstTime ? 'Começar a jogar' : 'Salvar visual'}
            </button>
            {!firstTime && (
              <button type="button" className="btn btn-paper btn-sm" onClick={() => navigate('/loja')}>Ir pra loja</button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
