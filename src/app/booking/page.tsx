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

  return (
    <div className="min-h-screen bg-[#FAFAFA] pt-24 max-md:pt-20">

      <div className="max-w-3xl mx-auto px-6 py-16 max-md:px-4 max-md:py-8">
        <h1 className="font-['Cormorant_Garamond'] text-[clamp(32px,6vw,48px)] text-[#1a1a1a] mb-4">
          Plan een afspraak
        </h1>
        <div className="w-20 h-0.5 bg-[#D4AF37] mb-10" />

        <div className="bg-white rounded-2xl border border-[#eee] overflow-hidden">
          {/* Cal.com embed — light theme + month_view */}
          <div className="p-8 max-md:p-4">
            <p className="text-[14px] text-[#888] mb-6">
              Kies een datum en tijd voor je lash behandeling of consult.
            </p>
            <div className="rounded-xl overflow-hidden border border-[#eee]">
              <iframe
                src="https://cal.com/glennisha-daams-zan8ht?embed=&theme=light&layout=month_view"
                title="Boek een afspraak"
                className="w-full border-0"
                style={{ height: '700px', minHeight: '600px' }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
