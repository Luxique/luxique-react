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

  // Dynamic import creates a separate chunk
  const { createClient } = require('@supabase/supabase-js') as typeof import('@supabase/supabase-js')
  _client = createClient(url, key) as SupabaseClient
  return _client
}

export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    const client = getClient()
    const value = Reflect.get(client, prop)
    return typeof value === 'function' ? value.bind(client) : value
  },
})
