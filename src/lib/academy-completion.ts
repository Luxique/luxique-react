'use client'

import { supabase } from '@/lib/supabase-client'

export async function checkEnrollmentCompletion(courseId: string): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) {
    console.error('[completion] Cannot check enrollment completion without an authenticated session')
    return
  }

  const response = await fetch('/api/academy/check-completion', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ courseId }),
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    console.error('[completion] Enrollment completion check failed:', response.status, payload)
  }
}
