import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function adminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function GET() {
  const { data, error } = await adminClient()
    .from('site_settings')
    .select('academy_coming_soon')
    .eq('id', 'global')
    .maybeSingle()

  // Keep the academy live until CJ has run the supplied migration.
  if (error) return NextResponse.json({ academyComingSoon: false, settingsAvailable: false })
  return NextResponse.json({ academyComingSoon: data?.academy_coming_soon === true, settingsAvailable: true })
}

export async function PATCH(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = adminClient()
  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role, role_level').eq('id', user.id).maybeSingle()
  if (profile?.role !== 'admin' && Number(profile?.role_level || 0) < 100) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  if (typeof body.academyComingSoon !== 'boolean') {
    return NextResponse.json({ error: 'academyComingSoon must be boolean' }, { status: 400 })
  }

  const { data, error } = await supabase.from('site_settings').upsert({
    id: 'global',
    academy_coming_soon: body.academyComingSoon,
    updated_at: new Date().toISOString(),
    updated_by: user.id,
  }).select('academy_coming_soon').single()

  if (error) return NextResponse.json({ error: 'Setting could not be saved' }, { status: 500 })
  return NextResponse.json({ academyComingSoon: data.academy_coming_soon })
}
