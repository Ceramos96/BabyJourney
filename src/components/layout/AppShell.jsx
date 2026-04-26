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

function MisconfiguredScreen() {
  return (
    <div style={{
      display: 'flex', height: '100%',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--app-bg)', padding: 32,
    }}>
      <div style={{
        maxWidth: 420, width: '100%',
        background: 'var(--linen-50)',
        border: '1px solid var(--linen-200)',
        borderRadius: 20, padding: '32px 28px',
        fontFamily: 'var(--font-body)',
      }}>
        <p style={{ fontSize: 32, margin: '0 0 16px' }}>🌱</p>
        <p style={{
          fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700,
          color: 'var(--ink-900)', margin: '0 0 10px', fontOpticalSizing: 'auto',
        }}>
          Supabase not configured
        </p>
        <p style={{ fontSize: 14, color: 'var(--ink-600)', margin: '0 0 20px', lineHeight: 1.6 }}>
          Add these two environment variables to your Vercel project, then redeploy:
        </p>
        <div style={{
          background: 'var(--linen-100)', border: '1px solid var(--linen-200)',
          borderRadius: 12, padding: '14px 16px',
          fontFamily: 'monospace', fontSize: 13, color: 'var(--ink-900)',
          lineHeight: 2,
        }}>
          <div>VITE_SUPABASE_URL</div>
          <div style={{ color: 'var(--ink-400)', fontSize: 11 }}>
            → must start with https://
          </div>
          <div style={{ marginTop: 8 }}>VITE_SUPABASE_ANON_KEY</div>
        </div>
        <p style={{ fontSize: 12, color: 'var(--ink-400)', margin: '16px 0 0', lineHeight: 1.6 }}>
          Vercel → Project → Settings → Environment Variables
        </p>
      </div>
    </div>
  )
}

export default function AppShell() {
  const { session, loading, supabaseConfigured } = useAuth()
  const { isNative } = usePlatform()
  const navigate = useNavigate()
  const [quickLogOpen, setQuickLogOpen] = useState(false)

  useEffect(() => {
    if (!loading && !session) {
      navigate(ROUTES.AUTH, { replace: true })
    }
  }, [session, loading, navigate])

  if (!supabaseConfigured) return <MisconfiguredScreen />

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
