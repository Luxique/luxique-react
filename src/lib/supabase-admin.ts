import { createClient, SupabaseClient } from '@supabase/supabase-js'

// This module should ONLY be imported from server-side code (API routes, server components).
// It will fail at build time if imported from a 'use client' component.

function getServiceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || ''
}

function getUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || ''
}

let _admin: SupabaseClient | null = null

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    if (!_admin) {
      _admin = createClient(getUrl(), getServiceKey(), {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    }
    return Reflect.get(_admin, prop)
  },
})
