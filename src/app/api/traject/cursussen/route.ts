import { NextResponse } from 'next/server'
import { getTrajectCursussen } from '@/lib/traject'

/**
 * API endpoint: /api/traject/cursussen
 *
 * Haal alle actieve traject cursussen op.
 */
export async function GET() {
  try {
    const cursussen = await getTrajectCursussen()
    return NextResponse.json({ cursussen })
  } catch (error) {
    console.error('Fout in cursussen API:', error)
    return NextResponse.json(
      { error: 'Interne fout' },
      { status: 500 }
    )
  }
}