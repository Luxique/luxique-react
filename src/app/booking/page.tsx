'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function BookingPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/booking')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="text-[#888] text-[14px]">Laden...</div>
      </div>
    )
  }

  if (!user) return null

  // Prefill Cal.com iframe with logged-in user's name + email (comfort only — koppeling loopt via user_id)
  const userEmail = user.email || ''
  // Try user.user_metadata.first_name, fallback to email prefix
  const firstName = user.user_metadata?.first_name || (userEmail ? userEmail.split('@')[0] : '')
  const calSrc = `https://cal.com/luxique?embed=&theme=light&layout=month_view&name=${encodeURIComponent(firstName)}&email=${encodeURIComponent(userEmail)}`

  return (
    <div className="min-h-screen bg-[#FAFAFA] pt-[72px] max-md:pt-[62px]">
      <div className="mx-auto px-6 pt-4 pb-2 max-md:px-3 max-md:pt-2">
        <h1 className="font-['Cormorant_Garamond'] text-[clamp(28px,5vw,42px)] text-[#1a1a1a] mb-1">
          Plan een afspraak
        </h1>
        <div className="w-16 h-0.5 bg-[#D4AF37] mb-3" />
      </div>
      {/* Full-height iframe — no inner padding/margins */}
      <div className="px-6 max-md:px-3" style={{ height: 'calc(100vh - 120px)' }}>
        <iframe
          src={calSrc}
          title="Boek een afspraak"
          className="w-full h-full border-0 rounded-xl"
        />
      </div>
    </div>
  )
}
