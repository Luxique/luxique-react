/**
 * PATCH /api/admin/klassen/[id]  — wijzig klas
 * DELETE /api/admin/klassen/[id] — verwijder/annuleer klas
 *
 * Admin-only.
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'
import { cancelKlasBlokkades } from '@/lib/klas-cal-sync'
import { berekenWerkdagenBlok, checkKlassenOverlap } from '@/lib/traject'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
}

// ─── PATCH ────────────────────────────────────────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdmin(req)
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.status, headers: NO_STORE_HEADERS },
    )
  }

  try {
    const { id } = params
    const body = await req.json()

    // Allowed fields for update
    const updates: Record<string, unknown> = {}
    if (body.starttijd !== undefined) {
      if (!/^\d{2}:\d{2}$/.test(body.starttijd)) {
        return NextResponse.json(
          { error: 'Ongeldige starttijd (gebruik HH:MM)' },
          { status: 400, headers: NO_STORE_HEADERS },
        )
      }
      updates.starttijd = body.starttijd
    }
    if (body.startdatum !== undefined) {
      // Valideer format
      const parsed = new Date(body.startdatum + 'T00:00:00')
      if (Number.isNaN(parsed.getTime())) {
        return NextResponse.json(
          { error: 'Ongeldige startdatum (gebruik YYYY-MM-DD)' },
          { status: 400, headers: NO_STORE_HEADERS },
        )
      }
      // Herbereken blok_dagen o.b.v. nieuwe startdatum + bestaande cursus
      const { data: existing } = await supabaseAdmin
        .from('traject_klassen')
        .select('cursus_id, traject_cursussen (duur_werkdagen)')
        .eq('id', id)
        .single()
      const duur = (existing as { traject_cursussen?: Array<{ duur_werkdagen: number }> })?.traject_cursussen?.[0]?.duur_werkdagen ?? 1
      const nieuwBlok = berekenWerkdagenBlok(body.startdatum, duur)

      // ── OVERLAP-CHECK (exclusief de klas zelf) ──
      const overlap = await checkKlassenOverlap(nieuwBlok, id)
      if (!overlap.ok) {
        const conflict = overlap.conflicts[0]
        const cursusNaam = conflict?.cursus_naam ?? 'onbekende cursus'
        const dagenStr = conflict?.overlappende_dagen.join(', ') ?? ''
        const msg = `Deze dagen overlappen met een bestaande klas (${cursusNaam}, ${dagenStr}). Kies een andere startdatum.`
        return NextResponse.json(
          { error: msg, conflicts: overlap.conflicts },
          { status: 409, headers: NO_STORE_HEADERS },
        )
      }

      updates.startdatum = body.startdatum
      updates.blok_dagen = nieuwBlok
    }
    if (body.max_deelnemers !== undefined) {
      const max = Number(body.max_deelnemers)
      if (!Number.isInteger(max) || max < 1 || max > 20) {
        return NextResponse.json(
          { error: 'max_deelnemers moet een geheel getal tussen 1 en 20 zijn' },
          { status: 400, headers: NO_STORE_HEADERS },
        )
      }

      // HARDE VALIDATIE: max mag niet onder aantal betaalde deelnemers
      const { count: betaaldCount, error: countError } = await supabaseAdmin
        .from('traject_boekingen')
        .select('id', { count: 'exact', head: true })
        .eq('klas_id', id)
        .eq('aanbetaling_status', 'betaald')

      if (countError) {
        return NextResponse.json(
          { error: 'DB-fout bij tellen deelnemers' },
          { status: 500, headers: NO_STORE_HEADERS },
        )
      }

      if ((betaaldCount ?? 0) > 0 && max < (betaaldCount ?? 0)) {
        return NextResponse.json(
          {
            error: `Kan max_deelnemers niet verlagen naar ${max}: er zijn al ${betaaldCount} betaalde inschrijvingen.`,
          },
          { status: 400, headers: NO_STORE_HEADERS },
        )
      }

      updates.max_deelnemers = max
    }
    if (body.weergave_titel !== undefined) updates.weergave_titel = body.weergave_titel
    if (body.weergave_beschrijving !== undefined) updates.weergave_beschrijving = body.weergave_beschrijving
    if (body.status !== undefined) {
      if (!['open', 'vol', 'geannuleerd'].includes(body.status)) {
        return NextResponse.json(
          { error: 'Ongeldige status' },
          { status: 400, headers: NO_STORE_HEADERS },
        )
      }
      updates.status = body.status
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'Geen geldige velden om te updaten' },
        { status: 400, headers: NO_STORE_HEADERS },
      )
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('traject_klassen')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single()

    if (updateError) {
      console.error('PATCH klas error:', updateError)
      return NextResponse.json(
        { error: 'Update mislukt', details: updateError.message },
        { status: 500, headers: NO_STORE_HEADERS },
      )
    }

    return NextResponse.json(
      { klas: updated },
      { status: 200, headers: NO_STORE_HEADERS },
    )
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('PATCH /api/admin/klassen error:', msg)
    return NextResponse.json(
      { error: msg },
      { status: 500, headers: NO_STORE_HEADERS },
    )
  }
}

// ─── DELETE ───────────────────────────────────────────────────────────────
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdmin(req)
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.status, headers: NO_STORE_HEADERS },
    )
  }

  try {
    const { id } = params

    // Check: geen betaalde inschrijvingen
    const { count: betaaldCount, error: countError } = await supabaseAdmin
      .from('traject_boekingen')
      .select('id', { count: 'exact', head: true })
      .eq('klas_id', id)
      .eq('aanbetaling_status', 'betaald')

    if (countError) {
      return NextResponse.json(
        { error: 'DB-fout bij tellen inschrijvingen' },
        { status: 500, headers: NO_STORE_HEADERS },
      )
    }

    if ((betaaldCount ?? 0) > 0) {
      return NextResponse.json(
        {
          error: `Kan klas niet verwijderen: er zijn ${betaaldCount} betaalde inschrijvingen. Annuleer de klas (status='geannuleerd') i.p.v. verwijderen.`,
        },
        { status: 403, headers: NO_STORE_HEADERS },
      )
    }

    // Verwijder pending (niet-betaalde) boekingen
    const { error: delPendingError } = await supabaseAdmin
      .from('traject_boekingen')
      .delete()
      .eq('klas_id', id)
      .eq('aanbetaling_status', 'pending')

    if (delPendingError) {
      console.error('DELETE pending boekingen error:', delPendingError)
      return NextResponse.json(
        { error: 'Kon pending boekingen niet verwijderen' },
        { status: 500, headers: NO_STORE_HEADERS },
      )
    }

    // Ruim cal.com blokkades op voordat we de klas verwijderen
    // (anders zijn de UIDs weg en kunnen we ze niet meer cancelen)
    let calCancelled = 0
    let calFailed = 0
    try {
      const cancelResult = await cancelKlasBlokkades(id, supabaseAdmin)
      calCancelled = cancelResult.cancelled.length
      calFailed = cancelResult.failed.length
      console.log(`DELETE klas ${id}: cal.com cancel ${calCancelled} ok, ${calFailed} failed`)
    } catch (err) {
      console.error(`DELETE klas ${id}: cal.com cancel exception:`, err)
      calFailed = -1
    }

    // Verwijder de klas
    const { error: delError } = await supabaseAdmin
      .from('traject_klassen')
      .delete()
      .eq('id', id)

    if (delError) {
      console.error('DELETE klas error:', delError)
      return NextResponse.json(
        { error: 'Verwijderen mislukt', details: delError.message },
        { status: 500, headers: NO_STORE_HEADERS },
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Klas verwijderd (pending boekingen opgeruimd)',
        calCancelled,
        calFailed,
      },
      { status: 200, headers: NO_STORE_HEADERS },
    )
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('DELETE /api/admin/klassen error:', msg)
    return NextResponse.json(
      { error: msg },
      { status: 500, headers: NO_STORE_HEADERS },
    )
  }
}
