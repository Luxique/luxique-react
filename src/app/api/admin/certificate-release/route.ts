import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.ok || !auth.user) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { enrollmentId, released = true } = await request.json()
  if (typeof enrollmentId !== 'string' || !enrollmentId) return NextResponse.json({ error: 'Missing enrollmentId' }, { status: 400 })
  if (typeof released !== 'boolean') return NextResponse.json({ error: 'Invalid released state' }, { status: 400 })

  const nextRelease = released
    ? { certificate_released_at: new Date().toISOString(), certificate_released_by: auth.user.id }
    : { certificate_released_at: null, certificate_released_by: null }

  const updateQuery = supabaseAdmin
    .from('enrollments')
    .update(nextRelease)
    .eq('id', enrollmentId)
    .not('completed_at', 'is', null)

  const { data, error } = await updateQuery
    .select('id, certificate_released_at')
    .maybeSingle()

  if (error) return NextResponse.json({ error: released ? 'Certificate release failed' : 'Certificate revocation failed' }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Course must be completed before changing certificate release' }, { status: 409 })
  return NextResponse.json({ released: Boolean(data.certificate_released_at), releasedAt: data.certificate_released_at })
}
