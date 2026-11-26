import { lazy, Suspense, type ReactNode } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router'
import { useAuth } from './lib/auth'
import { Layout, Sky } from './components/Layout'
import { Loading } from './components/ui'
import Title from './pages/Title'

const Login = lazy(() => import('./pages/Login'))
const CharacterCreator = lazy(() => import('./pages/CharacterCreator'))
const Hub = lazy(() => import('./pages/Hub'))
const NewPool = lazy(() => import('./pages/NewPool'))
const PoolPage = lazy(() => import('./pages/Pool'))
const Shop = lazy(() => import('./pages/Shop'))

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
    <Suspense fallback={<><Sky /><Loading /></>}>
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
    </Suspense>
  )
}
