import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { title, description, level, user_id } = body

  if (!title || !user_id) {
    return NextResponse.json({ error: 'title and user_id required' }, { status: 400 })
  }

  // Verify admin role
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profile } = await supabase
    .from('profiles')
    .select('role_level')
    .eq('id', user_id)
    .single()

  if (!profile || profile.role_level === undefined || profile.role_level < 100) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const slug = title.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

  const { data, error } = await supabase
    .from('courses')
    .insert({
      title,
      description: description || '',
      slug,
      level: level || 'Beginner',
      price: 0,
      status: 'draft'
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}
