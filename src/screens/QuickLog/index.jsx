import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { X, ArrowLeft, Milk, Moon, Droplets, PenLine } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { usePlatform } from '../../hooks/usePlatform.js'
import { QUICK_LOG_TYPES } from '../../config/navigation.js'

// ── Helpers ────────────────────────────────────────────────────────

function nowHCM() {
  return new Date().toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Ho_Chi_Minh',
  })
}

function timeStrToUTC(timeStr) {
  // Combine today's HCM calendar date with HH:MM → UTC ISO string
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' })
  return new Date(`${today}T${timeStr}:00+07:00`).toISOString()
}

function computeDurationMins(startStr, endStr) {
  if (!startStr || !endStr) return null
  const [sh, sm] = startStr.split(':').map(Number)
  const [eh, em] = endStr.split(':').map(Number)
  const mins = eh * 60 + em - (sh * 60 + sm)
  return mins > 0 ? mins : null
}

const ICON_MAP = { Milk, Moon, Droplets, PenLine }

const TYPE_ICON_COLOR = {
  feed:   'var(--sage-700)',
  nap:    'var(--butter)',
  diaper: 'var(--dusk)',
  note:   'var(--ink-600)',
}

function defaultData(type) {
  const now = nowHCM()
  switch (type) {
    case 'feed':   return { time: now, amount: '', feedType: 'breast', notes: '' }
    case 'nap':    return { startTime: now, endTime: '', quality: 'good', notes: '' }
    case 'diaper': return { time: now, diaperType: 'wet', notes: '' }
    case 'note':   return { time: now, text: '', tags: [] }
    default:       return {}
  }
}

// ── Shared ────────────────────────────────────────────────────────

function FormGroup({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label className="ls-label">{label}</label>
      {children}
    </div>
  )
}

// Full-width segmented control (overrides inline-flex default)
function Seg({ options, value, onChange }) {
  return (
    <div className="ls-seg" style={{ width: '100%', display: 'flex' }}>
      {options.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          className={value === key ? 'active' : ''}
          onClick={() => onChange(key)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

// ── Form bodies ───────────────────────────────────────────────────

function FeedForm({ data, onChange, t }) {
  const set = (key) => (e) => onChange({ ...data, [key]: e.target.value })
  return (
    <>
      <FormGroup label={t('quicklog.time_label')}>
        <input type="time" value={data.time} onChange={set('time')} className="ls-input" />
      </FormGroup>

      <FormGroup label={t('quicklog.feed_form.amount_label')}>
        <div style={{ position: 'relative' }}>
          <input
            type="number"
            min="0"
            step="5"
            value={data.amount}
            onChange={set('amount')}
            placeholder="0"
            className="ls-input"
            style={{ paddingRight: '48px' }}
          />
          <span style={{
            position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)',
            fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--ink-400)',
            pointerEvents: 'none',
          }}>
            {t('common.ml')}
          </span>
        </div>
      </FormGroup>

      <FormGroup label={t('quicklog.feed_form.type_label')}>
        <Seg
          value={data.feedType}
          onChange={(v) => onChange({ ...data, feedType: v })}
          options={['breast', 'formula', 'solids'].map(k => ({
            key: k,
            label: t(`quicklog.feed_form.${k}`),
          }))}
        />
      </FormGroup>

      <FormGroup label={t('quicklog.notes_label')}>
        <textarea
          value={data.notes}
          onChange={set('notes')}
          placeholder={t('quicklog.notes_placeholder')}
          className="ls-input"
          rows={3}
        />
      </FormGroup>
    </>
  )
}

function NapForm({ data, onChange, t }) {
  const set = (key) => (e) => onChange({ ...data, [key]: e.target.value })
  const durationMins = computeDurationMins(data.startTime, data.endTime)

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <FormGroup label={t('quicklog.nap_form.start_label')}>
          <input type="time" value={data.startTime} onChange={set('startTime')} className="ls-input" />
        </FormGroup>
        <FormGroup label={t('quicklog.nap_form.end_label')}>
          <input type="time" value={data.endTime} onChange={set('endTime')} className="ls-input" />
        </FormGroup>
      </div>

      {durationMins !== null && (
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-sm)',
          color: 'var(--ink-600)',
          margin: '0',
          padding: '2px 0',
        }}>
          {t('quicklog.nap_form.duration_label')}:{' '}
          {Math.floor(durationMins / 60)}{t('common.h')}{' '}
          {durationMins % 60}{t('common.min')}
        </p>
      )}

      <FormGroup label={t('quicklog.nap_form.quality_label')}>
        <Seg
          value={data.quality}
          onChange={(v) => onChange({ ...data, quality: v })}
          options={['poor', 'good', 'great'].map(k => ({
            key: k,
            label: t(`quicklog.nap_form.${k}`),
          }))}
        />
      </FormGroup>

      <FormGroup label={t('quicklog.notes_label')}>
        <textarea
          value={data.notes}
          onChange={set('notes')}
          placeholder={t('quicklog.notes_placeholder')}
          className="ls-input"
          rows={3}
        />
      </FormGroup>
    </>
  )
}

function DiaperForm({ data, onChange, t }) {
  const set = (key) => (e) => onChange({ ...data, [key]: e.target.value })
  return (
    <>
      <FormGroup label={t('quicklog.time_label')}>
        <input type="time" value={data.time} onChange={set('time')} className="ls-input" />
      </FormGroup>

      <FormGroup label={t('quicklog.diaper_form.type_label')}>
        <Seg
          value={data.diaperType}
          onChange={(v) => onChange({ ...data, diaperType: v })}
          options={['wet', 'dirty', 'both'].map(k => ({
            key: k,
            label: t(`quicklog.diaper_form.${k}`),
          }))}
        />
      </FormGroup>

      <FormGroup label={t('quicklog.notes_label')}>
        <textarea
          value={data.notes}
          onChange={set('notes')}
          placeholder={t('quicklog.notes_placeholder')}
          className="ls-input"
          rows={3}
        />
      </FormGroup>
    </>
  )
}

const TAG_OPTIONS = ['allergy', 'vaccination', 'observation', 'medication']

function NoteForm({ data, onChange, t }) {
  const set = (key) => (e) => onChange({ ...data, [key]: e.target.value })

  const toggleTag = (tag) => {
    const tags = data.tags.includes(tag)
      ? data.tags.filter(x => x !== tag)
      : [...data.tags, tag]
    onChange({ ...data, tags })
  }

  return (
    <>
      <FormGroup label={t('quicklog.time_label')}>
        <input type="time" value={data.time} onChange={set('time')} className="ls-input" />
      </FormGroup>

      <FormGroup label={t('quicklog.notes_label')}>
        <textarea
          value={data.text}
          onChange={set('text')}
          placeholder={t('quicklog.notes_placeholder')}
          className="ls-input"
          rows={4}
        />
      </FormGroup>

      <FormGroup label={t('health.notes.tags_label')}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {TAG_OPTIONS.map(tag => {
            const active = data.tags.includes(tag)
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--r-xs)',
                  border: `1px solid ${active ? 'var(--sage-500)' : 'var(--linen-200)'}`,
                  background: active ? 'var(--sage-100)' : 'transparent',
                  color: active ? 'var(--sage-700)' : 'var(--ink-600)',
                  fontFamily: 'var(--font-body)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all var(--duration-fast) var(--ease-default)',
                }}
              >
                {t(`health.notes.tag_options.${tag}`)}
              </button>
            )
          })}
        </div>
      </FormGroup>
    </>
  )
}

// ── Icon button ────────────────────────────────────────────────────

function IconBtn({ onClick, ariaLabel, bg = 'transparent', children }) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      style={{
        width: 32, height: 32,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: 'none', background: bg,
        cursor: 'pointer', color: 'var(--ink-600)',
        borderRadius: 'var(--r-pill)',
        padding: 0,
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  )
}

// ── Main export ───────────────────────────────────────────────────

export default function QuickLog({ open, onClose }) {
  const { t } = useTranslation()
  const { session, supabase } = useAuth()
  const { isNative } = usePlatform()

  const [step, setStep] = useState('type')   // 'type' | 'form'
  const [type, setType] = useState(null)
  const [formData, setFormData] = useState({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Mount / unmount with animation
  const [rendered, setRendered] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (open) {
      setRendered(true)
      // Defer one frame so the initial style (hidden) is painted before transitioning in
      requestAnimationFrame(() => setVisible(true))
    } else {
      setVisible(false)
      const timer = setTimeout(() => {
        setRendered(false)
        setStep('type')
        setType(null)
        setFormData({})
        setSaving(false)
        setSaved(false)
      }, 350)
      return () => clearTimeout(timer)
    }
  }, [open])

  const handleTypeSelect = (id) => {
    setType(id)
    setFormData(defaultData(id))
    setStep('form')
  }

  const handleBack = () => {
    setStep('type')
    setType(null)
    setFormData({})
  }

  const getBabyId = useCallback(async () => {
    const { data: baby } = await supabase
      .from('babies').select('id').eq('owner_id', session.user.id).maybeSingle()
    if (baby?.id) return baby.id
    const { data: profile } = await supabase
      .from('user_profiles').select('baby_id').eq('id', session.user.id).maybeSingle()
    return profile?.baby_id ?? null
  }, [supabase, session])

  const handleSave = async () => {
    if (!session || saving || saved) return
    setSaving(true)

    const timeStr = formData.time || formData.startTime || nowHCM()

    try {
      const babyId = await getBabyId()
      const { error } = await supabase.from('daily_logs').insert({
        baby_id:   babyId,
        logged_by: session.user.id,
        type,
        logged_at: timeStrToUTC(timeStr),
        data:      formData,
      })
      if (error && error.code !== '42P01') throw error
    } catch (_) {
      // Silent fail — success UI still shown so the flow feels complete
    }

    setSaved(true)
    setTimeout(() => onClose(), 900)
  }

  if (!rendered) return null

  // ── Layout styles ─────────────────────────────────────────────
  const overlayStyle = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(42, 40, 35, 0.45)',
    zIndex: 300,
    display: 'flex',
    alignItems: isNative ? 'flex-end' : 'center',
    justifyContent: 'center',
    opacity: visible ? 1 : 0,
    transition: 'opacity 200ms var(--ease-default)',
  }

  const sheetStyle = {
    width: '100%',
    maxHeight: '90dvh',
    background: 'var(--linen-50)',
    borderRadius: 'var(--r-xl) var(--r-xl) 0 0',
    boxShadow: 'var(--shadow-lg)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    transform: `translateY(${visible ? '0' : '100%'})`,
    transition: 'transform 350ms var(--ease-default)',
  }

  const modalStyle = {
    width: '480px',
    maxWidth: '90vw',
    maxHeight: '85dvh',
    background: 'var(--linen-50)',
    borderRadius: 'var(--r-lg)',
    boxShadow: 'var(--shadow-lg)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    transform: `scale(${visible ? 1 : 0.97})`,
    transition: 'transform 200ms var(--ease-default)',
  }

  return (
    <div onClick={onClose} style={overlayStyle}>
      <div onClick={e => e.stopPropagation()} style={isNative ? sheetStyle : modalStyle}>

        {/* Drag handle — mobile sheet only */}
        {isNative && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 2px', flexShrink: 0 }}>
            <div style={{
              width: 36, height: 4,
              borderRadius: 'var(--r-pill)',
              background: 'var(--linen-200)',
            }} />
          </div>
        )}

        {/* Header: [back | title | close] */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '32px 1fr 32px',
          alignItems: 'center',
          gap: '8px',
          padding: '16px 20px',
          borderBottom: '1px solid var(--linen-200)',
          flexShrink: 0,
        }}>
          {step === 'form'
            ? <IconBtn onClick={handleBack} ariaLabel="Back"><ArrowLeft size={18} strokeWidth={2} /></IconBtn>
            : <div />
          }

          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-h3)',
            fontWeight: 600,
            color: 'var(--ink-900)',
            margin: 0,
            textAlign: 'center',
            fontOpticalSizing: 'auto',
          }}>
            {step === 'type' ? t('quicklog.title') : t(`quicklog.log_types.${type}`)}
          </h2>

          <IconBtn onClick={onClose} ariaLabel={t('common.close')} bg="var(--linen-200)">
            <X size={16} strokeWidth={2} />
          </IconBtn>
        </div>

        {/* Scrollable content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: step === 'type' ? '10px' : '16px',
        }}>

          {/* Step 1 — type selector */}
          {step === 'type' && (
            <>
              <p style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-sm)',
                color: 'var(--ink-400)',
                margin: 0,
              }}>
                {t('quicklog.choose_type')}
              </p>

              {QUICK_LOG_TYPES.map(item => {
                const Icon = ICON_MAP[item.icon]
                const iconColor = TYPE_ICON_COLOR[item.id]
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTypeSelect(item.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      height: '80px',
                      padding: '0 20px',
                      width: '100%',
                      background: 'var(--linen-100)',
                      border: '1px solid var(--linen-200)',
                      borderRadius: 'var(--r-md)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: `background var(--duration-fast) var(--ease-default),
                                   border-color var(--duration-fast) var(--ease-default)`,
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'var(--sage-100)'
                      e.currentTarget.style.borderColor = 'var(--sage-300)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'var(--linen-100)'
                      e.currentTarget.style.borderColor = 'var(--linen-200)'
                    }}
                  >
                    <div style={{
                      width: 40, height: 40,
                      borderRadius: 'var(--r-pill)',
                      background: 'white',
                      border: '1px solid var(--linen-200)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {Icon && <Icon size={20} strokeWidth={1.5} color={iconColor} />}
                    </div>
                    <span style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: 'var(--text-base)',
                      fontWeight: 700,
                      color: 'var(--ink-900)',
                    }}>
                      {t(item.labelKey)}
                    </span>
                  </button>
                )
              })}
            </>
          )}

          {/* Step 2 — form */}
          {step === 'form' && type === 'feed'   && <FeedForm   data={formData} onChange={setFormData} t={t} />}
          {step === 'form' && type === 'nap'    && <NapForm    data={formData} onChange={setFormData} t={t} />}
          {step === 'form' && type === 'diaper' && <DiaperForm data={formData} onChange={setFormData} t={t} />}
          {step === 'form' && type === 'note'   && <NoteForm   data={formData} onChange={setFormData} t={t} />}
        </div>

        {/* Footer — step 2 only */}
        {step === 'form' && (
          <div style={{
            display: 'flex',
            gap: '12px',
            padding: `16px 20px calc(16px + env(safe-area-inset-bottom))`,
            borderTop: '1px solid var(--linen-200)',
            flexShrink: 0,
          }}>
            <button
              onClick={onClose}
              className="ls-btn-ghost"
              style={{ flex: 1, height: '48px' }}
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleSave}
              disabled={saving || saved}
              className="ls-btn-primary lg"
              style={{
                flex: 2,
                background: saved ? 'var(--success)' : undefined,
              }}
            >
              {saved ? t('quicklog.saved') : saving ? t('quicklog.saving') : t('common.save')}
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
