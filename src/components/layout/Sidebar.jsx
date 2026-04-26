import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Home, TrendingUp, BookOpen, Heart, Users } from 'lucide-react'
import { SIDEBAR_NAV, SIDEBAR_BOTTOM_NAV } from '../../config/navigation.js'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { getBabyAge } from '../../lib/dates.js'
import appConfig from '../../config/app.config.js'

const ICON_MAP = { Home, TrendingUp, BookOpen, Heart, Users }

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { t, i18n } = useTranslation()
  const { session, supabase } = useAuth()
  const { months, days } = getBabyAge()
  const [hoveredId, setHoveredId] = useState(null)

  const isActive = (route) => {
    if (route === '/') return location.pathname === '/' || location.pathname === '/home'
    return location.pathname.startsWith(route)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const renderNavItem = (item) => {
    const Icon = ICON_MAP[item.icon]
    const active = isActive(item.route)
    const hovered = hoveredId === item.id

    return (
      <button
        key={item.id}
        onClick={() => navigate(item.route)}
        onMouseEnter={() => setHoveredId(item.id)}
        onMouseLeave={() => setHoveredId(null)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 12px',
          borderRadius: '10px',
          background: active
            ? 'var(--sage-100)'
            : hovered
              ? 'var(--linen-100)'
              : 'transparent',
          border: 'none',
          cursor: 'pointer',
          width: '100%',
          textAlign: 'left',
          transition: 'background var(--duration-fast) var(--ease-default)',
        }}
      >
        {Icon && (
          <Icon
            size={18}
            strokeWidth={active ? 2.5 : 1.5}
            color={active ? 'var(--sage-700)' : 'var(--ink-600)'}
          />
        )}
        <span style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-sm)',
          fontWeight: active ? 700 : 500,
          color: active ? 'var(--sage-700)' : 'var(--ink-600)',
        }}>
          {t(item.labelKey)}
        </span>
      </button>
    )
  }

  return (
    <nav style={{
      width: 'var(--sidebar-width)',
      minWidth: 'var(--sidebar-width)',
      height: '100%',
      background: 'var(--linen-50)',
      borderRight: '1px solid var(--linen-200)',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 12px 16px',
      gap: '2px',
      overflowY: 'auto',
    }}>

      {/* Baby header */}
      <div style={{ padding: '0 8px 20px', flexShrink: 0 }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: 'var(--r-pill)',
          background: 'var(--sage-100)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '22px',
          marginBottom: '10px',
        }}>
          {appConfig.baby.avatarPlaceholder}
        </div>
        <p style={{
          fontFamily: 'var(--font-display)',
          fontSize: '16px',
          fontWeight: 600,
          color: 'var(--ink-900)',
          margin: '0 0 2px',
          fontOpticalSizing: 'auto',
        }}>
          {appConfig.baby.nickname}
        </p>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-caption)',
          color: 'var(--ink-400)',
          margin: 0,
        }}>
          {t('common.months_old', { months, days })}
        </p>
      </div>

      {/* Main nav */}
      {SIDEBAR_NAV.map(renderNavItem)}

      <hr className="ls-divider" style={{ margin: '8px 0' }} />

      {/* Family nav */}
      {SIDEBAR_BOTTOM_NAV.map(renderNavItem)}

      <div style={{ flex: 1 }} />

      {/* Bottom strip: language toggle + user avatar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        paddingTop: '12px',
        borderTop: '1px solid var(--linen-200)',
        flexShrink: 0,
      }}>

        {/* EN / VI segmented toggle */}
        <div style={{
          display: 'flex',
          background: 'var(--linen-100)',
          border: '1px solid var(--linen-200)',
          borderRadius: 'var(--r-xs)',
          padding: 2,
          gap: 2,
        }}>
          {['en', 'vi'].map((lang) => {
            const active = i18n.language === lang
            return (
              <button
                key={lang}
                onClick={() => i18n.changeLanguage(lang)}
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: active ? 'var(--sage-700)' : 'var(--ink-400)',
                  background: active ? 'white' : 'transparent',
                  border: 'none',
                  cursor: active ? 'default' : 'pointer',
                  padding: '3px 8px',
                  borderRadius: 6,
                  boxShadow: active ? 'var(--shadow-sm)' : 'none',
                  transition: 'all var(--duration-fast) var(--ease-default)',
                  letterSpacing: '0.04em',
                }}
              >
                {lang.toUpperCase()}
              </button>
            )
          })}
        </div>

        <div style={{ flex: 1 }} />

        {/* User avatar — tap to sign out */}
        <button
          onClick={handleSignOut}
          title={t('settings.sign_out')}
          style={{
            width: 32,
            height: 32,
            borderRadius: 'var(--r-pill)',
            background: 'var(--linen-200)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-body)',
            fontSize: '13px',
            fontWeight: 700,
            color: 'var(--ink-600)',
            transition: 'background var(--duration-fast) var(--ease-default)',
            flexShrink: 0,
          }}
        >
          {session?.user?.email?.[0]?.toUpperCase() ?? '👤'}
        </button>
      </div>
    </nav>
  )
}
