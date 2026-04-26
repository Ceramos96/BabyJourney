import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, Upload, X, Check, Camera } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { usePlatform } from '../../hooks/usePlatform.js'
import { compressImage, formatFileSize } from '../../lib/compress.js'
import { formatDate, formatMonthYear } from '../../lib/dates.js'
import { JOURNAL_SUB_TABS, MILESTONE_TYPES } from '../../config/navigation.js'
import AcornIllo from '../../components/illustrations/AcornIllo.jsx'
import SproutIllo from '../../components/illustrations/SproutIllo.jsx'
import appConfig from '../../config/app.config.js'

function todayStr() {
  return new Date().toLocaleDateString('en-CA', { timeZone: appConfig.family.timezone })
}

function extractDriveId(url) {
  const m = url.match(/\/d\/([a-zA-Z0-9_-]+)/)
  return m ? m[1] : null
}

function SectionHeader({ children }) {
  return (
    <p style={{
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-micro)',
      fontWeight: 700,
      color: 'var(--ink-400)',
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      margin: '0 0 10px',
    }}>
      {children}
    </p>
  )
}

// ── Photos sub-tab ────────────────────────────────────────────────

function PhotosTab({ supabase, session }) {
  const { t, i18n } = useTranslation()
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [compressedSize, setCompressedSize] = useState(null)
  const [lightbox, setLightbox] = useState(null)
  const [captionEdit, setCaptionEdit] = useState('')
  const [savingCaption, setSavingCaption] = useState(false)
  const [driveUrl, setDriveUrl] = useState('')
  const [driveSubmitting, setDriveSubmitting] = useState(false)
  const [hovered, setHovered] = useState(null)
  const fileInputRef = useRef()

  const now = new Date()
  const isCurrentMonth =
    currentMonth.getMonth() === now.getMonth() &&
    currentMonth.getFullYear() === now.getFullYear()

  const getBabyId = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('babies')
        .select('id')
        .eq('owner_id', session.user.id)
        .single()
      return data?.id ?? null
    } catch { return null }
  }, [supabase, session])

  const load = useCallback(async () => {
    if (!session) return
    setLoading(true)
    try {
      const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).toISOString()
      const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59, 999).toISOString()
      const { data } = await supabase
        .from('photos')
        .select('*')
        .gte('taken_at', start)
        .lte('taken_at', end)
        .order('taken_at', { ascending: false })
      setPhotos(data || [])
    } catch { /* 42P01 tolerated */ } finally {
      setLoading(false)
    }
  }, [supabase, session, currentMonth])

  useEffect(() => { load() }, [load])

  const getPhotoSrc = (photo) => {
    if (photo.drive_url) {
      const fileId = extractDriveId(photo.drive_url)
      return fileId ? `https://drive.google.com/thumbnail?id=${fileId}&sz=w800` : null
    }
    if (photo.storage_path) {
      const { data } = supabase.storage.from('baby-photos').getPublicUrl(photo.storage_path)
      return data?.publicUrl ?? null
    }
    return null
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setUploading(true)
    setCompressedSize(null)
    try {
      const compressed = await compressImage(file)
      setCompressedSize(compressed.compressedSize)
      const babyId = await getBabyId()
      if (!babyId) return
      const year = currentMonth.getFullYear()
      const month = String(currentMonth.getMonth() + 1).padStart(2, '0')
      const path = `babies/${babyId}/timeline/${year}/${month}/${Date.now()}-${compressed.name}`
      const { error: storageErr } = await supabase.storage
        .from('baby-photos')
        .upload(path, compressed, { contentType: 'image/jpeg' })
      if (storageErr) return
      await supabase.from('photos').insert({
        baby_id: babyId,
        uploaded_by: session.user.id,
        storage_path: path,
        taken_at: new Date().toISOString(),
      })
      await load()
    } catch { /* tolerated */ } finally {
      setUploading(false)
    }
  }

  const handleDriveSubmit = async (e) => {
    e.preventDefault()
    const fileId = extractDriveId(driveUrl)
    if (!fileId) return
    setDriveSubmitting(true)
    try {
      const babyId = await getBabyId()
      if (!babyId) return
      await supabase.from('photos').insert({
        baby_id: babyId,
        uploaded_by: session.user.id,
        drive_url: driveUrl,
        taken_at: new Date().toISOString(),
      })
      setDriveUrl('')
      await load()
    } catch { /* tolerated */ } finally {
      setDriveSubmitting(false)
    }
  }

  const handleSaveCaption = async () => {
    if (!lightbox) return
    setSavingCaption(true)
    try {
      await supabase.from('photos').update({ caption: captionEdit }).eq('id', lightbox.id)
      setPhotos(prev => prev.map(p => p.id === lightbox.id ? { ...p, caption: captionEdit } : p))
      setLightbox(prev => ({ ...prev, caption: captionEdit }))
    } catch { /* tolerated */ } finally {
      setSavingCaption(false)
    }
  }

  const handleDelete = async () => {
    if (!lightbox) return
    try {
      if (lightbox.storage_path) {
        await supabase.storage.from('baby-photos').remove([lightbox.storage_path])
      }
      await supabase.from('photos').delete().eq('id', lightbox.id)
      setPhotos(prev => prev.filter(p => p.id !== lightbox.id))
      setLightbox(null)
    } catch { /* tolerated */ }
  }

  const openLightbox = (photo) => {
    setLightbox(photo)
    setCaptionEdit(photo.caption || '')
  }

  const prevMonth = () =>
    setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))
  const nextMonth = () => {
    if (!isCurrentMonth) setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))
  }

  return (
    <div>
      {/* Month selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button
          onClick={prevMonth}
          aria-label="Previous month"
          style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'var(--linen-100)', border: '1px solid var(--linen-200)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0,
          }}
        >
          <ChevronLeft size={18} color="var(--ink-600)" />
        </button>
        <p style={{
          flex: 1, textAlign: 'center', margin: 0,
          fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600,
          color: 'var(--ink-900)', fontOpticalSizing: 'auto',
        }}>
          {formatMonthYear(currentMonth, i18n.language)}
        </p>
        <button
          onClick={nextMonth}
          aria-label="Next month"
          disabled={isCurrentMonth}
          style={{
            width: 36, height: 36, borderRadius: '50%',
            background: isCurrentMonth ? 'transparent' : 'var(--linen-100)',
            border: `1px solid ${isCurrentMonth ? 'transparent' : 'var(--linen-200)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: isCurrentMonth ? 'default' : 'pointer', flexShrink: 0,
            opacity: isCurrentMonth ? 0.25 : 1,
          }}
        >
          <ChevronRight size={18} color="var(--ink-600)" />
        </button>
      </div>

      {/* Upload button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <button
          className="ls-btn-primary"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          style={{ opacity: uploading ? 0.7 : 1 }}
        >
          <Upload size={15} />
          {uploading ? t('journal.photos.uploading') : t('journal.photos.upload')}
        </button>
        {compressedSize != null && (
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--ink-400)' }}>
            {t('journal.photos.compressed', { size: formatFileSize(compressedSize) })}
          </span>
        )}
      </div>

      {/* Google Drive link */}
      <div style={{ marginBottom: 28 }}>
        <SectionHeader>{t('journal.photos.drive_link_label')}</SectionHeader>
        <form onSubmit={handleDriveSubmit} style={{ display: 'flex', gap: 10 }}>
          <input
            className="ls-input"
            type="url"
            value={driveUrl}
            onChange={e => setDriveUrl(e.target.value)}
            placeholder={t('journal.photos.drive_placeholder')}
          />
          <button
            type="submit"
            className="ls-btn-primary"
            disabled={!driveUrl || driveSubmitting}
            style={{ flexShrink: 0 }}
          >
            {t('common.add')}
          </button>
        </form>
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--ink-400)',
          margin: '6px 0 0', lineHeight: 1.6,
        }}>
          {t('journal.photos.drive_reminder')}
        </p>
      </div>

      {/* Photo grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink-400)' }}>
          {t('common.loading')}
        </div>
      ) : photos.length === 0 ? (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 16, padding: '60px 24px', textAlign: 'center',
        }}>
          <SproutIllo style={{ width: 64, height: 'auto', opacity: 0.35 }} />
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink-400)', margin: 0, lineHeight: 1.6, maxWidth: 220 }}>
            {t('journal.photos.empty')}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {photos.map(photo => {
            const src = getPhotoSrc(photo)
            return (
              <div
                key={photo.id}
                onClick={() => openLightbox(photo)}
                onMouseEnter={() => setHovered(photo.id)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  position: 'relative', aspectRatio: '1',
                  borderRadius: 12, overflow: 'hidden',
                  background: 'var(--linen-200)', cursor: 'pointer',
                }}
              >
                {src ? (
                  <img
                    src={src}
                    alt={photo.caption || ''}
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    onError={e => { e.target.style.display = 'none' }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Camera size={22} color="var(--ink-400)" />
                  </div>
                )}
                {hovered === photo.id && photo.taken_at && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to top, rgba(42,40,35,0.6) 0%, transparent 50%)',
                    display: 'flex', alignItems: 'flex-end', padding: '8px 10px',
                  }}>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, color: 'white', lineHeight: 1 }}>
                      {formatDate(photo.taken_at, i18n.language)}
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(42,40,35,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="ls-card"
            style={{ width: '100%', maxWidth: 480, maxHeight: '90vh', overflow: 'auto', display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '14px 14px 0' }}>
              <button
                onClick={() => setLightbox(null)}
                style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'var(--linen-100)', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <X size={16} color="var(--ink-600)" />
              </button>
            </div>

            {/* Photo */}
            {(() => {
              const src = getPhotoSrc(lightbox)
              return src ? (
                <div style={{ width: '100%', aspectRatio: '4/3', background: 'var(--linen-200)', overflow: 'hidden', flexShrink: 0, margin: '8px 0 0' }}>
                  <img
                    src={src}
                    alt={lightbox.caption || ''}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => {
                      const wrapper = e.target.parentElement
                      wrapper.style.cssText += ';display:flex;align-items:center;justify-content:center;'
                      e.target.remove()
                      const msg = document.createElement('p')
                      msg.style.cssText = 'font-family:var(--font-body);font-size:13px;color:var(--ink-400);padding:24px;text-align:center;margin:0'
                      msg.textContent = t('journal.photos.drive_error')
                      wrapper.appendChild(msg)
                    }}
                  />
                </div>
              ) : null
            })()}

            <div style={{ padding: '20px 20px 8px' }}>
              {lightbox.taken_at && (
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--ink-400)', margin: '0 0 14px' }}>
                  {formatDate(lightbox.taken_at, i18n.language)}
                </p>
              )}
              <label className="ls-label">{t('journal.photos.lightbox.edit_caption')}</label>
              <textarea
                className="ls-input"
                value={captionEdit}
                onChange={e => setCaptionEdit(e.target.value)}
                placeholder={t('journal.photos.caption_placeholder')}
                style={{ height: 80, resize: 'none', padding: '12px 16px', lineHeight: 1.5 }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, padding: '10px 20px 20px', flexWrap: 'wrap' }}>
              <button
                className="ls-btn-primary"
                onClick={handleSaveCaption}
                disabled={savingCaption}
                style={{ flex: 1 }}
              >
                {savingCaption ? t('common.loading') : t('common.save')}
              </button>
              <button
                onClick={handleDelete}
                style={{
                  flex: 1, height: 40, borderRadius: 999,
                  fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 700,
                  color: 'var(--clay)', background: 'transparent',
                  border: '1.5px solid var(--clay)', cursor: 'pointer',
                }}
              >
                {t('journal.photos.lightbox.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Milestones sub-tab ────────────────────────────────────────────

function MilestonesTab({ supabase, session }) {
  const { t, i18n } = useTranslation()
  const { isNative } = usePlatform()

  const [achieved, setAchieved] = useState({})
  const [loading, setLoading] = useState(false)
  const [logOpen, setLogOpen] = useState(false)
  const [logRendered, setLogRendered] = useState(false)
  const [logVisible, setLogVisible] = useState(false)
  const [logForm, setLogForm] = useState({ type: '', date: todayStr(), note: '' })
  const [saving, setSaving] = useState(false)
  const [celebration, setCelebration] = useState(null)

  useEffect(() => {
    if (logOpen) {
      setLogRendered(true)
      requestAnimationFrame(() => setLogVisible(true))
    } else {
      setLogVisible(false)
      const timer = setTimeout(() => setLogRendered(false), 350)
      return () => clearTimeout(timer)
    }
  }, [logOpen])

  const getBabyId = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('babies')
        .select('id')
        .eq('owner_id', session.user.id)
        .single()
      return data?.id ?? null
    } catch { return null }
  }, [supabase, session])

  const load = useCallback(async () => {
    if (!session) return
    setLoading(true)
    try {
      const { data } = await supabase
        .from('milestones')
        .select('*')
        .order('achieved_at', { ascending: true })
      if (data) {
        const map = {}
        data.forEach(m => { map[m.type] = m })
        setAchieved(map)
      }
    } catch { /* 42P01 tolerated */ } finally {
      setLoading(false)
    }
  }, [supabase, session])

  useEffect(() => { load() }, [load])

  const openLog = (preselectedType = '') => {
    setLogForm({ type: preselectedType, date: todayStr(), note: '' })
    setLogOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!logForm.type || !logForm.date) return
    setSaving(true)
    try {
      const babyId = await getBabyId()
      if (!babyId) return
      await supabase.from('milestones').insert({
        baby_id: babyId,
        logged_by: session.user.id,
        type: logForm.type,
        achieved_at: logForm.date,
        note: logForm.note || null,
      })
      await load()
      setLogOpen(false)
      setCelebration({ type: logForm.type, date: logForm.date })
      setLogForm({ type: '', date: todayStr(), note: '' })
    } catch { /* tolerated */ } finally {
      setSaving(false)
    }
  }

  const unachieved = MILESTONE_TYPES.filter(ms => !achieved[ms.id])
  const cols = isNative ? 2 : 3

  return (
    <div>
      {/* Log button */}
      <div style={{ marginBottom: 20 }}>
        <button
          className="ls-btn-primary"
          onClick={() => openLog()}
          disabled={unachieved.length === 0}
          style={{ opacity: unachieved.length === 0 ? 0.4 : 1 }}
        >
          {t('journal.milestones.log_milestone')}
        </button>
      </div>

      {/* Milestone grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink-400)' }}>
          {t('common.loading')}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12 }}>
          {MILESTONE_TYPES.map(ms => {
            const done = achieved[ms.id]
            return (
              <div
                key={ms.id}
                onClick={() => !done && openLog(ms.id)}
                className="ls-card"
                style={{
                  padding: '20px 14px 16px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: 10, textAlign: 'center',
                  background: done ? 'var(--sage-100)' : 'var(--linen-100)',
                  cursor: done ? 'default' : 'pointer',
                  position: 'relative',
                  transition: 'background var(--duration-fast) var(--ease-default)',
                }}
              >
                {done && (
                  <div style={{
                    position: 'absolute', top: 10, right: 10,
                    width: 22, height: 22, borderRadius: '50%',
                    background: 'var(--peach)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Check size={12} strokeWidth={3} color="white" />
                  </div>
                )}
                <AcornIllo style={{
                  width: 36, height: 'auto',
                  color: done ? 'var(--sage-700)' : 'var(--ink-400)',
                }} />
                <div>
                  <p style={{
                    fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700,
                    color: done ? 'var(--sage-700)' : 'var(--ink-900)',
                    margin: '0 0 5px', lineHeight: 1.3,
                  }}>
                    {ms.icon} {t(ms.labelKey)}
                  </p>
                  {done ? (
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--sage-700)', margin: 0, fontWeight: 600, lineHeight: 1.5 }}>
                      {t('journal.milestones.completed')}<br />
                      {formatDate(`${done.achieved_at}T00:00:00`, i18n.language)}
                    </p>
                  ) : (
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--ink-400)', margin: 0 }}>
                      {t('journal.milestones.not_yet')}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Log milestone modal */}
      {logRendered && (
        <div
          onClick={() => setLogOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: `rgba(42,40,35,${logVisible ? 0.5 : 0})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24,
            transition: 'background 350ms var(--ease-default)',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="ls-card"
            style={{
              width: '100%', maxWidth: 440, padding: '28px 24px 24px',
              transform: `scale(${logVisible ? 1 : 0.97})`,
              opacity: logVisible ? 1 : 0,
              transition: 'transform 200ms var(--ease-default), opacity 200ms',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <p style={{
                fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600,
                color: 'var(--ink-900)', margin: 0, fontOpticalSizing: 'auto',
              }}>
                {t('journal.milestones.log_modal.title')}
              </p>
              <button
                onClick={() => setLogOpen(false)}
                style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'var(--linen-100)', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <X size={16} color="var(--ink-600)" />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="ls-label">{t('journal.milestones.log_modal.milestone_label')}</label>
                <select
                  className="ls-input"
                  value={logForm.type}
                  onChange={e => setLogForm(f => ({ ...f, type: e.target.value }))}
                  required
                  style={{ appearance: 'none', cursor: 'pointer' }}
                >
                  <option value="">—</option>
                  {unachieved.map(ms => (
                    <option key={ms.id} value={ms.id}>{ms.icon} {t(ms.labelKey)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="ls-label">{t('journal.milestones.log_modal.date_label')}</label>
                <input
                  type="date"
                  className="ls-input"
                  value={logForm.date}
                  onChange={e => setLogForm(f => ({ ...f, date: e.target.value }))}
                  required
                  max={todayStr()}
                />
              </div>

              <div>
                <label className="ls-label">
                  {t('journal.milestones.log_modal.note_label')}{' '}
                  <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--ink-400)' }}>
                    ({t('common.optional')})
                  </span>
                </label>
                <textarea
                  className="ls-input"
                  value={logForm.note}
                  onChange={e => setLogForm(f => ({ ...f, note: e.target.value }))}
                  placeholder={t('journal.milestones.log_modal.note_placeholder')}
                  style={{ height: 84, resize: 'none', padding: '14px 16px', lineHeight: 1.5 }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, paddingTop: 8 }}>
                <button
                  type="button"
                  className="ls-btn-ghost"
                  onClick={() => setLogOpen(false)}
                  style={{ flex: 1 }}
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="ls-btn-primary lg"
                  disabled={saving || !logForm.type}
                  style={{ flex: 2, opacity: !logForm.type ? 0.5 : 1 }}
                >
                  {saving ? t('common.loading') : t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Celebration overlay */}
      {celebration && (
        <div
          onClick={() => setCelebration(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 300,
            background: 'radial-gradient(ellipse at center, rgba(232,181,156,0.55) 0%, rgba(42,40,35,0.78) 65%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 28, cursor: 'pointer',
          }}
        >
          <div className="sprout-breathe">
            <SproutIllo style={{ width: 100, height: 'auto', color: 'white', opacity: 0.88 }} />
          </div>
          <div style={{ textAlign: 'center', padding: '0 32px' }}>
            <p style={{
              fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700,
              color: 'white', margin: '0 0 10px', fontOpticalSizing: 'auto',
            }}>
              {t('journal.milestones.celebration.title')}
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: 'rgba(255,255,255,0.9)', margin: '0 0 6px' }}>
              {t('journal.milestones.celebration.body', {
                name: appConfig.baby.nickname,
                milestone: t(`journal.milestones.list.${celebration.type}`),
              })}
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.65)', margin: 0 }}>
              {t('journal.milestones.celebration.date', {
                date: formatDate(`${celebration.date}T00:00:00`, i18n.language),
              })}
            </p>
          </div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
            {t('common.close')}
          </p>
        </div>
      )}
    </div>
  )
}

// ── Main screen ───────────────────────────────────────────────────

export default function JournalScreen({ tab }) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { session, supabase } = useAuth()
  const { isNative } = usePlatform()

  const activeTab = tab || 'photos'

  return (
    <div style={{
      padding: isNative ? '20px 16px 32px' : '28px 32px',
      maxWidth: 720,
      margin: '0 auto',
    }}>
      <h1 style={{
        fontFamily: 'var(--font-display)',
        fontSize: isNative ? 'var(--text-h2)' : 'var(--text-h1)',
        fontWeight: 700,
        color: 'var(--ink-900)',
        margin: '0 0 20px',
        fontOpticalSizing: 'auto',
        fontVariationSettings: '"opsz" 48, "SOFT" 50',
      }}>
        {t('journal.photos.title', { name: appConfig.baby.nickname })}
      </h1>

      {/* Sub-tab bar */}
      <div className="ls-seg" style={{ width: '100%', display: 'flex', marginBottom: 24 }}>
        {JOURNAL_SUB_TABS.map(subTab => (
          <button
            key={subTab.id}
            className={activeTab === subTab.id ? 'on' : ''}
            onClick={() => navigate(subTab.route, { replace: true })}
            style={{ flex: 1 }}
          >
            {t(subTab.labelKey)}
          </button>
        ))}
      </div>

      {activeTab === 'photos' && (
        <PhotosTab supabase={supabase} session={session} />
      )}
      {activeTab === 'milestones' && (
        <MilestonesTab supabase={supabase} session={session} />
      )}
    </div>
  )
}
