import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Home, TrendingUp, BookOpen, Heart, Plus } from 'lucide-react'
import { MOBILE_TABS } from '../../config/navigation.js'

const ICON_MAP = {
  Home, TrendingUp, BookOpen, Heart, Plus,
}

export default function BottomTabBar({ onFABPress }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()

  const isActive = (route) => {
    if (!route) return false
    if (route === '/') return location.pathname === '/' || location.pathname === '/home'
    return location.pathname.startsWith(route)
  }

  return (
    <nav
      className="safe-bottom"
      style={{
        height: 'var(--tab-bar-height)',
        background: 'var(--linen-50)',
        borderTop: '1px solid var(--linen-200)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        flexShrink: 0,
        zIndex: 100,
      }}
    >
      {MOBILE_TABS.map((tab) => {
        if (tab.isFAB) {
          return (
            <button
              key={tab.id}
              onClick={onFABPress}
              aria-label={t(tab.labelKey)}
              style={{
                width: 'var(--fab-size)',
                height: 'var(--fab-size)',
                borderRadius: 'var(--r-pill)',
                background: 'var(--sage-700)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-md)',
                color: 'white',
                flexShrink: 0,
                marginBottom: '8px',
              }}
            >
              <Plus size={24} strokeWidth={2.5} />
            </button>
          )
        }

        const active = isActive(tab.route)
        const Icon = ICON_MAP[tab.icon]

        return (
          <button
            key={tab.id}
            onClick={() => navigate(tab.route)}
            aria-label={t(tab.labelKey)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
              background: active ? 'var(--sage-100)' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '6px 14px',
              borderRadius: '12px',
              transition: 'background var(--duration-fast) var(--ease-default)',
              minWidth: 0,
            }}
          >
            {Icon && (
              <Icon
                size={22}
                strokeWidth={active ? 2.5 : 1.5}
                color={active ? 'var(--sage-700)' : 'var(--ink-400)'}
              />
            )}
            <span style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-micro)',
              fontWeight: 700,
              color: active ? 'var(--sage-700)' : 'var(--ink-400)',
              lineHeight: 1,
            }}>
              {t(tab.labelKey)}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
