import { createClient } from '@supabase/supabase-js'

const rawUrl = import.meta.env.VITE_SUPABASE_URL ?? ''
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

// URL must start with https:// — missing this is the most common Vercel mis-config.
// We never throw at module level; instead export a flag so the app can show a setup screen.
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
