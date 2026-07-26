/**
 * Admin auth helper — haalt user + role op uit JWT.
 * Gebruikt in alle /api/admin/* routes.
 */

import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'

export interface AdminAuthResult {
  ok: boolean
  status?: number
  error?: string
  user?: { id: string; email?: string }
}

/**
 * Verifies JWT and checks profiles.role === 'admin'.
 * Returns { ok: true, user } if admin, else { ok: false, status, error }.
 */
export async function requireAdmin(req: NextRequest): Promise<AdminAuthResult> {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return { ok: false, status: 401, error: 'Unauthorized' }
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: userError } = await supabase.auth.getUser(token)
  if (userError || !user) {
    return { ok: false, status: 401, error: 'Invalid token' }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile || profile.role !== 'admin') {
    return { ok: false, status: 403, error: 'Admin access required' }
  }

  return { ok: true, user: { id: user.id, email: user.email } }
}
