import { Resend } from 'resend'

const FROM = 'LUXIQUE <noreply@luxique.nl>'
const STUDIO_ADDRESS = 'De Overmaat 26, 6831 AH Arnhem'

export type ManualBookingMailData = {
  bookingId: string
  customerName: string
  customerEmail: string
  treatmentName: string
  slotStart: string
  salonDepositStatus: 'paid' | 'not_recorded'
  salonDepositCents: number | null
  within24h?: boolean
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  })[character] || character)
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('nl-NL', {
    timeZone: 'Europe/Amsterdam', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date(iso))
}

function formatTime(iso: string) {
  return new Intl.DateTimeFormat('nl-NL', {
    timeZone: 'Europe/Amsterdam', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date(iso))
}

function money(cents: number) {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}

function shell(input: { eyebrow: string; title: string; intro: string; details: string; notice?: string }) {
  return `<!DOCTYPE html><html lang="nl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${input.title}</title></head>
<body style="margin:0;padding:0;background:#e8e6e1"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 16px"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background:#FAF8F4;border-radius:14px;overflow:hidden"><tr><td align="center" style="background:#0C0A07;padding:38px 40px 30px"><img src="https://luxique.nl/lxq-email-logo.png" width="132" alt="LUXIQUE" style="display:block;border:0"></td></tr><tr><td style="height:2px;background:#C4A265"></td></tr><tr><td align="center" style="padding:44px 48px 36px"><div style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#C4A265;padding-bottom:18px">${input.eyebrow}</div><div style="font-family:Georgia,serif;font-size:34px;line-height:42px;color:#0C0A07;padding-bottom:20px">${input.title}</div><div style="font-family:Arial,sans-serif;font-size:16px;line-height:26px;color:#4a463e;padding-bottom:24px">${input.intro}</div>${input.details}${input.notice || ''}<a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.luxique.nl'}/dashboard?tab=boekingen" style="display:inline-block;margin-top:8px;padding:15px 30px;border-radius:9px;background:#C4A265;color:#0C0A07;font-family:Arial,sans-serif;font-weight:bold;text-decoration:none">Beheer je afspraak</a></td></tr><tr><td align="center" style="padding:26px 48px 34px;border-top:1px solid #e4ddd0;font-family:Arial,sans-serif;font-size:12px;color:#9a958b">Luxique · <a href="https://www.luxique.nl" style="color:#9a958b">luxique.nl</a></td></tr></table></td></tr></table></body></html>`
}

function details(data: ManualBookingMailData) {
  const deposit = data.salonDepositStatus === 'paid' && data.salonDepositCents != null
    ? `<tr><td style="padding-top:12px;color:#9a958b">Aanbetaling in de salon</td></tr><tr><td style="font:19px Georgia,serif;color:#0C0A07">${money(data.salonDepositCents)}</td></tr>`
    : ''
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3efe7;border-radius:10px;margin:0 0 24px"><tr><td style="padding:22px 26px;font-family:Arial,sans-serif;font-size:12px"><table role="presentation" width="100%"><tr><td style="color:#9a958b">Behandeling</td></tr><tr><td style="font:19px Georgia,serif;color:#0C0A07;padding-bottom:12px">${escapeHtml(data.treatmentName)}</td></tr><tr><td style="color:#9a958b">Datum en tijd</td></tr><tr><td style="font:19px Georgia,serif;color:#0C0A07;padding-bottom:12px">${formatDate(data.slotStart)} om ${formatTime(data.slotStart)}</td></tr><tr><td style="color:#9a958b">Locatie</td></tr><tr><td style="font:19px Georgia,serif;color:#0C0A07">${STUDIO_ADDRESS}</td></tr>${deposit}</table></td></tr></table>`
}

async function send(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error('RESEND_API_KEY ontbreekt op de server.')
  const resend = new Resend(apiKey)
  const { error } = await resend.emails.send({ from: FROM, to, subject, html })
  if (error) throw new Error(error.message)
}

export async function sendManualBookingConfirmation(data: ManualBookingMailData) {
  const cancellationText = data.salonDepositStatus === 'paid'
    ? 'Je kunt je afspraak tot 24 uur voor aanvang kosteloos annuleren of verplaatsen. Annuleer je binnen 24 uur, dan is de in de salon betaalde aanbetaling niet restitueerbaar.'
    : 'Je kunt je afspraak tot 24 uur voor aanvang kosteloos annuleren of verplaatsen. Annuleer je binnen 24 uur, dan is een eventueel in de salon betaalde aanbetaling niet restitueerbaar.'
  await send(data.customerEmail, 'Je afspraak bij LUXIQUE is bevestigd', shell({
    eyebrow: 'Afspraak bevestigd',
    title: `Je bent ingepland, ${escapeHtml(data.customerName.split(' ')[0] || data.customerName)}`,
    intro: 'Chiva heeft je afspraak handmatig bevestigd. Er is via de website geen betaling uitgevoerd.',
    details: details(data),
    notice: `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:23px;color:#4a463e;padding:0 4px 22px">${cancellationText}</div>`,
  }))
}

export async function sendManualBookingReminder(data: ManualBookingMailData) {
  const appointment = `${formatDate(data.slotStart)} om ${formatTime(data.slotStart)}`
  await send(data.customerEmail, `Herinnering: je afspraak op ${appointment}`, shell({
    eyebrow: 'Afspraakherinnering',
    title: `Je afspraak komt eraan, ${escapeHtml(data.customerName.split(' ')[0] || data.customerName)}`,
    intro: `Je afspraak bij Chiva is op ${appointment}. Hieronder vind je de datum, tijd en locatie.`,
    details: details(data),
    notice: '<div style="font-family:Arial,sans-serif;font-size:14px;line-height:23px;color:#4a463e;padding:0 4px 22px">Kom met schone wimpers, zonder mascara of olieproducten rond de ogen.</div>',
  }))
}

export async function sendManualBookingCancellation(data: ManualBookingMailData) {
  const notice = data.within24h
    ? data.salonDepositStatus === 'paid'
      ? 'Omdat je binnen 24 uur voor aanvang annuleert, is de in de salon betaalde aanbetaling niet restitueerbaar.'
      : 'Omdat je binnen 24 uur voor aanvang annuleert, is een eventueel in de salon betaalde aanbetaling niet restitueerbaar.'
    : 'Je afspraak is meer dan 24 uur voor aanvang kosteloos geannuleerd. Er is via de website geen betaling of terugbetaling verwerkt.'
  await send(data.customerEmail, 'Je afspraak bij LUXIQUE is geannuleerd', shell({
    eyebrow: 'Afspraak geannuleerd',
    title: 'Je afspraak is geannuleerd',
    intro: 'Je handmatig ingeplande afspraak is succesvol geannuleerd.',
    details: details(data),
    notice: `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:23px;color:#4a463e;padding:0 4px 22px">${notice}</div>`,
  }))
}

export async function sendManualBookingRescheduled(data: ManualBookingMailData) {
  await send(data.customerEmail, 'Je afspraak bij LUXIQUE is verplaatst', shell({
    eyebrow: 'Afspraak verplaatst',
    title: 'Je nieuwe afspraak staat vast',
    intro: 'Je handmatig ingeplande afspraak is verplaatst. Hieronder staan de nieuwe datum en tijd. Er is via de website geen betaling of terugbetaling verwerkt.',
    details: details(data),
  }))
}
