import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = 'LUXIQUE <noreply@luxique.nl>'
const CHIVA_EMAIL = 'info@luxique.nl'
const STUDIO_ADDRESS = 'Venlosingel 166, 6845 JD Arnhem'

function formatDateNL(iso: string): string {
  return new Date(iso).toLocaleDateString('nl-NL', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function formatTimeNL(iso: string): string {
  return new Date(iso).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
}

interface BookingData {
  cal_booking_uid: string
  event_type: string
  slot_start: string
  amount_cents: number
  customer_name?: string | null
  customer_email?: string | null
}

async function markMailSent(bookingId: string, column: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  await supabase
    .from('pending_bookings')
    .update({ [column]: new Date().toISOString() })
    .eq('id', bookingId)
}

async function isMailAlreadySent(bookingId: string, column: string): Promise<boolean> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data } = await supabase
    .from('pending_bookings')
    .select(column)
    .eq('id', bookingId)
    .single()

  return !!data?.[column as keyof typeof data]
}

// ============================================================
// MAIL 1: Customer — payment confirmation
// ============================================================
export async function sendConfirmationEmail(bookingId: string, booking: BookingData) {
  try {
    if (await isMailAlreadySent(bookingId, 'confirmation_sent_at')) {
      console.log(`Mail: confirmation already sent for ${booking.cal_booking_uid}, skipping`)
      return
    }

    const date = formatDateNL(booking.slot_start)
    const time = formatTimeNL(booking.slot_start)
    const deposit = (booking.amount_cents / 100).toFixed(0)
    const remainder = deposit // 50/50 split

    const { error } = await resend.emails.send({
      from: FROM,
      to: booking.customer_email || '',
      subject: 'Je afspraak bij LUXIQUE is bevestigd ✨',
      html: `
        <div style="font-family:Georgia,'Times New Roman',serif;max-width:560px;margin:0 auto;background:#fffdf8;border:1px solid rgba(176,141,79,0.15);border-radius:16px;overflow:hidden">
          <div style="background:#f6f1e7;padding:28px 32px;text-align:center;border-bottom:1px solid rgba(176,141,79,0.15)">
            <span style="font-family:'Helvetica Neue',Arial,sans-serif;font-weight:300;letter-spacing:0.4em;font-size:15px;color:#1a1712">LUXIQUE</span>
          </div>
          <div style="padding:36px 32px">
            <h1 style="font-size:26px;font-weight:400;color:#1a1712;margin:0 0 20px">Je afspraak is bevestigd ✨</h1>
            <p style="font-size:16px;line-height:1.7;color:#3a3530;margin:0 0 24px">Wat fijn dat je voor LUXIQUE hebt gekozen. Je afspraak staat vast — hieronder vind je alle details.</p>
            <table style="width:100%;font-size:15px;line-height:1.8;color:#3a3530;margin-bottom:28px">
              <tr><td style="color:#9a9183;width:120px;vertical-align:top">Behandeling</td><td style="font-weight:500">${booking.event_type}</td></tr>
              <tr><td style="color:#9a9183;vertical-align:top">Datum</td><td>${date}</td></tr>
              <tr><td style="color:#9a9183;vertical-align:top">Tijd</td><td>${time} uur</td></tr>
              <tr><td style="color:#9a9183;vertical-align:top">Locatie</td><td>${STUDIO_ADDRESS}</td></tr>
            </table>
            <div style="background:rgba(176,141,79,0.08);border:1px solid rgba(176,141,79,0.2);border-radius:12px;padding:18px 20px;margin-bottom:28px">
              <p style="margin:0;font-size:15px;color:#3a3530">Je aanbetaling van <strong>€${deposit}</strong> is ontvangen. De resterende <strong>€${remainder}</strong> voldoe je in de studio, direct na je behandeling.</p>
            </div>
            <h2 style="font-size:18px;font-weight:400;color:#b08d4f;margin:0 0 12px">Kleine voorbereiding</h2>
            <p style="font-size:15px;line-height:1.7;color:#3a3530;margin:0 0 28px">Kom met schone wimpers — zonder mascara of olie-producten rond de ogen. Zo kunnen we direct aan de slag.</p>
            <p style="font-size:14px;line-height:1.7;color:#9a9183;margin:0;padding-top:20px;border-top:1px solid rgba(26,23,18,0.08)">Kun je toch niet? Je kunt tot 24 uur van tevoren kosteloos annuleren of verzetten — mail ons via <a href="mailto:info@luxique.nl" style="color:#b08d4f">info@luxique.nl</a>.</p>
          </div>
        </div>
      `,
    })

    if (error) {
      console.error(`Mail: confirmation FAILED for ${booking.cal_booking_uid}:`, error)
      return
    }

    await markMailSent(bookingId, 'confirmation_sent_at')
    console.log(`Mail: confirmation sent for ${booking.cal_booking_uid}`)
  } catch (err) {
    console.error(`Mail: confirmation error for ${booking.cal_booking_uid}:`, err)
  }
}

// ============================================================
// MAIL 2: Customer — reminder (~24h before)
// ============================================================
export async function sendReminderEmail(bookingId: string, booking: BookingData) {
  try {
    if (await isMailAlreadySent(bookingId, 'reminder_sent_at')) {
      console.log(`Mail: reminder already sent for ${booking.cal_booking_uid}, skipping`)
      return
    }

    const date = formatDateNL(booking.slot_start)
    const time = formatTimeNL(booking.slot_start)

    const { error } = await resend.emails.send({
      from: FROM,
      to: booking.customer_email || '',
      subject: 'Tot morgen bij LUXIQUE 💫',
      html: `
        <div style="font-family:Georgia,'Times New Roman',serif;max-width:560px;margin:0 auto;background:#fffdf8;border:1px solid rgba(176,141,79,0.15);border-radius:16px;overflow:hidden">
          <div style="background:#f6f1e7;padding:28px 32px;text-align:center;border-bottom:1px solid rgba(176,141,79,0.15)">
            <span style="font-family:'Helvetica Neue',Arial,sans-serif;font-weight:300;letter-spacing:0.4em;font-size:15px;color:#1a1712">LUXIQUE</span>
          </div>
          <div style="padding:36px 32px">
            <h1 style="font-size:26px;font-weight:400;color:#1a1712;margin:0 0 20px">Tot morgen bij LUXIQUE 💫</h1>
            <p style="font-size:16px;line-height:1.7;color:#3a3530;margin:0 0 24px">We kijken ernaar uit om je te verwelkomen. Hier is een korte herinnering met alle details.</p>
            <table style="width:100%;font-size:15px;line-height:1.8;color:#3a3530;margin-bottom:28px">
              <tr><td style="color:#9a9183;width:120px;vertical-align:top">Behandeling</td><td style="font-weight:500">${booking.event_type}</td></tr>
              <tr><td style="color:#9a9183;vertical-align:top">Datum</td><td>${date}</td></tr>
              <tr><td style="color:#9a9183;vertical-align:top">Tijd</td><td>${time} uur</td></tr>
              <tr><td style="color:#9a9183;vertical-align:top">Locatie</td><td>${STUDIO_ADDRESS}</td></tr>
            </table>
            <h2 style="font-size:18px;font-weight:400;color:#b08d4f;margin:0 0 12px">Kleine voorbereiding</h2>
            <p style="font-size:15px;line-height:1.7;color:#3a3530;margin:0 0 28px">Kom met schone wimpers — zonder mascara of olie-producten rond de ogen.</p>
            <p style="font-size:14px;line-height:1.7;color:#9a9183;margin:0;padding-top:20px;border-top:1px solid rgba(26,23,18,0.08)">Kun je onverhoopt niet? Laat het ons z.s.m. weten via <a href="mailto:info@luxique.nl" style="color:#b08d4f">info@luxique.nl</a>.</p>
          </div>
        </div>
      `,
    })

    if (error) {
      console.error(`Mail: reminder FAILED for ${booking.cal_booking_uid}:`, error)
      return
    }

    await markMailSent(bookingId, 'reminder_sent_at')
    console.log(`Mail: reminder sent for ${booking.cal_booking_uid}`)
  } catch (err) {
    console.error(`Mail: reminder error for ${booking.cal_booking_uid}:`, err)
  }
}

// ============================================================
// MAIL 3: Chiva — new paid booking notification
// ============================================================
export async function sendNewBookingNotification(booking: BookingData) {
  try {
    const date = formatDateNL(booking.slot_start)
    const time = formatTimeNL(booking.slot_start)
    const deposit = (booking.amount_cents / 100).toFixed(0)
    const remainder = deposit

    const { error } = await resend.emails.send({
      from: FROM,
      to: CHIVA_EMAIL,
      subject: `Nieuwe boeking — ${booking.event_type} op ${date}`,
      html: `
        <div style="font-family:Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;background:#fffdf8;border:1px solid rgba(176,141,79,0.15);border-radius:16px;overflow:hidden">
          <div style="background:#f6f1e7;padding:24px 32px;border-bottom:1px solid rgba(176,141,79,0.15)">
            <span style="font-weight:300;letter-spacing:0.4em;font-size:15px;color:#1a1712">LUXIQUE — NIEUWE BOEKING</span>
          </div>
          <div style="padding:32px">
            <table style="width:100%;font-size:15px;line-height:1.8;color:#3a3530">
              <tr><td style="color:#9a9183;width:120px;vertical-align:top">Klant</td><td style="font-weight:500">${booking.customer_name || 'Onbekend'}</td></tr>
              <tr><td style="color:#9a9183;vertical-align:top">E-mail</td><td>${booking.customer_email || 'Onbekend'}</td></tr>
              <tr><td style="color:#9a9183;vertical-align:top">Behandeling</td><td>${booking.event_type}</td></tr>
              <tr><td style="color:#9a9183;vertical-align:top">Wanneer</td><td>${date} om ${time} uur</td></tr>
              <tr><td style="color:#9a9183;vertical-align:top">Aanbetaling</td><td style="color:#5b8c66;font-weight:600">€${deposit} ontvangen</td></tr>
              <tr><td style="color:#9a9183;vertical-align:top">Rest in studio</td><td>€${remainder}</td></tr>
            </table>
          </div>
        </div>
      `,
    })

    if (error) {
      console.error(`Mail: Chiva notification FAILED:`, error)
      return
    }

    console.log(`Mail: Chiva notified of new booking ${booking.cal_booking_uid}`)
  } catch (err) {
    console.error(`Mail: Chiva notification error:`, err)
  }
}

// ============================================================
// MAIL 4: Chiva — booking expired without payment
// ============================================================
export async function sendExpiredNotification(booking: BookingData) {
  try {
    const date = formatDateNL(booking.slot_start)
    const time = formatTimeNL(booking.slot_start)

    const { error } = await resend.emails.send({
      from: FROM,
      to: CHIVA_EMAIL,
      subject: `Boeking verlopen — slot weer vrij (${booking.event_type} op ${date})`,
      html: `
        <div style="font-family:Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;background:#fffdf8;border:1px solid rgba(176,141,79,0.15);border-radius:16px;overflow:hidden">
          <div style="background:#f6f1e7;padding:24px 32px;border-bottom:1px solid rgba(176,141,79,0.15)">
            <span style="font-weight:300;letter-spacing:0.4em;font-size:15px;color:#1a1712">LUXIQUE — BOEKING VERVALLEN</span>
          </div>
          <div style="padding:32px">
            <p style="font-size:15px;line-height:1.7;color:#3a3530;margin:0 0 20px">Een boeking is verlopen zonder aanbetaling. Het tijdslot is automatisch vrijgegeven.</p>
            <table style="width:100%;font-size:15px;line-height:1.8;color:#3a3530">
              <tr><td style="color:#9a9183;width:120px;vertical-align:top">Behandeling</td><td>${booking.event_type}</td></tr>
              <tr><td style="color:#9a9183;vertical-align:top">Wanneer</td><td>${date} om ${time} uur</td></tr>
            </table>
            <p style="font-size:14px;color:#9a9183;margin-top:20px">Dit is puur informatief — er is geen actie nodig.</p>
          </div>
        </div>
      `,
    })

    if (error) {
      console.error(`Mail: expired notification FAILED:`, error)
      return
    }

    console.log(`Mail: Chiva notified of expired booking ${booking.cal_booking_uid}`)
  } catch (err) {
    console.error(`Mail: expired notification error:`, err)
  }
}

// Helper to fetch booking + customer info from Cal API
export async function getBookingWithCustomerFromCal(uid: string): Promise<BookingData | null> {
  try {
    const res = await fetch(`https://api.cal.com/v2/bookings?uid=${uid}`, {
      headers: { Authorization: `Bearer ${process.env.CAL_API_KEY}` },
    })
    const data: { bookings?: Array<{ eventType?: { title?: string }; title?: string; startTime?: string; responses?: { name?: string; email?: string } }> } = await res.json()
    const b = data?.bookings?.[0]
    if (!b) return null

    return {
      cal_booking_uid: uid,
      event_type: b.eventType?.title || b.title || 'Behandeling',
      slot_start: b.startTime || new Date().toISOString(),
      amount_cents: 0, // Will be set from DB
      customer_name: b.responses?.name || null,
      customer_email: b.responses?.email || null,
    }
  } catch {
    return null
  }
}
