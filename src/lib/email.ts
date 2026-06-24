import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = 'LUXIQUE <noreply@luxique.nl>'
const CHIVA_EMAIL = 'info@luxique.nl'
const STUDIO_ADDRESS = 'Venlosingel 166, 6845 JD Arnhem'

function formatDateEN(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function formatTimeEN(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

interface BookingData {
  id?: string
  cal_booking_uid: string
  event_type: string
  slot_start: string
  amount_cents: number
  status?: string
  customer_name?: string | null
  customer_email?: string | null
  user_id?: string | null
}

async function getAccountEmail(userId: string | null | undefined, fallback: string | null | undefined): Promise<string | null> {
  if (!userId) return fallback || null
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data: authUser } = await supabase.auth.admin.getUserById(userId)
  return authUser?.user?.email || fallback || null
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

    // Send to ACCOUNT email (via user_id), never the Cal-typed email
    const accountEmail = await getAccountEmail(booking.user_id, booking.customer_email)
    if (!accountEmail) {
      console.error('Mail: no account email found for booking', booking.cal_booking_uid, 'user_id:', booking.user_id)
      return
    }

    const date = formatDateEN(booking.slot_start)
    const time = formatTimeEN(booking.slot_start)
    const deposit = (booking.amount_cents / 100).toFixed(0)
    const remainder = deposit // 50/50 split

    // Build manage booking URL (dashboard with bookings tab)
    const manageUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?tab=boekingen`

    const { error } = await resend.emails.send({
      from: FROM,
      to: accountEmail,
      subject: 'Your Luxique appointment is confirmed',
      html: `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>Your appointment is confirmed</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0; padding:0; background-color:#e8e6e1; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;">
<div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">Your Luxique appointment is confirmed — see the details inside.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#e8e6e1;">
  <tr><td align="center" style="padding:40px 16px;">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px; max-width:600px; background-color:#FAF8F4; border-radius:14px; overflow:hidden;">
      <tr><td align="center" style="background-color:#0C0A07; padding:38px 40px 30px 40px;">
        <img src="https://luxique.nl/lxq-email-logo.png" width="132" alt="LUXIQUE" style="display:block; width:132px; max-width:132px; height:auto; border:0;">
      </td></tr>
      <tr><td style="height:2px; line-height:2px; font-size:0; background-color:#C4A265;">&nbsp;</td></tr>
      <tr><td style="padding:44px 48px 36px 48px;" align="center">
        <div style="font-family:Arial, Helvetica, sans-serif; font-size:11px; letter-spacing:3px; text-transform:uppercase; color:#C4A265; padding-bottom:18px;">Appointment confirmed</div>
        <div style="font-family:'Cormorant Garamond', Georgia, 'Times New Roman', serif; font-size:34px; line-height:42px; font-weight:500; color:#0C0A07; padding-bottom:20px;">You're booked in</div>
        <div style="font-family:Arial, Helvetica, sans-serif; font-size:16px; line-height:26px; color:#4a463e; padding-bottom:24px; max-width:440px; margin:0 auto;">Your appointment is confirmed — we can't wait to see you. Here are your details:</div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3efe7; border-radius:10px; margin:0 0 26px 0;">
          <tr><td style="padding:22px 26px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="font-family:Arial,sans-serif; font-size:11px; letter-spacing:1.5px; text-transform:uppercase; color:#9a958b; padding:0 0 3px 0;">Treatment</td></tr>
              <tr><td style="font-family:'Cormorant Garamond',Georgia,serif; font-size:19px; color:#0C0A07; padding:0 0 14px 0;">${booking.event_type}</td></tr>
              <tr><td style="font-family:Arial,sans-serif; font-size:11px; letter-spacing:1.5px; text-transform:uppercase; color:#9a958b; padding:0 0 3px 0;">Date &amp; time</td></tr>
              <tr><td style="font-family:'Cormorant Garamond',Georgia,serif; font-size:19px; color:#0C0A07; padding:0 0 14px 0;">${date} &middot; ${time}</td></tr>
              <tr><td style="font-family:Arial,sans-serif; font-size:11px; letter-spacing:1.5px; text-transform:uppercase; color:#9a958b; padding:0 0 3px 0;">Location</td></tr>
              <tr><td style="font-family:'Cormorant Garamond',Georgia,serif; font-size:19px; color:#0C0A07; padding:0 0 14px 0;">${STUDIO_ADDRESS}</td></tr>
              <tr><td style="font-family:Arial,sans-serif; font-size:11px; letter-spacing:1.5px; text-transform:uppercase; color:#9a958b; padding:0 0 3px 0;">Deposit paid</td></tr>
              <tr><td style="font-family:'Cormorant Garamond',Georgia,serif; font-size:19px; color:#0C0A07; padding:0 0 14px 0;">&euro;${deposit} (50%)</td></tr>
            </table>
          </td></tr>
        </table>
        <div style="font-family:Arial, Helvetica, sans-serif; font-size:16px; line-height:26px; color:#4a463e; padding-bottom:22px; max-width:440px; margin:0 auto;">The remaining 50% is paid in the studio after your treatment.</div>
        <div style="font-family:Arial, Helvetica, sans-serif; font-size:16px; line-height:26px; color:#4a463e; padding-bottom:22px; max-width:440px; margin:0 auto;"><strong>Need to reschedule or cancel?</strong> Log in to your dashboard to manage your appointment. Please note: changes within 24 hours of your appointment mean your deposit is non-refundable.</div>
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px auto 0 auto;">
          <tr>
            <td align="center" bgcolor="#C4A265" style="border-radius:9px; background:linear-gradient(180deg,#D8B978,#C4A265);">
              <!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${manageUrl}" style="height:52px;v-text-anchor:middle;width:280px;" arcsize="17%" fillcolor="#C4A265" stroke="f"><center style="color:#0C0A07;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;">Manage my appointment</center></v:roundrect><![endif]-->
              <!--[if !mso]><!--><a href="${manageUrl}" style="display:inline-block; font-family:Arial, Helvetica, sans-serif; font-size:15px; font-weight:bold; letter-spacing:.5px; color:#0C0A07; text-decoration:none; padding:17px 44px; border-radius:9px;">Manage my appointment</a><!--<![endif]-->
            </td>
          </tr>
        </table>
        <div style="font-family:Arial, Helvetica, sans-serif; font-size:13px; line-height:21px; color:#8a857b; padding-top:6px; max-width:430px; margin:0 auto;">A calendar invite (.ics) is attached so you can add it to your calendar.</div>
      </td></tr>
      <tr><td style="padding:0 48px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="height:1px; line-height:1px; font-size:0; background-color:#e4ddd0;">&nbsp;</td></tr></table></td></tr>
      <tr><td align="center" style="padding:26px 48px 34px 48px;">
        <div style="font-family:'Cormorant Garamond', Georgia, serif; font-style:italic; font-size:18px; color:#C4A265; padding-bottom:14px;">With love, Luxique</div>
        <div style="font-family:Arial, Helvetica, sans-serif; font-size:12px; line-height:19px; color:#9a958b; padding-bottom:10px;"><a href="https://www.luxique.nl/voorwaarden#annulering" style="color:#9a958b; text-decoration:underline;">Cancellation policy</a> &nbsp;&middot;&nbsp; <a href="https://www.luxique.nl/voorwaarden#voorwaarden" style="color:#9a958b; text-decoration:underline;">Terms &amp; Conditions</a></div>
        <div style="font-family:Arial, Helvetica, sans-serif; font-size:12px; line-height:19px; color:#9a958b;">Luxique &middot; <a href="https://www.luxique.nl" style="color:#9a958b; text-decoration:underline;">luxique.nl</a></div>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`,
      attachments: [{
        filename: 'luxique-afspraak.ics',
        content: generateICS(booking),
      }],
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

    // Send to ACCOUNT email (via user_id), never the Cal-typed email
    const accountEmail = await getAccountEmail(booking.user_id, booking.customer_email)
    if (!accountEmail) {
      console.error('Mail: no account email for reminder', booking.cal_booking_uid)
      return
    }

    const date = formatDateEN(booking.slot_start)
    const time = formatTimeEN(booking.slot_start)

    const { error } = await resend.emails.send({
      from: FROM,
      to: accountEmail,
      subject: 'Tot morgen bij LUXIQUE 💫',
      html: `
        <div style="font-family:Georgia,'Times New Roman',serif;max-width:560px;margin:0 auto;background:#fffdf8;border:1px solid rgba(176,141,79,0.15);border-radius:16px;overflow:hidden">
          <div style="background:#f6f1e7;padding:28px 32px;text-align:center;border-bottom:1px solid rgba(176,141,79,0.15)">
            <img src="https://osldoolmbpqayxhgmbum.supabase.co/storage/v1/object/public/images/lxq-logo-black.webp" alt="LUXIQUE" style="height:24px;width:auto" />
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
    const date = formatDateEN(booking.slot_start)
    const time = formatTimeEN(booking.slot_start)
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
    const date = formatDateEN(booking.slot_start)
    const time = formatTimeEN(booking.slot_start)

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

// ============================================================
// MAIL 5: CHIVA — booking cancelled by customer
// ============================================================
export async function sendCancellationNotification(booking: BookingData & { cancelled_within_24h?: boolean }) {
  try {
    const date = formatDateEN(booking.slot_start)
    const time = formatTimeEN(booking.slot_start)
    const deposit = (booking.amount_cents / 100).toFixed(0)
    const within24h = booking.cancelled_within_24h
    const subject = within24h
      ? `CANCELLED • NO REFUND • ${booking.customer_name || 'Klant'} • ${date} • ${booking.event_type}`
      : `CANCELLED • REFUND • ${booking.customer_name || 'Klant'} • ${date} • ${booking.event_type}`

    const { error } = await resend.emails.send({
      from: FROM,
      to: CHIVA_EMAIL,
      subject,
      html: `
        <div style="font-family:Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;background:#fffdf8;border:1px solid rgba(176,141,79,0.15);border-radius:16px;overflow:hidden">
          <div style="background:#f6f1e7;padding:24px 32px;border-bottom:1px solid rgba(176,141,79,0.15)">
            <span style="font-weight:300;letter-spacing:0.4em;font-size:15px;color:#1a1712">LUXIQUE — ANNULERING</span>
          </div>
          <div style="padding:32px">
            <p style="font-size:15px;line-height:1.7;color:#3a3530;margin:0 0 16px"><strong>${booking.customer_name || 'Klant'}</strong> heeft geannuleerd${within24h ? ' <strong>binnen 24u</strong>' : ''}.</p>
            <table style="width:100%;font-size:14px;line-height:1.7;color:#3a3530;margin-bottom:16px">
              <tr><td style="color:#9a9183;width:100px;vertical-align:top">Behandeling</td><td>${booking.event_type}</td></tr>
              <tr><td style="color:#9a9183;vertical-align:top">Wanneer</td><td>${date} ${time}</td></tr>
              <tr><td style="color:#9a9183;vertical-align:top">Aanbetaling</td><td>€${deposit}</td></tr>
            </table>
            <div style="background:${within24h ? 'rgba(197,60,60,0.08)' : 'rgba(91,140,102,0.08)'};border:1px solid ${within24h ? 'rgba(197,60,60,0.2)' : 'rgba(91,140,102,0.2)'};border-radius:10px;padding:12px 14px">
              <p style="margin:0;font-size:14px;font-weight:600;color:${within24h ? '#c53c3c' : '#5b8c66'}">${within24h ? 'GEEN REFUND — binnen 24u (AV)' : 'REFUND nodig'}</p>
            </div>
          </div>
        </div>
      `,
    })

    if (error) {
      console.error(`Mail: cancellation notification FAILED:`, error)
      return
    }

    console.log(`Mail: Chiva notified of cancellation ${booking.cal_booking_uid} (within24h: ${within24h})`)
  } catch (err) {
    console.error(`Mail: cancellation notification error:`, err)
  }
}

// ============================================================
// MAIL 6: KLANT — annuleringsbevestiging
// ============================================================
export async function sendCustomerCancellationEmail(booking: BookingData & { cancelled_within_24h?: boolean }) {
  try {
    // Send to ACCOUNT email (via user_id), never the Cal-typed email
    const accountEmail = await getAccountEmail(booking.user_id, booking.customer_email)
    if (!accountEmail) {
      console.error('Mail: no account email for cancellation', booking.cal_booking_uid)
      return
    }

    const date = formatDateEN(booking.slot_start)
    const time = formatTimeEN(booking.slot_start)
    const deposit = (booking.amount_cents / 100).toFixed(0)
    const within24h = booking.cancelled_within_24h

    const refundHtml = within24h
      ? `<div style="background:rgba(197,60,60,0.06);border:1px solid rgba(197,60,60,0.2);border-radius:12px;padding:16px 18px;margin-bottom:20px"><p style="margin:0;font-size:15px;color:#c53c3c">Omdat je binnen 24 uur voor je afspraak hebt geannuleerd, wordt je aanbetaling van <strong>€${deposit}</strong> conform onze <a href="https://www.luxique.nl/voorwaarden" style="color:#c53c3c">algemene voorwaarden</a> niet gerestitueerd.</p></div>`
      : `<div style="background:rgba(91,140,102,0.06);border:1px solid rgba(91,140,102,0.2);border-radius:12px;padding:16px 18px;margin-bottom:20px"><p style="margin:0;font-size:15px;color:#5b8c66">Je aanbetaling van <strong>€${deposit}</strong> wordt gerestitueerd. We verwerken dit zo spoedig mogelijk.</p></div>`

    const { error } = await resend.emails.send({
      from: FROM,
      to: accountEmail,
      subject: 'Je afspraak bij LUXIQUE is geannuleerd',
      html: `
        <div style="font-family:Georgia,'Times New Roman',serif;max-width:560px;margin:0 auto;background:#fffdf8;border:1px solid rgba(176,141,79,0.15);border-radius:16px;overflow:hidden">
          <div style="background:#f6f1e7;padding:28px 32px;text-align:center;border-bottom:1px solid rgba(176,141,79,0.15)">
            <img src="https://osldoolmbpqayxhgmbum.supabase.co/storage/v1/object/public/images/lxq-logo-black.webp" alt="LUXIQUE" style="height:24px;width:auto" />
          </div>
          <div style="padding:36px 32px">
            <h1 style="font-size:26px;font-weight:400;color:#1a1712;margin:0 0 20px">Je afspraak is geannuleerd</h1>
            <p style="font-size:16px;line-height:1.7;color:#3a3530;margin:0 0 24px">Je afspraak voor <strong>${booking.event_type}</strong> op ${date} om ${time} uur is succesvol geannuleerd.</p>
            ${refundHtml}
            <p style="font-size:14px;line-height:1.7;color:#9a9183;margin:0;padding-top:20px;border-top:1px solid rgba(26,23,18,0.08)">Vragen? Mail ons via <a href="mailto:info@luxique.nl" style="color:#b08d4f">info@luxique.nl</a>.</p>
          </div>
        </div>
      `,
    })

    if (error) {
      console.error(`Mail: customer cancellation FAILED:`, error)
      return
    }

    console.log(`Mail: customer cancellation sent for ${booking.cal_booking_uid}`)
  } catch (err) {
    console.error(`Mail: customer cancellation error:`, err)
  }
}

// ============================================================
// .ICS agenda file generator
// ============================================================
function generateICS(booking: BookingData): Buffer {
  const start = new Date(booking.slot_start)
  const durationMinutes = booking.event_type.toLowerCase().includes('opvullen') || booking.event_type.toLowerCase().includes('refill') ? 120 : 180
  const end = new Date(start.getTime() + durationMinutes * 60_000)
  const remainder = (booking.amount_cents / 100).toFixed(0)

  const pad = (n: number) => String(n).padStart(2, '0')
  // Format as YYYYMMDDTHHMMSSZ (UTC)
  const fmtUTC = (d: Date) =>
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`

  // Europe/Amsterdam offset for DTSTART local (CET/CEST awareness via UTC offset)
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//LUXIQUE//NL',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${booking.cal_booking_uid}@luxique.nl`,
    `DTSTAMP:${fmtUTC(new Date())}`,
    `DTSTART:${fmtUTC(start)}`,
    `DTEND:${fmtUTC(end)}`,
    `SUMMARY:LUXIQUE — ${booking.event_type}`,
    `DESCRIPTION:Je afspraak bij LUXIQUE. \nRestbedrag van €${remainder} in de studio voldoen. \nKom met schone wimpers (geen mascara/olie).`,
    `LOCATION:${STUDIO_ADDRESS}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT24H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Herinnering: LUXIQUE afspraak morgen',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')

  return Buffer.from(ics, 'utf-8')
}

// ============================================================
// MAIL 7: KLANT — review aanvraag (dag NA afspraak)
// ============================================================
export async function sendReviewRequestEmail(booking: BookingData) {
  try {
    if (await isMailAlreadySent(booking.id!, 'review_request_sent_at')) {
      console.log(`Mail: review request already sent for ${booking.cal_booking_uid}, skipping`)
      return
    }

    // Send to ACCOUNT email (via user_id), never the Cal-typed email
    const accountEmail = await getAccountEmail(booking.user_id, booking.customer_email)
    if (!accountEmail) {
      console.error('Mail: no account email for review request', booking.cal_booking_uid)
      return
    }

    const firstName = booking.customer_name?.split(' ')[0] || 'je'
    const date = formatDateEN(booking.slot_start)

    const { error } = await resend.emails.send({
      from: FROM,
      to: accountEmail,
      subject: 'Hoe waren je nieuwe lashes? ✨',
      html: `
        <div style="font-family:Georgia,'Times New Roman',serif;max-width:560px;margin:0 auto;background:#fffdf8;border:1px solid rgba(176,141,79,0.15);border-radius:16px;overflow:hidden">
          <div style="background:#f6f1e7;padding:28px 32px;text-align:center;border-bottom:1px solid rgba(176,141,79,0.15)">
            <img src="https://osldoolmbpqayxhgmbum.supabase.co/storage/v1/object/public/images/lxq-logo-black.webp" alt="LUXIQUE" style="height:24px;width:auto" />
          </div>
          <div style="padding:36px 32px">
            <h1 style="font-size:26px;font-weight:400;color:#1a1712;margin:0 0 20px">Hoe waren je nieuwe lashes? ✨</h1>
            <p style="font-size:16px;line-height:1.7;color:#3a3530;margin:0 0 24px">Hi ${firstName}, bedankt dat je bij LUXIQUE was! We hopen dat je helemaal blij bent met je set.</p>
            <p style="font-size:16px;line-height:1.7;color:#3a3530;margin:0 0 24px">Zou je 1 minuutje willen nemen om een review achter te laten op Google? Het helpt ons enorm — en een foto van je lashes erbij maakt het compleet.</p>
            <div style="text-align:center;margin:32px 0">
              <a href="https://www.google.nl/search?q=Lashed+by+Chiva&si=AL3DRZEsmMGCryMMFSHJ3StBhOdZ2-6yYkXd_doETEE1OR-qOXnNn9cjqmnpbyGwwilPiiFoL9NRN9JMEJIRkgOBDP-1dimnJRkrkciqpSFldaZS9zcFoZM%3D" target="_blank" rel="noopener noreferrer"
                style="display:inline-block;background:#c4a265;color:#ffffff;font-size:15px;font-weight:500;padding:14px 28px;border-radius:999px;text-decoration:none;transition:background 0.2s;">
                Laat een review achter →
              </a>
            </div>
            <p style="font-size:14px;line-height:1.7;color:#9a9183;margin:0;padding-top:20px;border-top:1px solid rgba(26,23,18,0.08)">Heb je vragen? Mail ons via <a href="mailto:info@luxique.nl" style="color:#b08d4f">info@luxique.nl</a>.</p>
          </div>
        </div>
      `,
    })

    if (error) {
      console.error(`Mail: review request FAILED for ${booking.cal_booking_uid}:`, error)
      return
    }

    await markMailSent(booking.id!, 'review_request_sent_at')
    console.log(`Mail: review request sent for ${booking.cal_booking_uid}`)
  } catch (err) {
    console.error(`Mail: review request error for ${booking.cal_booking_uid}:`, err)
  }
}

// Helper to fetch booking + customer info from Cal API
export async function getBookingWithCustomerFromCal(uid: string): Promise<BookingData | null> {
  try {
    const res = await fetch(`https://api.cal.com/v2/bookings?uid=${uid}`, {
      headers: { Authorization: `Bearer ${process.env.CAL_API_KEY}` },
    })
    const data: { data?: { bookings?: Array<Record<string, unknown>> } } = await res.json()
    const b = (data?.data?.bookings?.[0] || {}) as Record<string, unknown>
    if (!b) return null

    const attendees = (b.attendees as Array<{ email?: string; name?: string }>) || []
    const attendee = attendees[0] || {}
    const responses = (b.responses as Record<string, string>) || {}
    const eventType = b.eventType as { title?: string } | undefined

    return {
      cal_booking_uid: uid,
      event_type: eventType?.title || (b.title as string) || 'Behandeling',
      slot_start: (b.startTime as string) || new Date().toISOString(),
      amount_cents: 0,
      customer_name: responses.name || attendee.name || null,
      customer_email: responses.email || attendee.email || null,
    }
  } catch {
    return null
  }
}
