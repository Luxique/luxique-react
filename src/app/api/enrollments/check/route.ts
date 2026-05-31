import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const user_id = searchParams.get('user_id')
  const course_id = searchParams.get('course_id')

  if (!user_id || !course_id) {
    return NextResponse.json({ error: 'user_id and course_id required' }, { status: 400 })
  }

  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabase
    .from('enrollments')
    .select('id, status')
    .eq('user_id', user_id)
    .eq('course_id', course_id)
    .eq('status', 'active')
    .limit(1)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ enrolled: data && data.length > 0 })
}
