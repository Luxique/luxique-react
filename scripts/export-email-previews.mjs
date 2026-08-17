/**
 * export-email-previews.mjs
 *
 * Genereert statische HTML-previews van alle e-mailtemplates in src/lib/email.ts
 * (plus de static email-templates/*.html). De markup wordt 1-op-1 uit de broncode
 * geëxtraheerd; interpolaties (${...}) worden vervangen door voorbeeldwaarden.
 *
 * Gebruik:  node scripts/export-email-previews.mjs [outputDir]
 */
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync, existsSync } from 'node:fs'
import { join, basename } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const SRC = join(ROOT, 'src/lib/email.ts')
const STATIC_DIR = join(ROOT, 'email-templates')
const OUT = process.argv[2] || join(process.env.HOME || '.', 'Desktop', 'LUXIQUE-email-templates')

const source = readFileSync(SRC, 'utf8')

// ── Voorbeeldwaarden voor interpolaties ──
const SAMPLES = [
  // specifiek eerst (langere expressies)
  { match: /trajectDagenHtml/, value: '<tr><td style="font-family:Arial,sans-serif; font-size:11px; letter-spacing:1.5px; text-transform:uppercase; color:#9a958b; padding:0 0 3px 0;">Trajectdag</td></tr><tr><td style="font-family:\'Cormorant Garamond\',Georgia,serif; font-size:19px; color:#0C0A07; padding:0 0 14px 0;">vrijdag 4 september 2026</td></tr><tr><td style="font-family:Arial,sans-serif; font-size:11px; letter-spacing:1.5px; text-transform:uppercase; color:#9a958b; padding:0 0 3px 0;">Trajectdag</td></tr><tr><td style="font-family:\'Cormorant Garamond\',Georgia,serif; font-size:19px; color:#0C0A07; padding:0 0 14px 0;">zaterdag 5 september 2026</td></tr>' },
  { match: /datumsLijst/, value: 'vrijdag 4 september 2026<br/>zaterdag 5 september 2026' },
  { match: /refundHtml/, value: '<div style="background:rgba(91,140,102,0.06);border:1px solid rgba(91,140,102,0.2);border-radius:12px;padding:16px 18px;margin-bottom:20px"><p style="margin:0;font-size:15px;color:#5b8c66">Je aanbetaling van <strong>€45</strong> wordt gerestitueerd. We verwerken dit zo spoedig mogelijk.</p></div>' },
  { match: /formatDateNL|formatDateEN|date/i, value: 'vrijdag 4 september 2026' },
  { match: /fmtTime|time/i, value: '10:00' },
  { match: /manageUrl/, value: 'https://www.luxique.nl/dashboard?tab=boekingen' },
  { match: /STUDIO_ADDRESS/, value: 'De Overmaat 26, 6831 AH Arnhem' },
  { match: /voornaam/, value: 'Sanne' },
  { match: /event_type/, value: 'Lash Extensions — Nieuwe Set' },
  { match: /customer_name/, value: 'Sanne de Vries' },
  { match: /customer_email/, value: 'sanne@voorbeeld.nl' },
  { match: /cursus_naam/, value: 'Medusa Lash Classic — 3-daags traject' },
  { match: /aanbetaling_cents/, value: '€241,80' },
  { match: /restbedrag_cents/, value: '€967,20' },
  { match: /deposit/, value: '45' },
  { match: /remainder/, value: '45' },
  { match: /within24h/i, value: '' },
  { match: /firstName/, value: 'Sanne' },
  { match: /klant_naam/, value: 'Sanne de Vries' },
  { match: /klant_email/, value: 'sanne@voorbeeld.nl' },
  { match: /boekingId|bookingId|cal_booking_uid|user_id/, value: 'voorbeeld-id' },
]

function substitute(expr) {
  for (const s of SAMPLES) {
    if (s.match.test(expr)) return s.value
  }
  return '«' + expr.slice(0, 40) + '»'
}

// ── Extract alle html:`...` template literals uit email.ts ──
const mails = []
const re = /html:\s*`([\s\S]*?)`,?\n/g
let m
while ((m = re.exec(source)) !== null) {
  let html = m[1]
  // ${...} vervangen (non-greedy, geen nesting in deze templates behalve simpele ternaries)
  html = html.replace(/\$\{([^}]*(?:\}[^}])*)?\}/g, (_, expr) => substitute(expr))
  mails.push(html)
}

// ── Namen toekennen op volgorde van voorkomen in email.ts ──
const NAMES = [
  '01-klant-betaalbevestiging-behandeling',
  '02-klant-herinnering-24u',
  '03-chiva-nieuwe-boeking',
  '04-chiva-boeking-verlopen',
  '05-chiva-annulering-binnen-24u',
  '06-klant-annuleringsbevestiging',
  '07-klant-reviewverzoek',
  '08-traject-klant-bevestiging',
  '09-traject-chiva-notificatie',
]

mkdirSync(OUT, { recursive: true })

let written = []
mails.forEach((html, i) => {
  const name = (NAMES[i] || `mail-${i + 1}`) + '.html'
  const file = join(OUT, name)
  writeFileSync(file, html)
  written.push(name)
})

// Statische templates uit email-templates/
if (existsSync(STATIC_DIR)) {
  for (const f of readdirSync(STATIC_DIR)) {
    if (f.endsWith('.html')) {
      copyFileSync(join(STATIC_DIR, f), join(OUT, `1x-${f}`))
      written.push(`1x-${f}`)
    }
  }
}

console.log(`✅ ${written.length} previews in ${OUT}`)
written.forEach(w => console.log('  -', w))
