import { supabase } from '@/lib/supabase-client'

export type RoleLevel = 0 | 10 | 20 | 30 | 100
export const ROLE = {
  prospect: 0 as RoleLevel,
  client: 10 as RoleLevel,
  vip_client: 20 as RoleLevel,
  student: 30 as RoleLevel,
  admin: 100 as RoleLevel,
} as const

export const ROLE_LABELS: Record<number, string> = {
  0: 'Prospect',
  10: 'Client',
  20: 'VIP Client',
  30: 'Student',
  100: 'Admin',
}

export async function getCurrentUserRole(): Promise<RoleLevel> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return 0
  const { data } = await supabase
    .from('profiles')
    .select('role_level')
    .eq('id', session.user.id)
    .single()
  return (data?.role_level as RoleLevel) ?? 0
}

export async function isUserEnrolled(courseId: string): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return false
  const { data } = await supabase
    .from('enrollments')
    .select('id')
    .eq('user_id', session.user.id)
    .eq('course_id', courseId)
    .eq('status', 'active')
    .maybeSingle()
  return !!data
}
