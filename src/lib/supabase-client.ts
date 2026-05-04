import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
  cookies: {
    getAll() {
      return document.cookie.split('; ').map(c => {
        const [name, ...v] = c.split('=')
        return { name, value: v.join('=') }
      })
    },
    setAll(cookiesToSet) {
      cookiesToSet.forEach(({ name, value, options }) => {
        document.cookie = `${name}=${value}; path=${options?.path ?? '/'}; max-age=${options?.maxAge ?? 31536000}; same-site=${options?.sameSite ?? 'lax'}${options?.domain ? `; domain=${options.domain}` : ''}`
      })
    },
  },
})
