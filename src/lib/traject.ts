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


// ---------------------------------------------------------------------------
// FUNCTIE C — checkKlassenOverlap
// ---------------------------------------------------------------------------

export interface KlassenOverlapResult {
  /** true = veilig, geen overlap met bestaande klassen */
  ok: boolean
  /** Botst met deze klassen (bevat cursus_naam + begane dagen) */
  conflicts: Array<{ klas_id: string; cursus_naam: string | null; startdatum: string; overlappende_dagen: string[] }>
}

/**
 * Check of een blok_dagen-array overlapt met een bestaande klas.
 * Alleen klassen met status 'open' of 'vol' tellen mee — geannuleerde niet.
 *
 * @param blokDagen  — de voorgestelde blok-dagen voor de nieuwe/gewijzigde klas
 * @param excludeKlasId — bij PATCH: id van de klas die gewijzigd wordt (zichzelf niet meetellen)
 */
export async function checkKlassenOverlap(
  blokDagen: string[],
  excludeKlasId?: string,
): Promise<KlassenOverlapResult> {
  if (!blokDagen || blokDagen.length === 0) {
    return { ok: true, conflicts: [] }
  }

  const { data, error } = await supabaseAdmin
    .from('traject_klassen')
    .select('id, startdatum, blok_dagen, status, traject_cursussen (naam)')
    .in('status', ['open', 'vol'])

  if (error) {
    throw new Error('DB-fout bij overlap-check: ' + error.message)
  }

  const gevraagdSet = new Set(blokDagen)
  const conflicts: KlassenOverlapResult['conflicts'] = []

  for (const rij of data ?? []) {
    if (excludeKlasId && rij.id === excludeKlasId) continue
    const existing: string[] = rij.blok_dagen ?? []
    const overlap = existing.filter((d: string) => gevraagdSet.has(d))
    if (overlap.length > 0) {
      const cursusNaam = (rij as { traject_cursussen?: Array<{ naam: string }> }).traject_cursussen?.[0]?.naam ?? null
      conflicts.push({
        klas_id: rij.id,
        cursus_naam: cursusNaam,
        startdatum: rij.startdatum,
        overlappende_dagen: overlap,
      })
    }
  }

  return {
    ok: conflicts.length === 0,
    conflicts,
  }
}

// ---------------------------------------------------------------------------
// STAP 3b — CURSUS MANAGEMENT
// ---------------------------------------------------------------------------

export interface TrajectCursus {
  id: string
  naam: string
  duur_werkdagen: number
  prijs_cents: number
  prijs_ex_btw: number
  actief: boolean
}

/**
 * Haal alle actieve traject cursussen op.
 */
export async function getTrajectCursussen(): Promise<TrajectCursus[]> {
  const { data, error } = await supabaseAdmin
    .from('traject_cursussen')
    .select('*')
    .eq('actief', true)
    .order('id')

  if (error) {
    throw new Error(`Fout bij ophalen traject cursussen: ${error.message}`)
  }

  return data || []
}

/**
 * Haal specifieke cursus op via ID.
 */
export async function getTrajectCursusById(id: string): Promise<TrajectCursus | null> {
  const { data, error } = await supabaseAdmin
    .from('traject_cursussen')
    .select('*')
    .eq('id', id)
    .eq('actief', true)
    .maybeSingle()

  if (error) {
    throw new Error(`Fout bij ophalen traject cursus: ${error.message}`)
  }

  return data
}

// ---------------------------------------------------------------------------
// STAP 3b — INSTELLINGEN
// ---------------------------------------------------------------------------

export interface TrajectInstellingen {
  traject_voorsprong_weken: number
  boekbare_horizon_weken: number
  werktijd_ochtend_start: string  // '09:00'
  werktijd_ochtend_eind: string    // '12:00'
  werktijd_middag_start: string    // '13:00'
  werktijd_middag_eind: string      // '17:00'
  annuleer_gratis_grens_dagen: number    // default 7
  annuleer_materiaal_grens_uren: number   // default 72
  materiaalkosten_cents: number           // default 15000 (€150)
}

/**
 * Haal traject instellingen op (singleton tabel).
 */
export async function getTrajectInstellingen(): Promise<TrajectInstellingen> {
  const { data, error } = await supabaseAdmin
    .from('traject_instellingen')
    .select('*')
    .single()

  if (error) {
    throw new Error(`Fout bij ophalen traject instellingen: ${error.message}`)
  }

  return data as TrajectInstellingen
}

/**
 * Formateer prijs in cents naar Euro string.
 */
export function formatPrice(cents: number): string {
  return `€${(cents / 100).toFixed(2).replace('.', ',')}`
}

/**
 * Formateer duur in werkdagen naar menselijk leesbaar format.
 */
export function formatDuur(duurWerkdagen: number): string {
  if (duurWerkdagen === 0) {
    return '1 uur — workshop'
  }
  if (duurWerkdagen === 1) {
    return '1 dag'
  }
  return `${duurWerkdagen} dagen`
}

// ---------------------------------------------------------------------------
// STAP 5a — ANNULERINGS-VENSTER LOGICA
// ---------------------------------------------------------------------------

/**
 * Resultaat van de annulerings-venster bepaling.
 *
 * BELEID SINDS AUG 2026: de aanbetaling (20%) is onder geen enkele
 * omstandigheid restitueerbaar. Alleen het recht op eenmalig verplaatsen
 * vervalt dicht bij de start.
 *
 * Venster 1: ruim voor start → GEEN terugbetaling van de aanbetaling,
 *           eenmalig omboeken mogelijk
 * Venster 2: dicht bij start maar niet kritisch → zelfde als venster 1
 *           (aanbetaling blijft, omboeken nog mogelijk)
 * Venster 3: laatste moment → geen terugbetaling, geen omboeken
 */
export interface AnnuleringsVensterResult {
  venster: 1 | 2 | 3
  mag_omboeken: boolean
  mag_annuleren: boolean
  terugbetaling: 'volledig' | 'minus_materiaal' | 'geen'
  uren_tot_start: number
  dagen_tot_start: number
  beschrijving: string
}

/**
 * Zet een ISO datum string (YYYY-MM-DD) om naar een Date in Amsterdam-tijd.
 *
 * Dit voorkomt de UTC/lokaal-verwarring die eerder voor bugs zorgde.
 * We maken een Date aan alsof het lokale tijd is, en gebruiken dan waar
 * nodig expliciete tijdzone-berekeningen.
 */
function parseDatumAmsterdam(isoDate: string): Date {
  // Maak een datum aan als 'local time' — in server context (UTC) betekent dit
  // dat we de datum expliciet moeten maken als midnight Amsterdam tijd.
  // Amsterdam is UTC+1 (winter) of UTC+2 (zomer).
  // De simpelste aanpak: gebruik het datumgedeelte + T00:00:00 en interpreteer
  // als Europe/Amsterdam. We gebruiken de aanpak die ook in de rest van het
  // traject-systeem werkt: datum string + tijd ervan maken.
  return new Date(isoDate + 'T00:00:00+02:00')
}

/**
 * Bepaal in welk annulerings-venster een boeking valt.
 *
 * @param startdatum  ISO datum string (YYYY-MM-DD) — de startdatum van het traject
 * @param nu          Date object voor 'nu' (default: new Date())
 * @param instellingen De traject-instellingen (grenzen)
 *
 * Venster 1: meer dan `annuleer_gratis_grens_dagen` dagen vóór start
 *           → omboeken mag, annuleren mag, GEEN terugbetaling
 *             (de 20% aanbetaling is nooit restitueerbaar)
 * Venster 2: tussen de gratis-grens en de materiaal-grens
 *           → omboeken mag, annuleren mag, GEEN terugbetaling
 * Venster 3: binnen `annuleer_materiaal_grens_uren` vóór start
 *           → omboeken kan NIET, alleen annuleren, NIETS terug
 */
export function bepaalAnnuleringsVenster(
  startdatum: string,
  nu: Date = new Date(),
  instellingen: {
    annuleer_gratis_grens_dagen: number
    annuleer_materiaal_grens_uren: number
  },
): AnnuleringsVensterResult {
  const start = parseDatumAmsterdam(startdatum)
  const diffMs = start.getTime() - nu.getTime()
  const diffUren = diffMs / (1000 * 60 * 60)
  const diffDagen = diffMs / (1000 * 60 * 60 * 24)

  const gratisGrensDagen = instellingen.annuleer_gratis_grens_dagen ?? 5
  const materiaalGrensUren = instellingen.annuleer_materiaal_grens_uren ?? 72

  //cas A: na start (negatieve diff) → altijd venster 3
  //cas B: negatief of zeer klein → venster 3
  if (diffUren <= materiaalGrensUren) {
    return {
      venster: 3,
      mag_omboeken: false,
      mag_annuleren: true,
      terugbetaling: 'geen',
      uren_tot_start: Math.round(diffUren),
      dagen_tot_start: Math.round(diffDagen),
      beschrijving: `Binnen ${materiaalGrensUren}u vóór start (of al gestart) — geen terugbetaling, omboeken niet mogelijk`,
    }
  }

  //cas C: tussen materiaal-grens en gratis-grens → venster 2
  if (diffDagen <= gratisGrensDagen) {
    return {
      venster: 2,
      mag_omboeken: true,
      mag_annuleren: true,
      terugbetaling: 'geen',
      uren_tot_start: Math.round(diffUren),
      dagen_tot_start: Math.round(diffDagen),
      beschrijving: `Tussen ${materiaalGrensUren}u en ${gratisGrensDagen} dagen vóór start — aanbetaling (20%) wordt niet terugbetaald, eenmalig verplaatsen mogelijk`,
    }
  }

  //cas D: ruim voor start → venster 1
  return {
    venster: 1,
    mag_omboeken: true,
    mag_annuleren: true,
    terugbetaling: 'geen',
    uren_tot_start: Math.round(diffUren),
    dagen_tot_start: Math.round(diffDagen),
    beschrijving: `Meer dan ${gratisGrensDagen} dagen vóór start — aanbetaling (20%) wordt niet terugbetaald, eenmalig verplaatsen mogelijk`,
  }
}
