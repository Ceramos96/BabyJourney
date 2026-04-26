import { useState, useEffect } from 'react'
import { X, Download } from 'lucide-react'

const DISMISSED_KEY = 'ls-pwa-install-dismissed'

export default function InstallPrompt() {
  const [prompt, setPrompt] = useState(null)  // the deferred beforeinstallprompt event
  const [visible, setVisible] = useState(false)
  const [rendered, setRendered] = useState(false)

  useEffect(() => {
    // Don't show if already dismissed this session or permanently
    if (sessionStorage.getItem(DISMISSED_KEY)) return
    if (localStorage.getItem(DISMISSED_KEY)) return

    // Don't show if already running as installed PWA
    if (window.matchMedia('(display-mode: standalone)').matches) return

    const handler = (e) => {
      e.preventDefault()
      setPrompt(e)
      setRendered(true)
      requestAnimationFrame(() => setVisible(true))
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!prompt) return
    prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') {
      dismiss(true)
    }
    setPrompt(null)
  }

  const dismiss = (permanent = false) => {
    setVisible(false)
    setTimeout(() => setRendered(false), 350)
    sessionStorage.setItem(DISMISSED_KEY, '1')
    if (permanent) localStorage.setItem(DISMISSED_KEY, '1')
  }

  if (!rendered) return null

  return (
    <div
      role="banner"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 400,
        // Slide up from below
        transform: visible ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 350ms cubic-bezier(0.32, 0.72, 0, 1)',
      }}
    >
      <div style={{
        maxWidth: 520,
        margin: '8px 12px',
        padding: '14px 16px',
        background: 'var(--linen-50)',
        border: '1px solid var(--linen-200)',
        borderRadius: 20,
        boxShadow: 'var(--shadow-lg)',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
      }}>
        {/* Icon */}
        <img
          src="/pwa-64x64.png"
          alt=""
          aria-hidden="true"
          width={40}
          height={40}
          style={{ borderRadius: 10, flexShrink: 0 }}
        />

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 700,
            color: 'var(--ink-900)', margin: '0 0 2px',
          }}>
            Little Sprout
          </p>
          <p style={{
            fontFamily: 'var(--font-body)', fontSize: 12,
            color: 'var(--ink-400)', margin: 0, lineHeight: 1.4,
          }}>
            Add to your home screen for the best experience.
          </p>
        </div>

        {/* Install button */}
        <button
          onClick={handleInstall}
          style={{
            flexShrink: 0,
            display: 'flex', alignItems: 'center', gap: 6,
            height: 36, padding: '0 14px', borderRadius: 999,
            background: 'var(--sage-700)', color: 'white', border: 'none',
            fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <Download size={14} />
          Install
        </button>

        {/* Dismiss */}
        <button
          onClick={() => dismiss(false)}
          aria-label="Dismiss"
          style={{
            flexShrink: 0,
            width: 28, height: 28, borderRadius: '50%',
            background: 'var(--linen-200)', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <X size={13} color="var(--ink-400)" />
        </button>
      </div>
    </div>
  )
}
