/**
 * LUXIQUE Traject-systeem — STAP 2
 * Blok-berekening + beschikbaarheids-check
 *
 * twee kernfuncties, los testbaar:
 *   A) berekenWerkdagenBlok(startdatum, duurWerkdagen)
 *   B) isBlokBeschikbaar(blokDagen)
 *
 * NOG GEEN UI, GEEN Stripe, GEEN cal.com-sync.
 * Alleen traject-vs-traject check in eigen DB.
 */

import { supabaseAdmin } from './supabase-admin'

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------

export interface WerkdagBlok {
  datums: string[]   // ISO date strings: ['2026-07-03', '2026-07-06', ...]
}

export interface BeschikbaarheidResult {
  beschikbaar: boolean
  bezetteDagen: string[]   // ISO date strings die al geboekt zijn
}

// ---------------------------------------------------------------------------
// FUNCTIE A — berekenWerkdagenBlok
// ---------------------------------------------------------------------------

/**
 * Geeft een array van exacte datum-strings (YYYY-MM-DD) voor een blok.
 *
 * Regels:
 *  - Werkt alleen met werkdagen (ma=1 t/m vr=5). Weekend (za=6, zo=0) wordt
 *    OVERGESLAGEN — niet meegeteld, maar het blok mag er wel doorheen lopen.
 *  - Edge case duurWerkdagen = 0 (Beginner workshop, 1 uur): geeft [startdatum]
 *    terug. Geen meerdaags blok, maar de startdatum zelf wordt als "blok"
 *    beschouwd zodat de beschikbaarheids-check werkt.
 *  - Edge case startdatum in weekend: schuift op naar de eerstvolgende
 *    werkdag (ma). Dit omdat een cursus niet echt op zaterdag/zondag start.
 *
 * Voorbeelden:
 *  - (vrijdag, 3) → [vr, ma, di]
 *  - (maandag, 4) → [ma, di, wo, do]
 *  - (zaterdag, 2) → schuift naar maandag → [ma, di]
 *  - (woensdag, 0) → [wo]
 */
export function berekenWerkdagenBlok(
  startdatumInput: string | Date,
  duurWerkdagen: number,
): string[] {
  const start = typeof startdatumInput === 'string'
    ? new Date(startdatumInput + 'T00:00:00')
    : new Date(startdatumInput)

  if (Number.isNaN(start.getTime())) {
    throw new Error(`Ongeldige startdatum: ${startdatumInput}`)
  }

  if (duurWerkdagen < 0) {
    throw new Error(`duurWerkdagen mag niet negatief zijn: ${duurWerkdagen}`)
  }

  // startdatum in weekend → schuif naar eerstvolgende werkdag (ma)
  const cursor = new Date(start)
  while (cursor.getDay() === 0 || cursor.getDay() === 6) {
    cursor.setDate(cursor.getDate() + 1)
  }

  // Gebruik locale date formatting (voorkomt timezone drift)
  const toIsoDate = (d: Date): string => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  // duurWerkdagen = 0 → alleen de startdatum (Beginner workshop)
  if (duurWerkdagen === 0) {
    return [toIsoDate(cursor)]
  }

  const blok: string[] = []
  let overgebleven = duurWerkdagen

  while (overgebleven > 0) {
    const dow = cursor.getDay() // 0=zo, 6=za
    if (dow >= 1 && dow <= 5) {
      blok.push(toIsoDate(cursor))
      overgebleven--
    }
    cursor.setDate(cursor.getDate() + 1)
  }

  return blok
}

// ---------------------------------------------------------------------------
// FUNCTIE B — isBlokBeschikbaar
// ---------------------------------------------------------------------------

/**
 * Check of ALLE dagen in het blok vrij zijn.
 *
 * "Vrij" = op geen van de opgegeven dagen bestaat al een traject-boeking
 * (check traject_boekingen.blok_dagen op overlap).
 *
 * Belangrijk: trajecten en behandelingen (cal.com) sluiten elkaar NOG NIET
 * uit. Voor nu (stap 2) checken we alleen traject-vs-traject in de eigen DB.
 * De cal.com-sync komt in STAP 4.
 *
 * Returns:
 *  - beschikbaar: true als alle dagen vrij zijn
 *  - bezetteDagen: array van datums die al geboekt zijn (leeg als beschikbaar)
 */
export async function isBlokBeschikbaar(
  blokDagen: string[],
): Promise<BeschikbaarheidResult> {
  if (!blokDagen || blokDagen.length === 0) {
    return { beschikbaar: true, bezetteDagen: [] }
  }

  const { data, error } = await supabaseAdmin
    .from('traject_boekingen')
    .select('blok_dagen')

  if (error) {
    throw new Error(`DB-fout bij beschikbaarheids-check: ${error.message}`)
  }

  const gevraagdSet = new Set(blokDagen)
  const bezetSet = new Set<string>()

  for (const rij of data ?? []) {
    const existing: string[] = rij.blok_dagen ?? []
    for (const d of existing) {
      if (gevraagdSet.has(d)) {
        bezetSet.add(d)
      }
    }
  }

  const bezetteDagen: string[] = []
  bezetSet.forEach((d) => bezetteDagen.push(d))
  bezetteDagen.sort()

  return {
    beschikbaar: bezetteDagen.length === 0,
    bezetteDagen,
  }
}

// ---------------------------------------------------------------------------
// HANDY COMBI — bereken én check in één call
// ---------------------------------------------------------------------------

export interface TrajectCheckResult {
  startdatum: string
  duurWerkdagen: number
  blok: string[]
  beschikbaar: boolean
  bezetteDagen: string[]
}

export async function checkTrajectBeschikbaarheid(
  startdatum: string | Date,
  duurWerkdagen: number,
): Promise<TrajectCheckResult> {
  const blok = berekenWerkdagenBlok(startdatum, duurWerkdagen)
  const check = await isBlokBeschikbaar(blok)
  return {
    startdatum: blok[0] ?? String(startdatum),
    duurWerkdagen,
    blok,
    beschikbaar: check.beschikbaar,
    bezetteDagen: check.bezetteDagen,
  }
}
