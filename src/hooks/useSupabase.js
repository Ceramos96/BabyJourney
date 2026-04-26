// Thin wrapper around the supabase client for ad-hoc queries in screens.
// For auth state, use useAuth() from AuthContext instead.
import { supabase } from '../lib/supabase.js'

export function useSupabase() {
  return { supabase }
}
