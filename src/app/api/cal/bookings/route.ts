import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { MANUAL_TREATMENTS, type ManualTreatmentKey } from '@/lib/manual-bookings'

export const dynamic = 'force-dynamic'

export async function GET() {
  const apiKey = process.env.CAL_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Missing CAL_API_KEY' }, { status: 500 })
  }

  try {
    const res = await fetch('https://api.cal.com/v2/bookings?limit=50', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'cal-api-version': '2024-09-10',
      },
    })
    const data = await res.json()

    if (!data.data?.bookings) {
      return NextResponse.json({ error: 'Invalid response from cal.com' }, { status: 500 })
    }

    const manualEventTypeIds = new Set([
      Number(process.env.CAL_MANUAL_NEW_LASH_EVENT_TYPE_ID || 0),
      Number(process.env.CAL_MANUAL_FILL_LASH_EVENT_TYPE_ID || 0),
    ].filter(Boolean))
    const calBookings = data.data.bookings.map((b: Record<string, unknown>) => {
      const eventType = b.eventType as Record<string, unknown> | undefined
      const responses = b.responses as Record<string, unknown> | undefined
      const metadata = b.metadata as Record<string, unknown> | undefined
      const eventTypeId = Number(eventType?.id || b.eventTypeId || 0)
      const isManual = manualEventTypeIds.has(eventTypeId) || metadata?.source === 'luxique-manual'
      return {
        id: b.id,
        uid: b.uid,
        title: b.title,
        status: b.status,
        startTime: b.startTime,
        endTime: b.endTime,
        location: b.location,
        paid: b.paid,
        customerName: responses?.name || 'Onbekend',
        customerEmail: responses?.email || '',
        customerPhone: responses?.phone || responses?.phoneNumber || '',
        eventTypeId,
        source: isManual ? 'manual' : 'online',
        eventTypeTitle: eventType?.title || 'Onbekend',
        eventTypeSlug: eventType?.slug || '',
        price: eventType?.price || 0,
        currency: eventType?.currency || 'eur',
        cancellationReason: b.cancellationReason,
        fromReschedule: b.fromReschedule,
      }
    })

    // Hidden Cal.com event types are omitted from the bookings listing. Merge the
    // dedicated table so confirmed manual bookings always remain visible in admin.
    const { data: manualRows, error: manualError } = await supabaseAdmin
      .from('manual_bookings')
      .select('id, cal_booking_uid, event_type_id, treatment_key, slot_start, slot_end, status, user_id')
      .eq('status', 'confirmed')
      .order('slot_start', { ascending: false })

    if (manualError) {
      console.error('[cal-bookings] manual bookings query failed:', manualError)
      return NextResponse.json({ error: 'Failed to fetch manual bookings' }, { status: 500 })
    }

    const userIds = Array.from(new Set(
      (manualRows || []).map(row => row.user_id).filter((id): id is string => Boolean(id)),
    ))
    const { data: profiles, error: profilesError } = userIds.length > 0
      ? await supabaseAdmin.from('profiles').select('id, email, full_name, phone').in('id', userIds)
      : { data: [], error: null }

    if (profilesError) {
      console.error('[cal-bookings] manual booking profiles query failed:', profilesError)
      return NextResponse.json({ error: 'Failed to fetch manual booking customers' }, { status: 500 })
    }

    const profilesById = new Map((profiles || []).map(profile => [profile.id, profile]))
    const manualBookings = (manualRows || []).map(row => {
      const profile = profilesById.get(row.user_id)
      const treatment = MANUAL_TREATMENTS[row.treatment_key as ManualTreatmentKey]
      return {
        id: row.id,
        uid: row.cal_booking_uid,
        title: treatment?.name || 'Behandeling',
        status: row.status,
        startTime: row.slot_start,
        endTime: row.slot_end,
        location: null,
        paid: false,
        customerName: profile?.full_name || profile?.email || 'Onbekend',
        customerEmail: profile?.email || '',
        customerPhone: profile?.phone || '',
        eventTypeId: row.event_type_id,
        source: 'manual' as const,
        eventTypeTitle: treatment?.name || 'Behandeling',
        eventTypeSlug: '',
        price: 0,
        currency: 'eur',
        cancellationReason: null,
        fromReschedule: null,
      }
    })

    // The database is authoritative for manual bookings. UID-based replacement
    // prevents duplicates if Cal.com starts returning hidden event types later.
    const bookingsByUid = new Map<string, Record<string, unknown>>(
      calBookings.map((booking: Record<string, unknown>) => [String(booking.uid), booking]),
    )
    for (const booking of manualBookings) bookingsByUid.set(String(booking.uid), booking)
    const bookings = Array.from(bookingsByUid.values())

    // Sort by startTime descending
    bookings.sort((a, b) =>
      new Date(String(b.startTime)).getTime() - new Date(String(a.startTime)).getTime()
    )

    return NextResponse.json({ bookings })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 })
  }
}
