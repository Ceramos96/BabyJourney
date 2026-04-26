import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'

export default function FAB({ onPress }) {
  const { t } = useTranslation()
  const [hovered, setHovered] = useState(false)

  return (
    <button
      onClick={onPress}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label={t('quicklog.title')}
      style={{
        position: 'fixed',
        bottom: '32px',
        right: '32px',
        width: 'var(--fab-size)',
        height: 'var(--fab-size)',
        borderRadius: 'var(--r-pill)',
        background: hovered ? '#5d6b44' : 'var(--sage-700)',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: 'var(--shadow-lg)',
        color: 'white',
        zIndex: 200,
        transition: 'background var(--duration-fast) var(--ease-default), transform var(--duration-fast) var(--ease-default)',
        transform: hovered ? 'scale(1.05)' : 'scale(1)',
      }}
    >
      <Plus size={24} strokeWidth={2.5} />
    </button>
  )
}
