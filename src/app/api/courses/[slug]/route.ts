import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const supabase = getSupabase()
  
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('status')
    .eq('user_id', user.id)
    .single()

  const isActive = subscription?.status === 'active' || subscription?.status === 'trialing'
  
  if (!isActive) {
    return NextResponse.json({ error: 'Subscription required', active: false }, { status: 402 })
  }

  const { data: course, error } = await supabase
    .from('courses')
    .select('*, lessons(*)')
    .eq('slug', slug)
    .eq('published', true)
    .single()

  if (error || !course) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 })
  }

  await supabase.from('course_access_log').insert({
    user_id: user.id,
    course_id: course.id,
    accessed_at: new Date().toISOString(),
  })

  return NextResponse.json({ ...course, active: true })
}
