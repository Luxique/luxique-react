'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'

export default function AcademyComingSoonGate({ children }: { children: React.ReactNode }) {
  const { role, loading: authLoading } = useAuth()
  const [comingSoon, setComingSoon] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch('/api/site-settings/academy', { cache: 'no-store' })
      .then(response => response.json())
      .then(data => setComingSoon(data.academyComingSoon === true))
      .finally(() => setLoaded(true))
  }, [])

  const blocked = loaded && !authLoading && comingSoon && role !== 'admin'

  return (
    <div className="relative min-h-screen">
      <div aria-hidden={blocked} className={blocked ? 'pointer-events-none select-none blur-[12px]' : ''}>
        {children}
      </div>
      {blocked && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#0C0A07]/35 px-5 backdrop-blur-[10px]" role="status">
          <div className="w-full max-w-[460px] rounded-[28px] border border-[#D8B97A]/35 bg-[#15110d]/95 px-8 py-12 text-center shadow-[0_30px_90px_rgba(0,0,0,.38)]">
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.32em] text-[#C4A265]">LUXIQUE Academy</p>
            <h1 className="font-['Cormorant_Garamond'] text-[clamp(2.8rem,10vw,4.5rem)] font-medium italic leading-none text-[#FBF8F2]">Coming soon</h1>
            <div className="mx-auto my-6 h-px w-16 bg-[#C4A265]/65" />
            <p className="mx-auto max-w-[330px] text-[14px] leading-6 text-[#FBF8F2]/65">We leggen de laatste hand aan een nieuwe leeromgeving. Binnenkort ontdek je hier de volledige LUXIQUE Academy.</p>
          </div>
        </div>
      )}
    </div>
  )
}
