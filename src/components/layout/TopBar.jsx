import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ROUTES } from '../../config/navigation.js'

const PAGE_TITLE_KEYS = {
  [ROUTES.HOME]:                'home.page_title',
  [ROUTES.GROWTH]:              'growth.page_title',
  [ROUTES.JOURNAL]:             'journal.page_title',
  [ROUTES.JOURNAL_PHOTOS]:      'journal.page_title',
  [ROUTES.JOURNAL_MILESTONES]:  'journal.page_title',
  [ROUTES.HEALTH]:              'health.page_title',
  [ROUTES.HEALTH_NOTES]:        'health.page_title',
  [ROUTES.HEALTH_ALLERGIES]:    'health.page_title',
  [ROUTES.HEALTH_VACCINATIONS]: 'health.page_title',
  [ROUTES.FAMILY]:              'family.page_title',
}

export default function TopBar() {
  const { t, i18n } = useTranslation()
  const location = useLocation()

  const titleKey = PAGE_TITLE_KEYS[location.pathname] ?? 'app.name'

  const today = new Date().toLocaleDateString(
    i18n.language === 'vi' ? 'vi-VN' : 'en-GB',
    { weekday: 'long', day: 'numeric', month: 'long' },
  )

  return (
    <header style={{
      height: 'var(--topbar-height)',
      background: 'var(--app-bg)',
      borderBottom: '1px solid var(--linen-200)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      flexShrink: 0,
    }}>
      <h1 style={{
        fontFamily: 'var(--font-display)',
        fontSize: '24px',
        fontWeight: 600,
        color: 'var(--ink-900)',
        fontOpticalSizing: 'auto',
        margin: 0,
      }}>
        {t(titleKey)}
      </h1>
      <span style={{
        fontFamily: 'var(--font-body)',
        fontSize: 'var(--text-caption)',
        color: 'var(--ink-400)',
      }}>
        {today}
      </span>
    </header>
  )
}
