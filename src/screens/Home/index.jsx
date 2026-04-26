import { useState, useEffect, useCallback } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Milk, Moon, Droplets, PenLine, Clock, RefreshCw } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { usePlatform } from '../../hooks/usePlatform.js'
import { supabase } from '../../lib/supabase.js'
import {
  getBabyAge, formatTime, formatDate, relativeTime, startOfDayUTC,
} from '../../lib/dates.js'
import appConfig from '../../config/app.config.js'
import { MILESTONE_TYPES } from '../../config/navigation.js'
import SproutIllo from '../../components/illustrations/SproutIllo.jsx'
import LeafIllo from '../../components/illustrations/LeafIllo.jsx'

// ─── Constants ────────────────────────────────────────────────────

const TZ = appConfig.family.timezone

const TYPE_ICON = { feed: Milk, nap: Moon, diaper: Droplets, note: PenLine }
const TYPE_COLOR = {
  feed:   'var(--sage-700)',
  nap:    'var(--butter)',
  diaper: 'var(--dusk)',
  note:   'var(--ink-600)',
}
const TYPE_BG = {
  feed:   'var(--sage-50)',
  nap:    '#FAF5DC',
  diaper: '#F0EDF6',
  note:   'var(--linen-100)',
}

// ─── Helpers ──────────────────────────────────────────────────────

function toHCMDateStr(d) {
  return new Date(d).toLocaleDateString('en-CA', { timeZone: TZ })
}

function getHCMHour(isoStr) {
  return new Date(new Date(isoStr).toLocaleString('en-US', { timeZone: TZ })).getHours()
}

function formatSleep(mins) {
  if (!mins || mins === 0) return '—'
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

function getLogMetric(log, t) {
  const d = log.data ?? {}
  switch (log.type) {
    case 'feed': {
      const parts = []
      if (d.amount) parts.push(`${d.amount}${t('common.ml')}`)
      if (d.feed_type) parts.push(t(`quicklog.feed_form.${d.feed_type}`, d.feed_type))
      return parts.join(' · ') || '—'
    }
    case 'nap': {
      const parts = []
      if (d.duration) parts.push(formatSleep(d.duration))
      if (d.quality) parts.push(t(`quicklog.nap_form.${d.quality}`, d.quality))
      return parts.join(' · ') || '—'
    }
    case 'diaper':
      return d.diaper_type ? t(`quicklog.diaper_form.${d.diaper_type}`, d.diaper_type) : '—'
    case 'note':
      return d.text ? (d.text.length > 50 ? d.text.slice(0, 50) + '…' : d.text) : '—'
    default: return '—'
  }
}

// ─── Data hook ────────────────────────────────────────────────────

function useHomeData() {
  const { session } = useAuth()
  const [todayLogs, setTodayLogs] = useState([])
  const [weekLogs, setWeekLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!session) return
    setLoading(true)
    setError(null)
    try {
      const now = new Date()
      const todayStart = startOfDayUTC(now)

      const tomorrow = new Date(now)
      tomorrow.setDate(now.getDate() + 1)
      const tomorrowStart = startOfDayUTC(tomorrow)

      const sixDaysAgo = new Date(now)
      sixDaysAgo.setDate(now.getDate() - 6)
      const weekStart = startOfDayUTC(sixDaysAgo)

      const [logsRes, weekRes] = await Promise.all([
        supabase
          .from('daily_logs')
          .select('id,type,logged_at,data')
          .gte('logged_at', todayStart)
          .lt('logged_at', tomorrowStart)
          .order('logged_at', { ascending: true }),
        supabase
          .from('daily_logs')
          .select('id,type,logged_at')
          .eq('type', 'feed')
          .gte('logged_at', weekStart)
          .lt('logged_at', tomorrowStart),
      ])

      if (logsRes.error && logsRes.error.code !== '42P01') throw logsRes.error
      if (weekRes.error && weekRes.error.code !== '42P01') throw weekRes.error

      setTodayLogs(logsRes.data ?? [])
      setWeekLogs(weekRes.data ?? [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => { load() }, [load])

  return { todayLogs, weekLogs, loading, error, reload: load }
}

// ─── Derived computations ─────────────────────────────────────────

function computeVitals(logs) {
  const feeds   = logs.filter(l => l.type === 'feed')
  const naps    = logs.filter(l => l.type === 'nap')
  const diapers = logs.filter(l => l.type === 'diaper')

  const feedCount = feeds.length
  const totalSleepMins = naps.reduce((acc, l) => acc + (l.data?.duration ?? 0), 0)
  const lastDiaper = diapers.at(-1) ?? null

  return { feedCount, totalSleepMins, lastDiaper }
}

function computeWeekBars(weekLogs, lang) {
  const todayHCM = toHCMDateStr(new Date())
  const now = new Date()
  const dow = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1))
  monday.setHours(0, 0, 0, 0)

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const dateStr = toHCMDateStr(d)
    const count = weekLogs.filter(l => toHCMDateStr(l.logged_at) === dateStr).length
    const isToday = dateStr === todayHCM
    const isFuture = dateStr > todayHCM
    const label = d.toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', { weekday: 'narrow' })
    return { dateStr, count, isToday, isFuture, label }
  })
}

function groupLogsByTimeOfDay(logs, t) {
  const boundaries = [
    { key: 'morning',   labelKey: 'home.timeline.morning',   min: 5,  max: 12 },
    { key: 'afternoon', labelKey: 'home.timeline.afternoon', min: 12, max: 17 },
    { key: 'evening',   labelKey: 'home.timeline.evening',   min: 17, max: 21 },
    { key: 'night',     labelKey: 'home.timeline.night',     min: 21, max: 29 },
  ]
  return boundaries.reduce((acc, { key, labelKey, min, max }) => {
    const group = logs.filter(l => {
      const h = getHCMHour(l.logged_at)
      return max <= 24 ? h >= min && h < max : h >= min || h < (max - 24)
    })
    if (group.length > 0) acc.push({ key, label: t(labelKey), logs: group })
    return acc
  }, [])
}

function getNextMilestone(ageMonths) {
  return MILESTONE_TYPES
    .filter(m => m.typicalMonths >= ageMonths)
    .sort((a, b) => a.typicalMonths - b.typicalMonths)[0] ?? null
}

// ─── Sub-components ───────────────────────────────────────────────

function StatusStrip({ onLangToggle }) {
  const { t, i18n } = useTranslation()
  const { isNative } = usePlatform()

  const hour = new Date().getHours()
  const greetingKey =
    hour >= 5  && hour < 12 ? 'home.greeting_morning'   :
    hour >= 12 && hour < 17 ? 'home.greeting_afternoon' :
    hour >= 17 && hour < 21 ? 'home.greeting_evening'   :
    'home.greeting_night'

  const dateStr = new Date().toLocaleDateString(
    i18n.language === 'vi' ? 'vi-VN' : 'en-GB',
    { weekday: 'short', day: 'numeric', month: 'short' },
  )

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '20px 20px 0',
    }}>
      <p style={{
        fontFamily: 'var(--font-body)',
        fontSize: 'var(--text-base)',
        fontWeight: 600,
        color: 'var(--ink-600)',
        margin: 0,
      }}>
        {t(greetingKey, { name: appConfig.family.ownerName })}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {isNative && (
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-caption)', color: 'var(--ink-400)' }}>
            {dateStr}
          </span>
        )}
        {isNative && (
          <div style={{
            display: 'flex',
            background: 'var(--linen-100)',
            border: '1px solid var(--linen-200)',
            borderRadius: 'var(--r-xs)',
            padding: 2,
            gap: 2,
          }}>
            {['en', 'vi'].map((lang) => {
              const active = i18n.language === lang
              return (
                <button
                  key={lang}
                  onClick={() => i18n.changeLanguage(lang)}
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: active ? 'var(--sage-700)' : 'var(--ink-400)',
                    background: active ? 'white' : 'transparent',
                    border: 'none',
                    cursor: active ? 'default' : 'pointer',
                    padding: '2px 7px',
                    borderRadius: 4,
                    boxShadow: active ? 'var(--shadow-sm)' : 'none',
                    transition: 'all var(--duration-fast) var(--ease-default)',
                  }}
                >
                  {lang.toUpperCase()}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function HeroBlock({ babyNickname, ageMonths, ageDays, onLogPress }) {
  const { t } = useTranslation()
  return (
    <div style={{
      position: 'relative',
      margin: '16px 20px 0',
      borderRadius: 'var(--r-xl)',
      background: 'radial-gradient(ellipse at 85% 50%, var(--sage-100) 0%, var(--linen-50) 68%)',
      border: '1px solid var(--linen-200)',
      padding: '28px 24px',
      overflow: 'hidden',
      minHeight: 140,
    }}>
      {/* Text side */}
      <div style={{ maxWidth: '58%', position: 'relative', zIndex: 1 }}>
        <p style={{
          fontFamily: 'var(--font-display)',
          fontSize: '28px',
          fontWeight: 600,
          color: 'var(--ink-900)',
          margin: '0 0 4px',
          fontOpticalSizing: 'auto',
          letterSpacing: '-0.01em',
        }}>
          {babyNickname}
        </p>
        <p className="age-counter" style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-caption)',
          color: 'var(--ink-400)',
          margin: '0 0 20px',
        }}>
          {t('common.months_old', { months: ageMonths, days: ageDays })}
        </p>
        <button
          className="ls-btn-primary"
          onClick={onLogPress}
          style={{ fontSize: '13px', height: 38 }}
        >
          {t('home.log_something')}
        </button>
      </div>

      {/* Sprout illustration */}
      <div style={{
        position: 'absolute',
        right: 20,
        top: '50%',
        transform: 'translateY(-50%)',
        opacity: 0.9,
      }}>
        <SproutIllo
          className="sprout-breathe"
          style={{ width: 72, height: 90 }}
        />
      </div>
    </div>
  )
}

function VitalsRow({ feedCount, totalSleepMins, lastDiaper }) {
  const { t, i18n } = useTranslation()

  const stats = [
    {
      value: feedCount > 0 ? feedCount : '—',
      label: t('home.vitals.feeds_today'),
      color: 'var(--sage-700)',
    },
    {
      value: formatSleep(totalSleepMins),
      label: t('home.vitals.total_sleep'),
      color: 'var(--ink-600)',
    },
    {
      value: lastDiaper ? relativeTime(lastDiaper.logged_at, i18n.language) : '—',
      label: t('home.vitals.last_diaper'),
      color: 'var(--ink-600)',
    },
  ]

  return (
    <div style={{
      display: 'flex',
      gap: 10,
      padding: '14px 20px 0',
    }}>
      {stats.map((s, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            background: 'var(--linen-50)',
            border: '1px solid var(--linen-200)',
            borderRadius: 'var(--r-md)',
            padding: '10px 12px',
            textAlign: 'center',
          }}
        >
          <p style={{
            fontFamily: 'var(--font-display)',
            fontSize: '17px',
            fontWeight: 500,
            color: s.color,
            margin: '0 0 2px',
            fontVariantNumeric: 'tabular-nums',
            fontOpticalSizing: 'auto',
            lineHeight: 1.2,
          }}>
            {s.value}
          </p>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '10px',
            fontWeight: 700,
            color: 'var(--ink-400)',
            margin: 0,
            letterSpacing: '0.03em',
            lineHeight: 1.2,
          }}>
            {s.label}
          </p>
        </div>
      ))}
    </div>
  )
}

function SuggestionCard({ todayLogs, onLogFeed }) {
  const { t, i18n } = useTranslation()

  const feeds = todayLogs.filter(l => l.type === 'feed').sort(
    (a, b) => new Date(b.logged_at) - new Date(a.logged_at),
  )
  const lastFeed = feeds[0]
  const msSinceLastFeed = lastFeed
    ? Date.now() - new Date(lastFeed.logged_at).getTime()
    : Infinity
  const showFeedSuggestion = msSinceLastFeed > 2.5 * 60 * 60 * 1000

  if (!showFeedSuggestion) return null

  const durationStr = lastFeed
    ? relativeTime(lastFeed.logged_at, i18n.language)
    : null

  return (
    <div style={{
      margin: '14px 20px 0',
      padding: '16px',
      background: 'var(--linen-50)',
      border: '1px solid var(--linen-200)',
      borderLeft: '3px solid var(--sage-500)',
      borderRadius: 'var(--r-lg)',
      display: 'flex',
      alignItems: 'flex-start',
      gap: 12,
    }}>
      <div style={{
        width: 36, height: 36, flexShrink: 0,
        borderRadius: 'var(--r-md)',
        background: 'var(--sage-50)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Clock size={16} color="var(--sage-700)" strokeWidth={2} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontFamily: 'var(--font-display)',
          fontSize: '15px',
          fontWeight: 500,
          color: 'var(--ink-900)',
          margin: '0 0 2px',
          fontOpticalSizing: 'auto',
        }}>
          {t('home.suggestion.feed_title')}
        </p>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-sm)',
          color: 'var(--ink-600)',
          margin: '0 0 10px',
        }}>
          {durationStr
            ? t('home.suggestion.feed_body', { duration: durationStr })
            : t('home.suggestion.feed_body', { duration: '—' })
          }
        </p>
        <button
          onClick={onLogFeed}
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '13px',
            fontWeight: 700,
            color: 'var(--sage-700)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          {t('home.suggestion.log_feed')}
        </button>
      </div>
    </div>
  )
}

function WeeklyChart({ weekLogs }) {
  const { t, i18n } = useTranslation()
  const bars = computeWeekBars(weekLogs, i18n.language)
  const maxCount = Math.max(...bars.map(b => b.count), 1)
  const totalFeeds = bars.reduce((acc, b) => acc + b.count, 0)
  const pastDays = bars.filter(b => !b.isFuture).length
  const avgFeeds = pastDays > 0 ? (totalFeeds / pastDays).toFixed(1) : 0

  return (
    <div style={{
      margin: '14px 20px 0',
      padding: '16px',
      background: 'var(--linen-50)',
      border: '1px solid var(--linen-200)',
      borderRadius: 'var(--r-lg)',
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-caption)',
          fontWeight: 700,
          color: 'var(--ink-600)',
          margin: 0,
        }}>
          {t('home.weekly_chart.label')}
        </p>
        {avgFeeds > 0 && (
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '11px',
            color: 'var(--ink-400)',
            margin: 0,
          }}>
            {t('home.weekly_chart.avg_feeds', { n: avgFeeds })}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 52 }}>
        {bars.map((bar) => {
          const barHeight = bar.count > 0
            ? Math.max(4, Math.round((bar.count / maxCount) * 40))
            : (bar.isFuture ? 0 : 2)
          const barColor = bar.isToday
            ? 'var(--sage-700)'
            : bar.isFuture
            ? 'var(--linen-200)'
            : 'var(--sage-500)'

          return (
            <div
              key={bar.dateStr}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}
            >
              <div style={{
                width: '100%',
                height: barHeight,
                background: barColor,
                borderRadius: 3,
                alignSelf: 'flex-end',
                transition: 'height 350ms var(--ease-default)',
              }} />
              <span style={{
                fontFamily: 'var(--font-body)',
                fontSize: '10px',
                fontWeight: bar.isToday ? 700 : 400,
                color: bar.isToday ? 'var(--sage-700)' : 'var(--ink-400)',
                lineHeight: 1,
              }}>
                {bar.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function MilestonePreview({ ageMonths }) {
  const { t } = useTranslation()
  const milestone = getNextMilestone(ageMonths)
  if (!milestone) return null

  return (
    <div style={{
      margin: '14px 20px 0',
      padding: '14px 16px',
      background: 'var(--peach-soft)',
      border: '1px solid var(--peach)',
      borderRadius: 'var(--r-lg)',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
    }}>
      <span style={{ fontSize: '22px', flexShrink: 0 }}>{milestone.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-sm)',
            fontWeight: 700,
            color: 'var(--ink-900)',
            margin: 0,
          }}>
            {t(milestone.labelKey)}
          </p>
          <span style={{
            fontFamily: 'var(--font-body)',
            fontSize: '10px',
            fontWeight: 700,
            color: 'var(--clay)',
            background: 'rgba(192, 135, 117, 0.12)',
            padding: '2px 6px',
            borderRadius: 'var(--r-xs)',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}>
            {t('home.coming_soon.soon_badge')}
          </span>
        </div>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: '12px',
          color: 'var(--ink-600)',
          margin: 0,
        }}>
          {t('home.suggestion.milestone_body', {
            name: t(milestone.labelKey),
            months: milestone.typicalMonths,
          })}
        </p>
      </div>
    </div>
  )
}

function TimelineGroupDivider({ label }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      margin: '20px 0 10px',
    }}>
      <LeafIllo style={{ width: 13, height: 16, flexShrink: 0 }} />
      <span style={{
        fontFamily: 'var(--font-body)',
        fontSize: '10px',
        fontWeight: 700,
        color: 'var(--ink-400)',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: 'var(--linen-200)' }} />
    </div>
  )
}

function TimelineEvent({ log }) {
  const { t, i18n } = useTranslation()
  const Icon = TYPE_ICON[log.type]
  const iconColor = TYPE_COLOR[log.type]
  const bgColor = TYPE_BG[log.type]
  const time = formatTime(log.logged_at, i18n.language)
  const metric = getLogMetric(log, t)
  const typeLabel = t(`quicklog.log_types.${log.type}`)

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 0,
      marginBottom: 10,
    }}>
      {/* Time rail */}
      <div style={{
        width: 52,
        flexShrink: 0,
        paddingTop: 14,
        textAlign: 'right',
        paddingRight: 8,
      }}>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: '11px',
          color: 'var(--ink-400)',
          fontVariantNumeric: 'tabular-nums',
          fontOpticalSizing: 'auto',
          lineHeight: 1.2,
          display: 'block',
        }}>
          {time}
        </span>
      </div>

      {/* Connector */}
      <div style={{
        width: 20,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: 17,
      }}>
        <div style={{
          width: 8, height: 8,
          borderRadius: '50%',
          background: iconColor,
          flexShrink: 0,
        }} />
      </div>

      {/* Event card */}
      <div style={{
        flex: 1,
        minWidth: 0,
        background: 'var(--linen-50)',
        border: '1px solid var(--linen-200)',
        borderRadius: 'var(--r-md)',
        padding: '11px 14px',
        cursor: 'pointer',
        transition: 'background var(--duration-fast) var(--ease-default)',
      }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--linen-100)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'var(--linen-50)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: metric !== '—' ? 4 : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 22, height: 22,
              borderRadius: 'var(--r-xs)',
              background: bgColor,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              {Icon && <Icon size={12} color={iconColor} strokeWidth={2.5} />}
            </div>
            <span style={{
              fontFamily: 'var(--font-body)',
              fontSize: '13px',
              fontWeight: 700,
              color: 'var(--ink-900)',
            }}>
              {typeLabel}
            </span>
          </div>
          <span style={{
            fontFamily: 'var(--font-body)',
            fontSize: '11px',
            color: 'var(--ink-400)',
            flexShrink: 0,
            marginLeft: 8,
          }}>
            {relativeTime(log.logged_at, i18n.language)}
          </span>
        </div>
        {metric !== '—' && (
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '13px',
            color: 'var(--ink-600)',
            margin: 0,
            paddingLeft: 28,
          }}>
            {metric}
          </p>
        )}
      </div>
    </div>
  )
}

function TodayTimeline({ todayLogs }) {
  const { t, i18n } = useTranslation()
  const groups = groupLogsByTimeOfDay(todayLogs, t)

  return (
    <div>
      {/* Section header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '28px 20px 4px',
      }}>
        <span style={{
          fontFamily: 'var(--font-body)',
          fontSize: '11px',
          fontWeight: 700,
          color: 'var(--ink-400)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}>
          {t('home.timeline.label')}
        </span>
        <span style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-caption)',
          color: 'var(--ink-400)',
        }}>
          {new Date().toLocaleDateString(
            i18n.language === 'vi' ? 'vi-VN' : 'en-GB',
            { weekday: 'short', day: 'numeric', month: 'short' },
          )}
        </span>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--linen-200)', margin: '12px 20px 0' }} />

      {/* Empty state */}
      {groups.length === 0 ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '48px 32px',
          gap: 16,
        }}>
          <SproutIllo style={{ width: 56, height: 70, opacity: 0.55 }} />
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-sm)',
            color: 'var(--ink-400)',
            textAlign: 'center',
            margin: 0,
            lineHeight: 1.6,
          }}>
            {t('home.timeline.empty')}
          </p>
        </div>
      ) : (
        <div style={{ padding: '0 20px 32px', position: 'relative' }}>
          {/* Vertical connector line */}
          <div style={{
            position: 'absolute',
            left: `${20 + 52 + 10}px`,
            top: 24,
            bottom: 32,
            width: 1,
            background: 'var(--linen-200)',
            pointerEvents: 'none',
          }} />

          {groups.map(group => (
            <div key={group.key}>
              <TimelineGroupDivider label={group.label} />
              {group.logs.map(log => (
                <TimelineEvent key={log.id} log={log} />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main screen ──────────────────────────────────────────────────

export default function HomeScreen() {
  const { i18n } = useTranslation()
  const { setQuickLogOpen } = useOutletContext()
  const { todayLogs, weekLogs, loading, error, reload } = useHomeData()
  const { months: ageMonths, days: ageDays } = getBabyAge()

  const { feedCount, totalSleepMins, lastDiaper } = computeVitals(todayLogs)

  const toggleLang = () => i18n.changeLanguage(i18n.language === 'en' ? 'vi' : 'en')

  return (
    <div style={{ minHeight: '100%', background: 'var(--app-bg)' }}>

      <StatusStrip onLangToggle={toggleLang} />

      <HeroBlock
        babyNickname={appConfig.baby.nickname}
        ageMonths={ageMonths}
        ageDays={ageDays}
        onLogPress={() => setQuickLogOpen(true)}
      />

      {/* Loading overlay */}
      {loading && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '24px 0',
        }}>
          <RefreshCw
            size={18}
            color="var(--ink-400)"
            strokeWidth={2}
            style={{ animation: 'spin 1s linear infinite' }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {!loading && (
        <>
          <VitalsRow
            feedCount={feedCount}
            totalSleepMins={totalSleepMins}
            lastDiaper={lastDiaper}
          />

          <SuggestionCard
            todayLogs={todayLogs}
            onLogFeed={() => setQuickLogOpen(true)}
          />

          <WeeklyChart weekLogs={weekLogs} />

          <MilestonePreview ageMonths={ageMonths} />

          <TodayTimeline todayLogs={todayLogs} />
        </>
      )}

      {error && (
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-sm)',
          color: 'var(--ink-400)',
          textAlign: 'center',
          padding: '0 20px 24px',
          margin: 0,
        }}>
          {error}
        </p>
      )}
    </div>
  )
}
