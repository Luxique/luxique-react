import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.ok || !auth.user) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { enrollmentId } = await request.json()
  if (typeof enrollmentId !== 'string' || !enrollmentId) return NextResponse.json({ error: 'Missing enrollmentId' }, { status: 400 })

  const releasedAt = new Date().toISOString()
  const { data, error } = await supabaseAdmin
    .from('enrollments')
    .update({ certificate_released_at: releasedAt, certificate_released_by: auth.user.id })
    .eq('id', enrollmentId)
    .not('completed_at', 'is', null)
    .select('id, certificate_released_at')
    .maybeSingle()

  if (error) return NextResponse.json({ error: 'Certificate release failed' }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Course must be completed before certificate release' }, { status: 409 })
  return NextResponse.json({ releasedAt: data.certificate_released_at })
}
