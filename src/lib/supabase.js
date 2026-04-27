import { createClient } from '@supabase/supabase-js'

// Normalize URL: trim whitespace, strip path components (e.g. /rest/v1), strip trailing slashes.
// All three cause "Invalid path specified in request URL" inside @supabase/auth-js.
const _rawUrl = (import.meta.env.VITE_SUPABASE_URL ?? '').trim()
const rawUrl = (() => {
  try {
    const u = new URL(_rawUrl)
    return `${u.protocol}//${u.host}`
  } catch {
    return _rawUrl.replace(/\/+$/, '')
  }
})()
const rawKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim()

const urlOk  = rawUrl.startsWith('https://')
const keyOk  = rawKey.length > 20

export const supabaseConfigured = urlOk && keyOk

export const supabase = supabaseConfigured
  ? createClient(rawUrl, rawKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null

// Dev-only hint — never shown in production UI
if (!supabaseConfigured && import.meta.env.DEV) {
  console.warn(
    '[Little Sprout] Supabase not configured.\n' +
    `  VITE_SUPABASE_URL  = "${rawUrl}" (needs https://...supabase.co)\n` +
    `  VITE_SUPABASE_ANON_KEY = "${rawKey ? '***' : '(empty)'}" (needs anon key)`
  )
}
