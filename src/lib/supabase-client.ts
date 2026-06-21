// Lazy Supabase client — only loads @supabase/supabase-js when actually accessed
// This keeps it out of the initial bundle for pages that only use CDN URLs
import type { SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null

function getClient(): SupabaseClient {
  if (_client) return _client
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  if (!url || !key) {
    _client = new Proxy({}, {
      get: () => () => Promise.resolve({ data: null, error: null })
    }) as unknown as SupabaseClient
    return _client
  }
  const { createClient } = require('@supabase/supabase-js')
  _client = createClient(url, key) as SupabaseClient
  return _client
}

export const supabase: SupabaseClient = new Proxy({}, {
  get(_, prop) {
    const client = getClient()
    return Reflect.get(client, prop)
  },
}) as unknown as SupabaseClient
