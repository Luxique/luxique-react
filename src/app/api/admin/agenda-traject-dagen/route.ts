import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

const NO_STORE_HEADERS = {
  'Cache-Control': 'private, no-store, no-cache, must-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
}

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE_HEADERS })
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req)
  if (!auth.ok) return json({ error: auth.error || 'Geen toegang.' }, auth.status || 401)

  try {
    const { data: klassen, error: klassenError } = await supabaseAdmin
      .from('traject_klassen')
      .select(`
        id,
        blok_dagen,
        starttijd,
        eindtijd,
        max_deelnemers,
        status,
        weergave_titel,
        traject_cursussen (naam)
      `)
      .order('startdatum', { ascending: true })

    if (klassenError) {
      console.error('[admin-agenda-traject-dagen] Klassen laden mislukt:', klassenError)
      return json({ error: 'Traject-dagen laden mislukt.' }, 500)
    }

    const klasIds = (klassen || []).map(klas => klas.id)
    const countMap = new Map<string, number>()

    if (klasIds.length > 0) {
      const { data: boekingen, error: boekingenError } = await supabaseAdmin
        .from('traject_boekingen')
        .select('klas_id')
        .eq('aanbetaling_status', 'betaald')
        .in('klas_id', klasIds)

      if (boekingenError) {
        console.error('[admin-agenda-traject-dagen] Deelnemers tellen mislukt:', boekingenError)
        return json({ error: 'Traject-deelnemers laden mislukt.' }, 500)
      }

      for (const boeking of boekingen || []) {
        countMap.set(boeking.klas_id, (countMap.get(boeking.klas_id) || 0) + 1)
      }
    }

    const trajectDagen = (klassen || []).map(klas => {
      const cursus = Array.isArray(klas.traject_cursussen)
        ? klas.traject_cursussen[0]
        : klas.traject_cursussen

      return {
        id: klas.id,
        blok_dagen: klas.blok_dagen || [],
        cursus_naam: cursus?.naam || 'Onbekend traject',
        titel: klas.weergave_titel || cursus?.naam || 'Onbekend traject',
        starttijd: klas.starttijd,
        eindtijd: klas.eindtijd || '19:00',
        betaald_aantal: countMap.get(klas.id) || 0,
        max_deelnemers: klas.max_deelnemers,
        status: klas.status,
      }
    })

    return json({ trajectDagen })
  } catch (error) {
    console.error('[admin-agenda-traject-dagen] GET mislukt:', error)
    return json({ error: 'Traject-dagen laden mislukt.' }, 500)
  }
}
