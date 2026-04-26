import { useTranslation } from 'react-i18next'

export default function HealthScreen({ tab }) {
  const { t } = useTranslation()
  return (
    <div style={{ padding: '32px 24px', fontFamily: 'var(--font-body)', color: 'var(--ink-400)' }}>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-h2)', color: 'var(--ink-900)', marginBottom: 8, fontOpticalSizing: 'auto' }}>
        {t('health.page_title')}
      </p>
      <p style={{ marginBottom: 4 }}>{t(`health.tabs.${tab}`)}</p>
      <p>{t('common.coming_soon')}</p>
    </div>
  )
}
