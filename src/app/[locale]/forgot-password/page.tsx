'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'

function ForgotPasswordForm() {
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/login'

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/send-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) throw new Error('Er ging iets mis')
      setSent(true)
    } catch {
      setError('Er ging iets mis bij het versturen van de reset-mail. Probeer het opnieuw.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4">
        <div className="w-full max-w-[400px]">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-[#eee] text-center">
            <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-5">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#4CAF82" strokeWidth="2">
                <path d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <h2 className="font-['Cormorant_Garamond'] text-[24px] text-[#1a1a1a] mb-3">E-mail verzonden</h2>
            <p className="text-[13px] text-[#888] mb-6 leading-relaxed">
              We hebben een link gestuurd naar <strong>{email}</strong> om je wachtwoord te herstellen. Controleer ook je spamfolder.
            </p>
            <a href="/login" className="inline-block text-[13px] font-medium text-[#D4AF37] hover:underline">
              ← Terug naar inloggen
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4">
      <div className="w-full max-w-[400px]">
        <div className="mb-10"></div>

        <div className="bg-white rounded-2xl p-8 shadow-sm border border-[#eee]">
          <h2 className="font-['Cormorant_Garamond'] text-[24px] text-[#1a1a1a] mb-3 text-center">Wachtwoord vergeten</h2>
          <p className="text-[12px] text-[#888] mb-6 text-center">
            Vul je e-mailadres in en we sturen je een link om een nieuw wachtwoord in te stellen.
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-[13px] rounded-xl px-4 py-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888] mb-1.5 block">
                E-mailadres
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-[#ddd] bg-white text-[14px] focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/20 transition"
                placeholder="jou@email.nl"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-full bg-[#D4AF37] text-white font-semibold text-[14px] hover:bg-[#C5A028] transition disabled:opacity-50"
            >
              {loading ? 'Bezig...' : 'Stuur reset-link'}
            </button>
          </form>

          <p className="text-center text-[12px] text-[#aaa] mt-6">
            <a href="/login" className="text-[#D4AF37] font-medium hover:underline">
              ← Terug naar inloggen
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center"><div className="text-[#888] text-[14px]">Laden...</div></div>}>
      <ForgotPasswordForm />
    </Suspense>
  )
}
