import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Check, X, Plus } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { usePlatform } from '../../hooks/usePlatform.js'
import { formatDate } from '../../lib/dates.js'
import { HEALTH_SUB_TABS } from '../../config/navigation.js'
import SproutIllo from '../../components/illustrations/SproutIllo.jsx'
import appConfig from '../../config/app.config.js'

function todayStr() {
  return new Date().toLocaleDateString('en-CA', { timeZone: appConfig.family.timezone })
}

// ── Shared primitives ─────────────────────────────────────────────

function MicroLabel({ children }) {
  return (
    <p style={{
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--text-micro)',
      fontWeight: 700,
      color: 'var(--ink-400)',
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      margin: 0,
    }}>
      {children}
    </p>
  )
}

function EmptyState({ text }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 16, padding: '48px 24px', textAlign: 'center',
    }}>
      <SproutIllo style={{ width: 56, height: 'auto', opacity: 0.35 }} />
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink-400)', margin: 0, lineHeight: 1.6, maxWidth: 220 }}>
        {text}
      </p>
    </div>
  )
}

function SeverityDots({ level }) {
  const counts = { mild: 1, moderate: 2, severe: 3 }
  const filled = counts[level] || 0
  return (
    <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center', marginLeft: 4 }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 5, height: 5, borderRadius: '50%',
          background: i < filled ? 'white' : 'rgba(255,255,255,0.3)',
          flexShrink: 0,
        }} />
      ))}
    </span>
  )
}

const PRESET_TAGS = ['allergy', 'vaccination', 'observation', 'medication']
const SEVERITY_LEVELS = ['mild', 'moderate', 'severe']

// ── Notes tab ─────────────────────────────────────────────────────

function NotesTab({ supabase, session }) {
  const { t, i18n } = useTranslation()
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [selectedTags, setSelectedTags] = useState(new Set())
  const [customTag, setCustomTag] = useState('')
  const [saving, setSaving] = useState(false)
  const textareaRef = useRef()

  const getBabyId = useCallback(async () => {
    try {
      const { data } = await supabase.from('babies').select('id').eq('owner_id', session.user.id).single()
      return data?.id ?? null
    } catch { return null }
  }, [supabase, session])

  const load = useCallback(async () => {
    if (!session) return
    setLoading(true)
    try {
      const { data } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false })
      setNotes(data || [])
    } catch { /* 42P01 tolerated */ } finally {
      setLoading(false)
    }
  }, [supabase, session])

  useEffect(() => { load() }, [load])

  const toggleTag = (tag) => {
    setSelectedTags(prev => {
      const next = new Set(prev)
      next.has(tag) ? next.delete(tag) : next.add(tag)
      return next
    })
  }

  const addCustomTag = (e) => {
    if (e.key === 'Enter' && customTag.trim()) {
      e.preventDefault()
      setSelectedTags(prev => new Set([...prev, customTag.trim().toLowerCase()]))
      setCustomTag('')
    }
  }

  const removeTag = (tag) => {
    setSelectedTags(prev => { const n = new Set(prev); n.delete(tag); return n })
  }

  const handleOpen = () => {
    setAddOpen(true)
    setTimeout(() => textareaRef.current?.focus(), 50)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!noteText.trim()) return
    setSaving(true)
    try {
      const babyId = await getBabyId()
      if (!babyId) return
      await supabase.from('notes').insert({
        baby_id: babyId,
        written_by: session.user.id,
        body: noteText.trim(),
        tags: selectedTags.size ? [...selectedTags] : [],
      })
      setNoteText('')
      setSelectedTags(new Set())
      setCustomTag('')
      setAddOpen(false)
      await load()
    } catch { /* tolerated */ } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setAddOpen(false)
    setNoteText('')
    setSelectedTags(new Set())
    setCustomTag('')
  }

  return (
    <div>
      {/* Note list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink-400)' }}>
          {t('common.loading')}
        </div>
      ) : notes.length === 0 && !addOpen ? (
        <EmptyState text={t('health.notes.empty')} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: notes.length ? 16 : 0 }}>
          {notes.map(note => (
            <div
              key={note.id}
              className="ls-card"
              style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}
            >
              <MicroLabel>{formatDate(note.created_at, i18n.language)}</MicroLabel>
              <p style={{
                fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink-900)',
                margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap',
              }}>
                {note.body}
              </p>
              {note.tags?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {note.tags.map(tag => (
                    <span key={tag} className="ls-chip" style={{ fontSize: 11 }}>
                      {PRESET_TAGS.includes(tag)
                        ? t(`health.notes.tag_options.${tag}`)
                        : tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Inline add form */}
      {addOpen ? (
        <form
          onSubmit={handleSave}
          className="ls-card"
          style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}
        >
          <textarea
            ref={textareaRef}
            className="ls-input"
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            placeholder={t('health.notes.placeholder')}
            style={{ height: 100, resize: 'none', padding: '12px 16px', lineHeight: 1.6 }}
          />

          {/* Preset tag pills */}
          <div>
            <label className="ls-label" style={{ marginBottom: 8, display: 'block' }}>
              {t('health.notes.tags_label')}
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
              {PRESET_TAGS.map(tag => {
                const active = selectedTags.has(tag)
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    style={{
                      fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700,
                      padding: '5px 12px', borderRadius: 8, cursor: 'pointer',
                      border: active ? 'none' : '1.5px solid var(--linen-200)',
                      background: active ? 'var(--sage-100)' : 'transparent',
                      color: active ? 'var(--sage-700)' : 'var(--ink-400)',
                      transition: 'all var(--duration-fast) var(--ease-default)',
                    }}
                  >
                    {t(`health.notes.tag_options.${tag}`)}
                  </button>
                )
              })}
            </div>

            {/* Custom tag chips + input */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
              {[...selectedTags].filter(t => !PRESET_TAGS.includes(t)).map(tag => (
                <span
                  key={tag}
                  className="ls-chip"
                  style={{ fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                  >
                    <X size={10} strokeWidth={2.5} color="var(--sage-700)" />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={customTag}
                onChange={e => setCustomTag(e.target.value)}
                onKeyDown={addCustomTag}
                placeholder="+ custom…"
                style={{
                  fontFamily: 'var(--font-body)', fontSize: 12,
                  border: 'none', outline: 'none', background: 'transparent',
                  color: 'var(--ink-600)', width: 90,
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="ls-btn-ghost" onClick={handleCancel} style={{ flex: 1 }}>
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="ls-btn-primary"
              disabled={saving || !noteText.trim()}
              style={{ flex: 2, opacity: !noteText.trim() ? 0.5 : 1 }}
            >
              {saving ? t('common.loading') : t('common.save')}
            </button>
          </div>
        </form>
      ) : (
        <button className="ls-btn-ghost" onClick={handleOpen} style={{ marginTop: 4 }}>
          {t('health.notes.add')}
        </button>
      )}
    </div>
  )
}

// ── Allergies & Food tab ──────────────────────────────────────────

function AllergiesFoodTab({ supabase, session }) {
  const { t, i18n } = useTranslation()
  const [allergens, setAllergens] = useState([])
  const [foods, setFoods] = useState([])
  const [loading, setLoading] = useState(false)

  // Allergen form
  const [allergenOpen, setAllergenOpen] = useState(false)
  const [allergenForm, setAllergenForm] = useState({ name: '', severity: 'mild', firstReaction: '', notes: '' })
  const [savingAllergen, setSavingAllergen] = useState(false)

  // Food form
  const [foodInput, setFoodInput] = useState('')
  const [savingFood, setSavingFood] = useState(false)

  const getBabyId = useCallback(async () => {
    try {
      const { data } = await supabase.from('babies').select('id').eq('owner_id', session.user.id).single()
      return data?.id ?? null
    } catch { return null }
  }, [supabase, session])

  const load = useCallback(async () => {
    if (!session) return
    setLoading(true)
    try {
      const [{ data: a }, { data: f }] = await Promise.all([
        supabase.from('allergens').select('*').order('created_at', { ascending: false }),
        supabase.from('foods_tried').select('*').order('created_at', { ascending: true }),
      ])
      setAllergens(a || [])
      setFoods(f || [])
    } catch { /* 42P01 tolerated */ } finally {
      setLoading(false)
    }
  }, [supabase, session])

  useEffect(() => { load() }, [load])

  const handleSaveAllergen = async (e) => {
    e.preventDefault()
    if (!allergenForm.name.trim()) return
    setSavingAllergen(true)
    try {
      const babyId = await getBabyId()
      if (!babyId) return
      await supabase.from('allergens').insert({
        baby_id: babyId,
        name: allergenForm.name.trim(),
        severity: allergenForm.severity,
        first_reaction_at: allergenForm.firstReaction || null,
        notes: allergenForm.notes.trim() || null,
      })
      setAllergenForm({ name: '', severity: 'mild', firstReaction: '', notes: '' })
      setAllergenOpen(false)
      await load()
    } catch { /* tolerated */ } finally {
      setSavingAllergen(false)
    }
  }

  const handleAddFood = async (e) => {
    e.preventDefault()
    if (!foodInput.trim()) return
    setSavingFood(true)
    try {
      const babyId = await getBabyId()
      if (!babyId) return
      await supabase.from('foods_tried').insert({
        baby_id: babyId,
        name: foodInput.trim(),
        first_tried_at: todayStr(),
      })
      setFoodInput('')
      await load()
    } catch { /* tolerated */ } finally {
      setSavingFood(false)
    }
  }

  const handleRemoveFood = async (id) => {
    try {
      await supabase.from('foods_tried').delete().eq('id', id)
      setFoods(prev => prev.filter(f => f.id !== id))
    } catch { /* tolerated */ }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink-400)' }}>
        {t('common.loading')}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

      {/* ── Allergens section ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 700, color: 'var(--ink-900)', margin: 0 }}>
            {t('health.allergies.title')}
          </p>
          {!allergenOpen && (
            <button
              className="ls-btn-ghost"
              onClick={() => setAllergenOpen(true)}
              style={{ height: 32, padding: '0 12px', fontSize: 13 }}
            >
              {t('health.allergies.add')}
            </button>
          )}
        </div>

        {allergens.length === 0 && !allergenOpen ? (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--ink-400)', margin: 0 }}>
            {t('health.allergies.empty')}
          </p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: allergenOpen ? 16 : 0 }}>
            {allergens.map(a => (
              <span
                key={a.id}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: 'var(--clay)', color: 'white',
                  padding: '6px 12px', borderRadius: 8,
                  fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700,
                }}
              >
                {a.name}
                <SeverityDots level={a.severity} />
              </span>
            ))}
          </div>
        )}

        {/* Allergen add form */}
        {allergenOpen && (
          <form
            onSubmit={handleSaveAllergen}
            className="ls-card"
            style={{ padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}
          >
            <div>
              <label className="ls-label">{t('health.allergies.name_label')}</label>
              <input
                autoFocus
                className="ls-input"
                type="text"
                value={allergenForm.name}
                onChange={e => setAllergenForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Peanuts"
                required
              />
            </div>

            {/* Severity segmented */}
            <div>
              <label className="ls-label">{t('health.allergies.severity_label')}</label>
              <div className="ls-seg" style={{ width: '100%', display: 'flex' }}>
                {SEVERITY_LEVELS.map(level => (
                  <button
                    key={level}
                    type="button"
                    className={allergenForm.severity === level ? 'on' : ''}
                    onClick={() => setAllergenForm(f => ({ ...f, severity: level }))}
                    style={{ flex: 1 }}
                  >
                    {t(`health.allergies.${level}`)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="ls-label">
                {t('health.allergies.first_reaction')}{' '}
                <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--ink-400)' }}>
                  ({t('common.optional')})
                </span>
              </label>
              <input
                type="date"
                className="ls-input"
                value={allergenForm.firstReaction}
                onChange={e => setAllergenForm(f => ({ ...f, firstReaction: e.target.value }))}
                max={todayStr()}
              />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                className="ls-btn-ghost"
                onClick={() => { setAllergenOpen(false); setAllergenForm({ name: '', severity: 'mild', firstReaction: '', notes: '' }) }}
                style={{ flex: 1 }}
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                className="ls-btn-primary"
                disabled={savingAllergen || !allergenForm.name.trim()}
                style={{ flex: 2, opacity: !allergenForm.name.trim() ? 0.5 : 1 }}
              >
                {savingAllergen ? t('common.loading') : t('common.save')}
              </button>
            </div>
          </form>
        )}
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--linen-200)', margin: 0 }} />

      {/* ── Foods tried section ── */}
      <div>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 700, color: 'var(--ink-900)', margin: '0 0 14px' }}>
          {t('health.food.title')}
        </p>

        {/* Chip cloud */}
        {foods.length === 0 ? (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--ink-400)', margin: '0 0 14px' }}>
            {t('health.food.empty')}
          </p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
            {foods.map(food => (
              <span
                key={food.id}
                className="ls-chip"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  fontSize: 13, padding: '6px 10px',
                }}
              >
                {food.name}
                <button
                  type="button"
                  onClick={() => handleRemoveFood(food.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                >
                  <X size={10} strokeWidth={2.5} color="var(--sage-700)" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Add food inline */}
        <form onSubmit={handleAddFood} style={{ display: 'flex', gap: 10 }}>
          <input
            className="ls-input"
            type="text"
            value={foodInput}
            onChange={e => setFoodInput(e.target.value)}
            placeholder={t('health.food.name_placeholder')}
          />
          <button
            type="submit"
            className="ls-btn-primary"
            disabled={!foodInput.trim() || savingFood}
            style={{ flexShrink: 0 }}
          >
            <Plus size={15} />
            {t('common.add')}
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Vaccinations tab ──────────────────────────────────────────────

function VaccinationsTab({ supabase, session }) {
  const { t, i18n } = useTranslation()
  const [vaccinations, setVaccinations] = useState([])
  const [loading, setLoading] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState({ name: '', dueAt: '', doneAt: '' })
  const [saving, setSaving] = useState(false)

  const getBabyId = useCallback(async () => {
    try {
      const { data } = await supabase.from('babies').select('id').eq('owner_id', session.user.id).single()
      return data?.id ?? null
    } catch { return null }
  }, [supabase, session])

  const load = useCallback(async () => {
    if (!session) return
    setLoading(true)
    try {
      const { data } = await supabase
        .from('vaccinations')
        .select('*')
        .order('due_at', { ascending: true })
      setVaccinations(data || [])
    } catch { /* 42P01 tolerated */ } finally {
      setLoading(false)
    }
  }, [supabase, session])

  useEffect(() => { load() }, [load])

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const babyId = await getBabyId()
      if (!babyId) return
      await supabase.from('vaccinations').insert({
        baby_id: babyId,
        name: form.name.trim(),
        due_at: form.dueAt || null,
        done_at: form.doneAt || null,
      })
      setForm({ name: '', dueAt: '', doneAt: '' })
      setAddOpen(false)
      await load()
    } catch { /* tolerated */ } finally {
      setSaving(false)
    }
  }

  const toggleDone = async (vax) => {
    try {
      const update = vax.done_at
        ? { done_at: null }
        : { done_at: todayStr() }
      await supabase.from('vaccinations').update(update).eq('id', vax.id)
      setVaccinations(prev =>
        prev.map(v => v.id === vax.id ? { ...v, ...update } : v)
      )
    } catch { /* tolerated */ }
  }

  // Sort: upcoming first (no done_at), then done (has done_at)
  const sorted = [
    ...vaccinations.filter(v => !v.done_at).sort((a, b) => (a.due_at || '') < (b.due_at || '') ? -1 : 1),
    ...vaccinations.filter(v => v.done_at).sort((a, b) => b.done_at < a.done_at ? -1 : 1),
  ]

  return (
    <div>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink-400)' }}>
          {t('common.loading')}
        </div>
      ) : sorted.length === 0 && !addOpen ? (
        <EmptyState text={t('health.vaccinations.empty')} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {sorted.map(vax => {
            const done = !!vax.done_at
            return (
              <div
                key={vax.id}
                className="ls-card"
                style={{
                  padding: '14px 16px',
                  display: 'flex', alignItems: 'center', gap: 14,
                  background: done ? 'var(--sage-100)' : 'var(--linen-100)',
                }}
              >
                {/* Toggle button */}
                <button
                  onClick={() => toggleDone(vax)}
                  style={{
                    width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                    border: done ? 'none' : '2px solid var(--linen-200)',
                    background: done ? 'var(--sage-700)' : 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  {done && <Check size={13} strokeWidth={3} color="white" />}
                </button>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 700,
                    color: done ? 'var(--sage-700)' : 'var(--ink-900)',
                    margin: '0 0 3px',
                  }}>
                    {vax.name}
                  </p>
                  {done && vax.done_at ? (
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--sage-700)', margin: 0 }}>
                      {t('health.vaccinations.done')} · {formatDate(`${vax.done_at}T00:00:00`, i18n.language)}
                    </p>
                  ) : vax.due_at ? (
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--ink-400)', margin: 0 }}>
                      {t('health.vaccinations.due', { date: formatDate(`${vax.due_at}T00:00:00`, i18n.language) })}
                    </p>
                  ) : null}
                </div>

                {/* Status badge */}
                <span
                  className="ls-chip"
                  style={{
                    fontSize: 11, flexShrink: 0,
                    background: done ? 'var(--sage-700)' : 'var(--linen-200)',
                    color: done ? 'white' : 'var(--ink-600)',
                  }}
                >
                  {done ? t('health.vaccinations.done') : t('health.vaccinations.upcoming')}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* Add vaccination form */}
      {addOpen ? (
        <form
          onSubmit={handleSave}
          className="ls-card"
          style={{ padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}
        >
          <div>
            <label className="ls-label">{t('health.vaccinations.name_label')}</label>
            <input
              autoFocus
              className="ls-input"
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. BCG"
              required
            />
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 140px' }}>
              <label className="ls-label">
                {t('health.vaccinations.due_label')}{' '}
                <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--ink-400)' }}>
                  ({t('common.optional')})
                </span>
              </label>
              <input
                type="date"
                className="ls-input"
                value={form.dueAt}
                onChange={e => setForm(f => ({ ...f, dueAt: e.target.value }))}
              />
            </div>
            <div style={{ flex: '1 1 140px' }}>
              <label className="ls-label">
                {t('health.vaccinations.done_label')}{' '}
                <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--ink-400)' }}>
                  ({t('common.optional')})
                </span>
              </label>
              <input
                type="date"
                className="ls-input"
                value={form.doneAt}
                onChange={e => setForm(f => ({ ...f, doneAt: e.target.value }))}
                max={todayStr()}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              className="ls-btn-ghost"
              onClick={() => { setAddOpen(false); setForm({ name: '', dueAt: '', doneAt: '' }) }}
              style={{ flex: 1 }}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="ls-btn-primary"
              disabled={saving || !form.name.trim()}
              style={{ flex: 2, opacity: !form.name.trim() ? 0.5 : 1 }}
            >
              {saving ? t('common.loading') : t('common.save')}
            </button>
          </div>
        </form>
      ) : (
        <button className="ls-btn-ghost" onClick={() => setAddOpen(true)}>
          {t('health.vaccinations.add')}
        </button>
      )}
    </div>
  )
}

// ── Main screen ───────────────────────────────────────────────────

export default function HealthScreen({ tab }) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { session, supabase } = useAuth()
  const { isNative } = usePlatform()

  const activeTab = tab || 'notes'

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
        {t('health.page_title')}
      </h1>

      {/* Sub-tab bar */}
      <div className="ls-seg" style={{ width: '100%', display: 'flex', marginBottom: 24 }}>
        {HEALTH_SUB_TABS.map(subTab => (
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

      {activeTab === 'notes' && (
        <NotesTab supabase={supabase} session={session} />
      )}
      {activeTab === 'allergies_food' && (
        <AllergiesFoodTab supabase={supabase} session={session} />
      )}
      {activeTab === 'vaccinations' && (
        <VaccinationsTab supabase={supabase} session={session} />
      )}
    </div>
  )
}
