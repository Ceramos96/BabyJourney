// src/config/app.config.js
// ─────────────────────────────────────────────────────────────────
// LITTLE SPROUT — USER CONFIGURATION
// All personal, family, and app-level values live here.
// Every component imports from this file — never hardcode any of
// these values directly inside a component.
//
// To update: tell Claude Code "Update app.config.js: change [field]
// to [value]" — one file, all screens update automatically.
// ─────────────────────────────────────────────────────────────────

const appConfig = {

  // ── Baby ────────────────────────────────────────────────────────
  baby: {
    firstName:         'Minh Khang',
    fullName:          'Trần Minh Khang',
    nickname:          'Khang',
    dateOfBirth:       '2025-10-26',        // ISO YYYY-MM-DD — drives age calculator + WHO chart
    gender:            'male',              // 'male' | 'female' | 'other'
    bloodType:         '',                  // optional — e.g. 'O+'
    avatarPlaceholder: '🌱',               // shown before a profile photo is uploaded
  },

  // ── Family ──────────────────────────────────────────────────────
  family: {
    name:       'Nhà Trần',                 // displayed on shared/Family screens
    ownerName:  'Ba',                       // how the Owner is referred to (Ba = Dad)
    timezone:   'Asia/Ho_Chi_Minh',        // used for ALL date/time display + chart grouping
    locale: {
      default:      'en',                   // 'en' | 'vi' — starting language
      dateFormatEN: 'DD MMM YYYY',          // e.g. 26 Oct 2025
      dateFormatVI: 'DD/MM/YYYY',           // e.g. 26/10/2025
      timeFormatEN: '12h',                  // '12h' | '24h'
      timeFormatVI: '24h',
    },
  },

  // ── Growth ──────────────────────────────────────────────────────
  growth: {
    weightUnit:  'kg',                      // 'kg' | 'lb'
    heightUnit:  'cm',                      // 'cm' | 'in'
    whoStandard: 'male',                    // WHO percentile chart: 'male' | 'female'
  },

  // ── App ─────────────────────────────────────────────────────────
  app: {
    name:       'Little Sprout',
    taglineEN:  'Every little moment.',
    taglineVI:  'Từng khoảnh khắc nhỏ.',
    themeColor: '#6B7A4F',                  // sage-700 — browser theme-color meta tag
    appId:      'com.nhatran.littlesprout', // Capacitor / app store bundle ID
  },

};

export default appConfig;

// ─────────────────────────────────────────────────────────────────
// Age utility — use this in components, don't calculate inline
// ─────────────────────────────────────────────────────────────────
export function getBabyAge(dob = appConfig.baby.dateOfBirth) {
  const birth = new Date(dob);
  const now   = new Date();
  let months  = (now.getFullYear() - birth.getFullYear()) * 12
                + (now.getMonth() - birth.getMonth());
  const dayOfMonth = now.getDate();
  const birthDay   = birth.getDate();
  if (dayOfMonth < birthDay) months--;
  const days = dayOfMonth >= birthDay
    ? dayOfMonth - birthDay
    : new Date(now.getFullYear(), now.getMonth(), 0).getDate() - birthDay + dayOfMonth;
  return { months, days };
}

// ─────────────────────────────────────────────────────────────────
// Greeting utility — contextual by time of day
// ─────────────────────────────────────────────────────────────────
export function getGreeting(ownerName = appConfig.family.ownerName) {
  const hour = new Date().getHours();
  if (hour >= 5  && hour < 12) return `Good morning, ${ownerName} 👋`;
  if (hour >= 12 && hour < 17) return `Good afternoon, ${ownerName} 👋`;
  if (hour >= 17 && hour < 21) return `Good evening, ${ownerName} 👋`;
  return `Good night, ${ownerName} 🌙`;
}

export function getGreetingVI(ownerName = appConfig.family.ownerName) {
  const hour = new Date().getHours();
  if (hour >= 5  && hour < 12) return `Chào buổi sáng, ${ownerName} 👋`;
  if (hour >= 12 && hour < 17) return `Chào buổi chiều, ${ownerName} 👋`;
  if (hour >= 17 && hour < 21) return `Chào buổi tối, ${ownerName} 👋`;
  return `Chúc ngủ ngon, ${ownerName} 🌙`;
}
