import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

/**
 * Links a pending_booking to the logged-in user's user_id.
 * Called when the user lands on /boeking/betalen?uid=xxx
 * The user is authenticated — we get their JWT from the Authorization header.
 * This is the SOLE mechanism that sets user_id — it cannot come from Cal.com.
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: userError } = await supabase.auth.getUser(token)
  if (userError || !user) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  const { uid } = await request.json()
  if (!uid) {
    return NextResponse.json({ error: 'Missing uid' }, { status: 400 })
  }

  // Stamp user_id onto the booking — ONLY if not already set (don't overwrite)
  const { data: booking, error } = await supabase
    .from('pending_bookings')
    .select('id, user_id, status')
    .eq('cal_booking_uid', uid)
    .single()

  if (error || !booking) {
    // Booking might not exist yet (webhook race) — return OK, caller will retry
    return NextResponse.json({ ok: false, reason: 'booking_not_found' })
  }

  if (booking.user_id && booking.user_id !== user.id) {
    // Booking already linked to a different user — security concern
    console.error('CRITICAL: booking already linked to different user', {
      uid, existing: booking.user_id, attempted: user.id
    })
    return NextResponse.json({ error: 'Booking belongs to another user' }, { status: 403 })
  }

  if (booking.user_id === user.id) {
    // Already linked to this user — idempotent
    return NextResponse.json({ ok: true, already_linked: true })
  }

  // Stamp user_id
  const { error: updateError } = await supabase
    .from('pending_bookings')
    .update({ user_id: user.id })
    .eq('id', booking.id)
    .is('user_id', null) // optimistic concurrency — only if not yet set

  if (updateError) {
    console.error('CRITICAL: Failed to stamp user_id on booking', uid, updateError)
    return NextResponse.json({ error: 'Failed to link booking' }, { status: 500 })
  }

  console.log(`✅ Booking ${uid} linked to user ${user.id}`)
  return NextResponse.json({ ok: true, linked: true })
}
