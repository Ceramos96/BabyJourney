import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Home, TrendingUp, BookOpen, Heart, Plus } from 'lucide-react'
import { MOBILE_TABS } from '../../config/navigation.js'

const ICON_MAP = { Home, TrendingUp, BookOpen, Heart, Plus }

export default function BottomTabBar({ onFABPress }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()

  const isActive = (route) => {
    if (!route) return false
    if (route === '/') return location.pathname === '/' || location.pathname === '/home'
    return location.pathname.startsWith(route)
  }

  const regularTabs = MOBILE_TABS.filter(tab => !tab.isFAB)
  const fabTab = MOBILE_TABS.find(tab => tab.isFAB)
  const leftTabs = regularTabs.slice(0, 2)
  const rightTabs = regularTabs.slice(2)

  const renderTab = (tab) => {
    const active = isActive(tab.route)
    const Icon = ICON_MAP[tab.icon]
    return (
      <button
        key={tab.id}
        onClick={() => navigate(tab.route)}
        aria-label={t(tab.labelKey)}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '3px',
          padding: '8px 6px',
          borderRadius: '12px',
          background: active ? 'var(--sage-100)' : 'transparent',
          border: 'none',
          cursor: 'pointer',
          transition: 'background var(--duration-fast) var(--ease-default)',
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
  }

  return (
    <nav
      style={{
        position: 'relative',
        // 83px content area + safe area below for home indicator
        height: 'calc(var(--tab-bar-height) + env(safe-area-inset-bottom))',
        paddingBottom: 'env(safe-area-inset-bottom)',
        background: 'var(--linen-50)',
        borderTop: '1px solid var(--linen-200)',
        display: 'flex',
        alignItems: 'center',
        paddingLeft: '8px',
        paddingRight: '8px',
        flexShrink: 0,
        zIndex: 100,
        overflow: 'visible', // allow FAB to protrude above
      }}
    >
      {leftTabs.map(renderTab)}

      {/* Spacer holds the FAB's layout slot */}
      <div style={{ flex: 1 }} />

      {rightTabs.map(renderTab)}

      {/* FAB — absolutely centered, protrudes 16px above tab bar */}
      {fabTab && (
        <button
          onClick={onFABPress}
          aria-label={t(fabTab.labelKey)}
          style={{
            position: 'absolute',
            top: '-16px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'var(--fab-size)',
            height: 'var(--fab-size)',
            borderRadius: 'var(--r-pill)',
            background: 'var(--sage-700)',
            // white ring visually lifts FAB off the tab bar surface
            border: '4px solid var(--linen-50)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-md)',
            color: 'white',
            flexShrink: 0,
            zIndex: 10,
          }}
        >
          <Plus size={22} strokeWidth={2.5} />
        </button>
      )}
    </nav>
  )
}
