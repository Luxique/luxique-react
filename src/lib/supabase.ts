import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Client-safe Supabase instance (anon key only).
// For admin/service-role access, import from '@/lib/supabase-admin' (server-side only).

function getUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || ''
}
function getAnonKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
}

function makeClient(url: string, key: string, opts: object): SupabaseClient {
  if (!url || !key) {
    return new Proxy({} as SupabaseClient, {
      get: () => () => Promise.resolve({ data: null, error: null })
    })
  }
  return createClient(url, key, opts)
}

let _supabase: SupabaseClient | null = null

export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    if (!_supabase) {
      _supabase = makeClient(getUrl(), getAnonKey(), {
        auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true },
      })
    }
    return Reflect.get(_supabase, prop)
  },
})
