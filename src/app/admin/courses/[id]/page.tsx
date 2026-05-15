'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function CourseIdRedirect() {
  const router = useRouter()
  const params = useParams()
  
  useEffect(() => {
    if (params.id) {
      router.replace(`/admin/courses/${params.id}/builder`)
    } else {
      router.replace('/admin/courses')
    }
  }, [router, params.id])
  
  return (
    <div style={{ minHeight: '100vh', background: '#F0EDE6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#7A7268', fontSize: '14px', fontFamily: 'Outfit, sans-serif' }}>Redirecting to builder...</div>
    </div>
  )
}
