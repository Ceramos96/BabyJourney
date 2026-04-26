import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { ROUTES } from '../../config/navigation.js'
import appConfig from '../../config/app.config.js'

export default function AuthScreen({ isInvite = false }) {
  const { t } = useTranslation()
  const { session, supabase } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Redirect away if already signed in
  useEffect(() => {
    if (session) navigate(ROUTES.HOME, { replace: true })
  }, [session, navigate])

  const handleSignIn = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) setError(error.message)
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--app-bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>

        {/* Logo / hero */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ fontSize: '52px', marginBottom: '16px', lineHeight: 1 }}>🌱</div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-h1)',
            fontWeight: 600,
            color: 'var(--ink-900)',
            margin: '0 0 8px',
            fontOpticalSizing: 'auto',
          }}>
            {appConfig.app.name}
          </h1>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-base)',
            color: 'var(--ink-400)',
            margin: 0,
          }}>
            {isInvite ? t('auth.invite_accept_title') : t('auth.login_subtitle')}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label className="ls-label">{t('auth.email_label')}</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={t('auth.email_placeholder')}
              required
              autoComplete="email"
              className="ls-input"
            />
          </div>

          <div>
            <label className="ls-label">{t('auth.password_label')}</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={t('auth.password_placeholder')}
              required
              autoComplete="current-password"
              className="ls-input"
            />
          </div>

          {error && (
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-sm)',
              color: 'var(--danger)',
              margin: 0,
            }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="ls-btn-primary lg"
            style={{ width: '100%', marginTop: '8px' }}
          >
            {loading ? t('auth.signing_in') : t('auth.sign_in')}
          </button>
        </form>

        <p style={{
          textAlign: 'center',
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-sm)',
          color: 'var(--ink-400)',
          marginTop: '24px',
        }}>
          {t('auth.no_account')}
        </p>
      </div>
    </div>
  )
}
