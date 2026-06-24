'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'

export default function EmailVerifiedPage() {
  const router = useRouter()
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    // Verify the session is valid
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.replace('/login')
        return
      }
    }
    checkSession()

    // Countdown redirect
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          router.push('/dashboard')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [router])

  return (
    <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center px-4">
      <div className="w-full max-w-[440px] text-center">
        {/* Success icon */}
        <div className="w-20 h-20 rounded-full bg-[#C4A265]/10 flex items-center justify-center mx-auto mb-8">
          <svg className="w-10 h-10 text-[#C4A265]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>

        <div className="font-[Arial,sans-serif] text-[11px] tracking-[3px] uppercase text-[#C4A265] mb-4">
          All set
        </div>

        <h1 className="font-['Cormorant_Garamond'] text-[36px] leading-[42px] font-medium text-[#0C0A07] mb-6">
          Your email has been verified
        </h1>

        <p className="font-[Arial,sans-serif] text-[16px] leading-[26px] text-[#4a463e] mb-10 max-w-[380px] mx-auto">
          Welcome to Luxique. Your account is now active — you have full access to the Academy, your courses, and your personal dashboard.
        </p>

        <button
          onClick={() => router.push('/dashboard')}
          className="inline-block px-10 py-4 rounded-[9px] bg-[#C4A265] text-[#0C0A07] font-bold text-[15px] tracking-[0.5px] hover:bg-[#D8B978] transition cursor-pointer border-none"
          style={{ background: 'linear-gradient(180deg, #D8B978, #C4A265)' }}
        >
          Go to dashboard
        </button>

        <p className="font-[Arial,sans-serif] text-[13px] text-[#8a857b] mt-8">
          Redirecting automatically in {countdown}s…
        </p>

        <div className="mt-12 pt-8 border-t border-[#e4ddd0]">
          <div className="font-['Cormorant_Garamond'] italic text-[18px] text-[#C4A265]">
            With love, Luxique
          </div>
        </div>
      </div>
    </div>
  )
}
