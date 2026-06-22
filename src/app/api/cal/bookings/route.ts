import { NextResponse } from 'next/server'

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

    const bookings = data.data.bookings.map((b: Record<string, unknown>) => {
      const eventType = b.eventType as Record<string, unknown> | undefined
      const responses = b.responses as Record<string, unknown> | undefined
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
        eventTypeTitle: eventType?.title || 'Onbekend',
        eventTypeSlug: eventType?.slug || '',
        price: eventType?.price || 0,
        currency: eventType?.currency || 'eur',
        cancellationReason: b.cancellationReason,
        fromReschedule: b.fromReschedule,
      }
    })

    // Sort by startTime descending
    bookings.sort((a: { startTime: string }, b: { startTime: string }) =>
      new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    )

    return NextResponse.json({ bookings })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 })
  }
}
