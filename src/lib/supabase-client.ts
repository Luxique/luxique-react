import { createClient, SupabaseClient } from '@supabase/supabase-js'

const REMEMBER_ME_KEY = 'luxique-remember-me'

const authStorage = {
  getItem(key: string) {
    if (typeof window === 'undefined') return null
    const remember = window.localStorage.getItem(REMEMBER_ME_KEY) !== 'false'
    return (remember ? window.localStorage : window.sessionStorage).getItem(key)
      ?? window.localStorage.getItem(key)
      ?? window.sessionStorage.getItem(key)
  },
  setItem(key: string, value: string) {
    if (typeof window === 'undefined') return
    const remember = window.localStorage.getItem(REMEMBER_ME_KEY) !== 'false'
    const selected = remember ? window.localStorage : window.sessionStorage
    const other = remember ? window.sessionStorage : window.localStorage
    selected.setItem(key, value)
    other.removeItem(key)
  },
  removeItem(key: string) {
    if (typeof window === 'undefined') return
    window.localStorage.removeItem(key)
    window.sessionStorage.removeItem(key)
  },
}

export function setRememberMe(remember: boolean) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(REMEMBER_ME_KEY, String(remember))
}

function makeClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  if (!url || !key) {
    return new Proxy({} as SupabaseClient, {
      get: () => () => Promise.resolve({ data: null, error: null })
    })
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true, storage: authStorage },
  })
}

let _client: SupabaseClient | null = null

export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    if (!_client) _client = makeClient()
    const value = Reflect.get(_client, prop)
    return typeof value === 'function' ? value.bind(_client!) : value
  },
})
