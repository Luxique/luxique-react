import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

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

  // Normalize level to lowercase enum
  const LEVEL_MAP: Record<string, string> = {
    'beginner': 'beginner',
    'intermediate': 'intermediate',
    'advanced': 'advanced',
    'gevorderd': 'advanced', // Dutch label maps to advanced
    'expert': 'advanced',
  }
  const normalizedLevel = LEVEL_MAP[(level || '').toLowerCase()] || 'beginner'

  const { data, error } = await supabase
    .from('courses')
    .insert({
      title,
      description: description || '',
      slug,
      level: normalizedLevel,
      price: 0,
      status: 'draft'
    })
    .select()
    .single()

  if (error) {
    console.error('[courses/create] DB error:', error.code, error.message, { level: normalizedLevel, title })
    return NextResponse.json({ 
      error: `Database fout (${error.code}): ${error.message}`,
      details: { level: normalizedLevel, constraint: error.code === '23514' ? 'courses_level_check' : undefined }
    }, { status: 500 })
  }

  return NextResponse.json({ data })
}
