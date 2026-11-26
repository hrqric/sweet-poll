import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { supabase, errMsg } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { sfx } from '../lib/sfx'
import { Ground, Sky } from '../components/Layout'
import { TrophyIcon, useToast } from '../components/ui'

type Mode = 'login' | 'signup'

function translate(msg: string) {
  if (/Invalid login credentials/i.test(msg)) return 'E-mail ou senha não batem.'
  if (/Email not confirmed/i.test(msg)) return 'Confirme seu e-mail antes de entrar (veja a caixa de entrada).'
  if (/already registered/i.test(msg)) return 'Esse e-mail já tem conta. Tenta entrar.'
  if (/Password should be/i.test(msg)) return 'A senha precisa ter pelo menos 6 caracteres.'
  if (/rate limit/i.test(msg)) return 'Muitas tentativas. Espera um pouco e tenta de novo.'
  return msg
}

export default function Login() {
  const [params] = useSearchParams()
  const next = params.get('next') || '/hub'
  const [mode, setMode] = useState<Mode>(params.get('modo') === 'novo' ? 'signup' : 'login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [nameOk, setNameOk] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const { session, profile } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  useEffect(() => {
    if (session && profile) navigate(profile.avatar ? next : `/personagem?next=${encodeURIComponent(next)}`, { replace: true })
  }, [session, profile, next, navigate])

  useEffect(() => {
    if (mode !== 'signup' || username.length < 3) return setNameOk(null)
    const t = setTimeout(async () => {
      const { data } = await supabase.rpc('username_available', { p_username: username })
      setNameOk(Boolean(data))
    }, 350)
    return () => clearTimeout(t)
  }, [username, mode])

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        sfx.confirm()
      } else {
        if (!/^[A-Za-z0-9_.]{3,20}$/.test(username)) throw new Error('Nome de jogador: 3 a 20 letras, números, _ ou .')
        if (nameOk === false) throw new Error('Esse nome já tem dono.')
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username },
            emailRedirectTo: `${window.location.origin}/personagem?next=${encodeURIComponent(next)}`,
          },
        })
        if (error) throw error
        sfx.confirm()
        if (!data.session) setSent(true)
      }
    } catch (err) {
      toast(translate(errMsg(err)), 'err')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <Sky />
      <div className="mx-auto w-full max-w-md flex-1 px-4 pt-12">
        <Link to="/" className="mb-8 flex items-center justify-center gap-3">
          <TrophyIcon size={36} />
          <span className="font-display text-5xl leading-none text-paper drop-shadow-[3px_3px_0_#181020]">Bolão GOTY</span>
        </Link>

        {sent ? (
          <div className="px-dialog p-7">
            <p className="font-display text-3xl text-coin">Quase lá!</p>
            <p className="mt-3 font-body text-lg leading-snug">
              Mandamos um link pra <strong className="text-coin">{email}</strong>. Abre ele e você cai direto na criação do seu boneco.
            </p>
            <button type="button" className="btn btn-paper btn-sm mt-6" onClick={() => { setSent(false); setMode('login') }}>
              Já confirmei
            </button>
          </div>
        ) : (
          <div className="px-box">
            <div className="grid grid-cols-2 border-b-4 border-ink" role="tablist">
              {(['login', 'signup'] as Mode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  role="tab"
                  aria-selected={mode === m}
                  onClick={() => { setMode(m); sfx.select() }}
                  className={`py-3 font-display text-2xl leading-none ${mode === m ? 'bg-paper text-ink' : 'bg-paper-2 text-muted hover:text-ink'} ${m === 'login' ? 'border-r-4 border-ink' : ''}`}
                >
                  {m === 'login' ? 'Continuar' : 'Novo jogo'}
                </button>
              ))}
            </div>

            <form onSubmit={submit} className="space-y-5 p-6">
              {mode === 'signup' && (
                <label className="block">
                  <span className="mb-2 block font-body font-semibold">Nome de jogador</span>
                  <input
                    className="field"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
                    placeholder="ex: zelda_main"
                    maxLength={20}
                    autoComplete="nickname"
                    required
                  />
                  <span className={`mt-2 block text-sm ${nameOk === false ? 'text-red' : 'text-muted'}`}>
                    {nameOk === false ? 'Já tem alguém com esse nome.' : nameOk ? 'Livre!' : 'Aparece no ranking dos bolões.'}
                  </span>
                </label>
              )}
              <label className="block">
                <span className="mb-2 block font-body font-semibold">E-mail</span>
                <input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
              </label>
              <label className="block">
                <span className="mb-2 block font-body font-semibold">Senha</span>
                <input
                  className="field"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  minLength={6}
                  required
                />
              </label>
              <button type="submit" className={`btn w-full ${mode === 'signup' ? 'btn-green' : ''}`} disabled={busy}>
                {busy ? 'Carregando...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
              </button>
              {mode === 'signup' && (
                <p className="text-center text-sm text-muted">Depois disso você monta o seu boneco 8-bit.</p>
              )}
            </form>
          </div>
        )}
      </div>
      <Ground />
    </div>
  )
}
