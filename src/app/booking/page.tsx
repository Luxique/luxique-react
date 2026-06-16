'use client'

import { useAuth } from '@/lib/auth-context'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import { LoginGate } from '@/components/LoginGate'
import CalEmbed from '@/components/CalEmbed'

export default function BookingPage() {
  const { user } = useAuth()
  const [profileName, setProfileName] = useState<string | null>(null)

  // Fetch the user's real name from profiles table
  useEffect(() => {
    if (!user?.id) return
    supabase
      .from('profiles')
      .select('first_name, last_name, full_name')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          const name = data.first_name || data.full_name || null
          setProfileName(name)
        }
      })
  }, [user?.id])

  const userEmail = user?.email || ''
  // Use real name from profile, or leave empty (NO email prefix fallback)
  const attendeeName = profileName || ''

  return (
    <div className="min-h-screen bg-[#FAFAFA] pt-[72px] max-md:pt-[62px]">
      <div className="mx-auto px-6 pt-4 pb-2 max-md:px-3 max-md:pt-2">
        <h1 className="font-['Cormorant_Garamond'] text-[clamp(28px,5vw,42px)] text-[#1a1a1a] mb-1">
          Plan een afspraak
        </h1>
        <div className="w-16 h-0.5 bg-[#D4AF37] mb-3" />
      </div>
      <div className="px-6 max-md:px-3" style={{ height: 'calc(100vh - 120px)' }}>
        <LoginGate returnUrl="/booking">
          <CalEmbed
            calLink="luxique"
            name={attendeeName}
            email={userEmail}
            theme="light"
            layout="month_view"
          />
        </LoginGate>
      </div>
    </div>
  )
}
