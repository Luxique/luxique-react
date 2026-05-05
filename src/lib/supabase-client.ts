import { createClient, SupabaseClient } from '@supabase/supabase-js'

function makeClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  if (!url || !key) {
    return new Proxy({} as SupabaseClient, {
      get: () => () => Promise.resolve({ data: null, error: null })
    })
  }
  return createClient(url, key)
}

let _client: SupabaseClient | null = null

export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    if (!_client) _client = makeClient()
    return Reflect.get(_client, prop)
  },
})
