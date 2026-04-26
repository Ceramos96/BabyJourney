// Timezone-aware date/time utilities.
// All display uses Asia/Ho_Chi_Minh. All storage is UTC.

import appConfig from '../config/app.config.js'

const TZ = appConfig.family.timezone

export function formatDate(date, lang = 'en') {
  const d = typeof date === 'string' ? new Date(date) : date
  if (lang === 'vi') {
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric', timeZone: TZ,
    })
  }
  return d.toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', timeZone: TZ,
  })
}

export function formatTime(date, lang = 'en') {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString(lang === 'vi' ? 'vi-VN' : 'en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: lang === 'en',
    timeZone: TZ,
  })
}

export function formatMonthYear(date, lang = 'en') {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-GB', {
    month: 'long', year: 'numeric', timeZone: TZ,
  })
}

export function toUTC(localISOString) {
  return new Date(localISOString).toISOString()
}

export function startOfDayUTC(tzDate) {
  const d = new Date(tzDate)
  const local = new Date(d.toLocaleString('en-US', { timeZone: TZ }))
  const diff = d - local
  const startLocal = new Date(local.getFullYear(), local.getMonth(), local.getDate())
  return new Date(startLocal.getTime() + diff).toISOString()
}

export function relativeTime(date, lang = 'en') {
  const diffMs = Date.now() - new Date(date).getTime()
  const diffMins = Math.floor(diffMs / 60_000)
  const diffHours = Math.floor(diffMins / 60)

  if (lang === 'vi') {
    if (diffMins < 1) return 'vừa xong'
    if (diffMins < 60) return `${diffMins} phút trước`
    if (diffHours < 24) return `${diffHours} giờ trước`
    return `${Math.floor(diffHours / 24)} ngày trước`
  }
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${Math.floor(diffHours / 24)}d ago`
}

export function getBabyAge(dob = appConfig.baby.dateOfBirth) {
  const birth = new Date(dob)
  const now = new Date()
  let months = (now.getFullYear() - birth.getFullYear()) * 12
    + (now.getMonth() - birth.getMonth())
  const dayOfMonth = now.getDate()
  const birthDay = birth.getDate()
  if (dayOfMonth < birthDay) months--
  const days = dayOfMonth >= birthDay
    ? dayOfMonth - birthDay
    : new Date(now.getFullYear(), now.getMonth(), 0).getDate() - birthDay + dayOfMonth
  return { months, days }
}

export function getTimeOfDay() {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 17) return 'afternoon'
  if (hour >= 17 && hour < 21) return 'evening'
  return 'night'
}
