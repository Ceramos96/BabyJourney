import { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { usePlatform } from '../../hooks/usePlatform.js'
import { ROUTES } from '../../config/navigation.js'
import BottomTabBar from './BottomTabBar.jsx'
import Sidebar from './Sidebar.jsx'
import TopBar from './TopBar.jsx'
import FAB from './FAB.jsx'
import QuickLog from '../../screens/QuickLog/index.jsx'
import InstallPrompt from '../ui/InstallPrompt.jsx'

export default function AppShell() {
  const { session, loading } = useAuth()
  const { isNative } = usePlatform()
  const navigate = useNavigate()
  const [quickLogOpen, setQuickLogOpen] = useState(false)

  useEffect(() => {
    if (!loading && !session) {
      navigate(ROUTES.AUTH, { replace: true })
    }
  }, [session, loading, navigate])

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--app-bg)',
        fontSize: '44px',
      }}>
        <span className="sprout-breathe" aria-hidden="true">🌱</span>
      </div>
    )
  }

  if (!session) return null

  // ── Native (Capacitor) layout ──────────────────────────────────
  if (isNative) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--app-bg)',
      }}>
        <div style={{
          flex: 1,
          overflow: 'auto',
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: '24px',
          overscrollBehavior: 'contain',
        }}>
          <Outlet context={{ quickLogOpen, setQuickLogOpen }} />
        </div>
        <BottomTabBar onFABPress={() => setQuickLogOpen(true)} />
        <QuickLog open={quickLogOpen} onClose={() => setQuickLogOpen(false)} />
      </div>
    )
  }

  // ── Web layout ─────────────────────────────────────────────────
  return (
    <div style={{
      display: 'flex',
      height: '100%',
      background: 'var(--canvas)',
    }}>
      <Sidebar />
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        minWidth: 0,
      }}>
        <TopBar />
        <main style={{
          flex: 1,
          overflow: 'auto',
          background: 'var(--app-bg)',
          overscrollBehavior: 'contain',
        }}>
          <Outlet context={{ quickLogOpen, setQuickLogOpen }} />
        </main>
      </div>
      <FAB onPress={() => setQuickLogOpen(true)} />
      <QuickLog open={quickLogOpen} onClose={() => setQuickLogOpen(false)} />
      <InstallPrompt />
    </div>
  )
}
