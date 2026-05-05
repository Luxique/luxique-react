import { createClient, SupabaseClient } from '@supabase/supabase-js'

function getUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || ''
}
function getAnonKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
}
function getServiceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || ''
}

function makeClient(url: string, key: string, opts: object): SupabaseClient {
  if (!url || !key) {
    // Return a no-op proxy that won't crash during build/prerender
    return new Proxy({} as SupabaseClient, {
      get: () => () => Promise.resolve({ data: null, error: null })
    })
  }
  return createClient(url, key, opts)
}

let _supabase: SupabaseClient | null = null
let _supabaseAdmin: SupabaseClient | null = null

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

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    if (!_supabaseAdmin) {
      _supabaseAdmin = makeClient(getUrl(), getServiceKey(), {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    }
    return Reflect.get(_supabaseAdmin, prop)
  },
})
