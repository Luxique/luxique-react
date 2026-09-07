import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { MANUAL_TREATMENTS, type ManualTreatmentKey } from '@/lib/manual-bookings'
import { isCancelledCalStatus } from '@/lib/cal-cancellation'
import { canonicalCustomerEmail } from '@/lib/customer-email'
import { reconcileManualBookingUids } from '@/lib/manual-booking-reconciliation'

export const dynamic = 'force-dynamic'

function normalizeCustomerField(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (!value || Array.isArray(value) || typeof value !== 'object') return ''

  const field = value as Record<string, unknown>
  const firstName = typeof field.firstName === 'string' ? field.firstName.trim() : ''
  const lastName = typeof field.lastName === 'string' ? field.lastName.trim() : ''
  const fullName = [firstName, lastName].filter(Boolean).join(' ')
  if (fullName) return fullName

  return typeof field.value === 'string' ? field.value.trim() : ''
}

export async function GET() {
  const apiKey = process.env.CAL_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Missing CAL_API_KEY' }, { status: 500 })
  }

  try {
    const res = await fetch('https://api.cal.com/v2/bookings?limit=50', {
      cache: 'no-store',
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
    const calBookings = data.data.bookings.filter((b: Record<string, unknown>) =>
      !isCancelledCalStatus(b.status)
    ).map((b: Record<string, unknown>) => {
      const eventType = b.eventType as Record<string, unknown> | undefined
      const responses = b.responses as Record<string, unknown> | undefined
      const metadata = b.metadata as Record<string, unknown> | undefined
      const attendees = Array.isArray(b.attendees) ? b.attendees : []
      const primaryAttendee = attendees[0] && typeof attendees[0] === 'object'
        ? attendees[0] as Record<string, unknown>
        : undefined
      const eventTypeId = Number(eventType?.id || b.eventTypeId || 0)
      const isManual = manualEventTypeIds.has(eventTypeId) || metadata?.source === 'luxique-manual'
      const customerName = normalizeCustomerField(responses?.name)
        || normalizeCustomerField(primaryAttendee?.name)
        || 'Onbekend'
      const customerEmail = normalizeCustomerField(responses?.email)
        || normalizeCustomerField(primaryAttendee?.email)
      const customerPhone = normalizeCustomerField(responses?.phone)
        || normalizeCustomerField(responses?.phoneNumber)
        || normalizeCustomerField(primaryAttendee?.phoneNumber)
        || normalizeCustomerField(primaryAttendee?.phone)
      return {
        id: b.id,
        uid: b.uid,
        title: b.title,
        status: b.status,
        startTime: b.startTime,
        endTime: b.endTime,
        location: b.location,
        paid: b.paid,
        customerName,
        customerEmail,
        customerPhone,
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

    // Cal may replace the attendee email with a phone-number gateway address.
    // Resolve linked online bookings back to profiles.email before exposing them.
    const calBookingUids = calBookings.map((booking: Record<string, unknown>) => String(booking.uid)).filter(Boolean)
    const { data: onlineIdentityRows, error: onlineIdentityError } = calBookingUids.length > 0
      ? await supabaseAdmin.from('pending_bookings').select('cal_booking_uid, user_id').in('cal_booking_uid', calBookingUids)
      : { data: [], error: null }
    if (onlineIdentityError) {
      console.error('[cal-bookings] online booking identities query failed:', onlineIdentityError)
      return NextResponse.json({ error: 'Failed to resolve booking customers' }, { status: 500 })
    }
    const onlineUserIds = Array.from(new Set(
      (onlineIdentityRows || []).map(row => row.user_id).filter((id): id is string => Boolean(id)),
    ))
    const { data: onlineProfiles, error: onlineProfilesError } = onlineUserIds.length > 0
      ? await supabaseAdmin.from('profiles').select('id, email').in('id', onlineUserIds)
      : { data: [], error: null }
    if (onlineProfilesError) {
      console.error('[cal-bookings] online booking profiles query failed:', onlineProfilesError)
      return NextResponse.json({ error: 'Failed to resolve booking customer profiles' }, { status: 500 })
    }
    const onlineUserIdByUid = new Map((onlineIdentityRows || []).map(row => [String(row.cal_booking_uid), row.user_id]))
    const onlineProfileEmailById = new Map((onlineProfiles || []).map(profile => [profile.id, profile.email]))
    const sanitizedCalBookings = calBookings.map((booking: Record<string, unknown>) => ({
      ...booking,
      customerEmail: canonicalCustomerEmail({
        profileEmail: onlineProfileEmailById.get(onlineUserIdByUid.get(String(booking.uid))),
        bookingEmail: booking.customerEmail,
      }) || '',
    }))

    // Hidden Cal.com event types are omitted from the bookings listing. Merge the
    // dedicated table so confirmed manual bookings always remain visible in admin.
    const { data: manualRows, error: manualError } = await supabaseAdmin
      .from('manual_bookings')
      .select('id, cal_booking_uid, event_type_id, treatment_key, slot_start, slot_end, status, user_id')
      .in('status', ['confirmed', 'cancellation_pending'])
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
      const customerEmail = canonicalCustomerEmail({ profileEmail: profile?.email }) || ''
      return {
        id: row.id,
        uid: row.cal_booking_uid,
        title: treatment?.name || 'Behandeling',
        status: row.status,
        startTime: row.slot_start,
        endTime: row.slot_end,
        location: null,
        paid: false,
        customerName: normalizeCustomerField(profile?.full_name) || customerEmail || 'Onbekend',
        customerEmail,
        customerPhone: normalizeCustomerField(profile?.phone),
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
    // A cancelled manual booking remains present in Cal's list for a short time in
    // some cases. The local cancellation record is authoritative: use its Cal UID
    // as a tombstone so the stale provider entry cannot reappear in the agenda.
    const { data: cancelledManualBookings, error: cancelledManualError } = calBookingUids.length > 0
      ? await supabaseAdmin
          .from('manual_bookings')
          .select('cal_booking_uid')
          .eq('status', 'cancelled')
          .in('cal_booking_uid', calBookingUids)
      : { data: [], error: null }
    if (cancelledManualError) {
      console.error('[cal-bookings] cancelled manual booking tombstones query failed:', cancelledManualError)
      return NextResponse.json({ error: 'Failed to reconcile cancelled manual bookings' }, { status: 500 })
    }
    const bookingsByUid = reconcileManualBookingUids(
      sanitizedCalBookings,
      manualBookings,
      (cancelledManualBookings || []).map(row => row.cal_booking_uid),
    )

    const { data: nonActiveOnlineBookings } = await supabaseAdmin
      .from('pending_bookings')
      .select('cal_booking_uid, status')
      .in('status', ['cancelled', 'cancellation_pending'])
    for (const row of nonActiveOnlineBookings || []) {
      const existing = bookingsByUid.get(String(row.cal_booking_uid))
      if (row.status === 'cancelled') bookingsByUid.delete(String(row.cal_booking_uid))
      else if (existing) bookingsByUid.set(String(row.cal_booking_uid), { ...existing, status: 'cancellation_pending' })
    }
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
