import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, supabaseConfigured } from '../lib/supabase.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // undefined = still loading, null = not signed in, object = signed in
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    // Skip if Supabase is not configured — stay in loading=false / session=null state
    if (!supabase) {
      setSession(null)
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ session, loading: session === undefined, supabase, supabaseConfigured }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
