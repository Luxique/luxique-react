import { createClient, SupabaseClient } from '@supabase/supabase-js'

const getUrl = () => process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const getAnonKey = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const getServiceKey = () => process.env.SUPABASE_SERVICE_ROLE_KEY || ''

let _supabase: SupabaseClient | null = null
let _supabaseAdmin: SupabaseClient | null = null

export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    if (!_supabase) {
      _supabase = createClient(getUrl(), getAnonKey(), {
        auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true },
      })
    }
    return Reflect.get(_supabase, prop)
  },
})

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    if (!_supabaseAdmin) {
      _supabaseAdmin = createClient(getUrl(), getServiceKey(), {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    }
    return Reflect.get(_supabaseAdmin, prop)
  },
})
