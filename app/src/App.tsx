import type { ReactNode } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router'
import { useAuth } from './lib/auth'
import { Layout } from './components/Layout'
import { Loading } from './components/ui'
import Title from './pages/Title'
import Login from './pages/Login'
import CharacterCreator from './pages/CharacterCreator'
import Hub from './pages/Hub'
import NewPool from './pages/NewPool'
import PoolPage from './pages/Pool'
import Shop from './pages/Shop'

/** Exige login e personagem criado (AD-003). */
function Gate({ children, allowNoAvatar = false }: { children: ReactNode; allowNoAvatar?: boolean }) {
  const { session, profile, loading } = useAuth()
  const loc = useLocation()
  if (loading || (session && !profile)) return <Loading />
  if (!session) return <Navigate to={`/entrar?next=${encodeURIComponent(loc.pathname)}`} replace />
  if (!allowNoAvatar && profile && !profile.avatar)
    return <Navigate to={`/personagem?next=${encodeURIComponent(loc.pathname)}`} replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Title />} />
      <Route path="/entrar" element={<Login />} />
      <Route path="/b/:code" element={<Layout><PoolPage /></Layout>} />
      <Route path="/personagem" element={<Gate allowNoAvatar><CharacterCreator /></Gate>} />
      <Route path="/hub" element={<Gate><Layout><Hub /></Layout></Gate>} />
      <Route path="/bolao/novo" element={<Gate><Layout><NewPool /></Layout></Gate>} />
      <Route path="/loja" element={<Gate><Layout><Shop /></Layout></Gate>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
