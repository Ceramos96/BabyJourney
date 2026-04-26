import { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { usePlatform } from '../../hooks/usePlatform.js'
import { ROUTES } from '../../config/navigation.js'
import BottomTabBar from './BottomTabBar.jsx'
import Sidebar from './Sidebar.jsx'
import TopBar from './TopBar.jsx'
import FAB from './FAB.jsx'

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
        fontFamily: 'var(--font-display)',
        fontSize: '40px',
      }}>
        🌱
      </div>
    )
  }

  if (!session) return null

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
          overscrollBehavior: 'contain',
        }}>
          <Outlet context={{ quickLogOpen, setQuickLogOpen }} />
        </div>
        <BottomTabBar onFABPress={() => setQuickLogOpen(true)} />
      </div>
    )
  }

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

      {/* Quick Log modal placeholder — will be built in QuickLog screen pass */}
      {quickLogOpen && (
        <div
          onClick={() => setQuickLogOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(42, 40, 35, 0.4)',
            zIndex: 300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="ls-card"
            style={{ padding: '32px', maxWidth: 480, width: '90%' }}
          >
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--ink-900)', marginBottom: '8px' }}>
              Quick Log
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--ink-400)' }}>
              Coming soon — QuickLog screen will open here.
            </p>
            <button
              onClick={() => setQuickLogOpen(false)}
              className="ls-btn-ghost"
              style={{ marginTop: '24px' }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
