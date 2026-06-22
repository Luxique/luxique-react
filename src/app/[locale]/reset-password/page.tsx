'use client'

import { Suspense, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase-client'

function ResetPasswordForm() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Supabase will have a session from the reset link
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setError('Ongeldige of verlopen link. Vraag een nieuwe reset-link aan.')
      } else {
        setReady(true)
      }
    })
  }, [])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Wachtwoord moet minimaal 6 tekens lang zijn')
      return
    }
    if (password !== confirm) {
      setError('Wachtwoorden komen niet overeen')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      setDone(true)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4">
        <div className="w-full max-w-[400px]">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-[#eee] text-center">
            <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-5">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#4CAF82" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h2 className="font-['Cormorant_Garamond'] text-[24px] text-[#1a1a1a] mb-3">Wachtwoord bijgewerkt</h2>
            <p className="text-[13px] text-[#888] mb-6">
              Je nieuwe wachtwoord is ingesteld. Je kunt nu inloggen.
            </p>
            <a href="/login" className="inline-block px-6 py-2.5 rounded-full bg-[#D4AF37] text-white font-semibold text-[13px] hover:bg-[#C5A028] transition">
              Naar inloggen
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
          <h2 className="font-['Cormorant_Garamond'] text-[24px] text-[#1a1a1a] mb-6 text-center">Nieuw wachtwoord</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-[13px] rounded-xl px-4 py-3 mb-4">
              {error}
            </div>
          )}

          {ready && (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888] mb-1.5 block">
                  Nieuw wachtwoord
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 rounded-xl border border-[#ddd] bg-white text-[14px] focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/20 transition"
                  placeholder="Minimaal 6 tekens"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888] mb-1.5 block">
                  Herhaal wachtwoord
                </label>
                <input
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-[#ddd] bg-white text-[14px] focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/20 transition"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-full bg-[#D4AF37] text-white font-semibold text-[14px] hover:bg-[#C5A028] transition disabled:opacity-50"
              >
                {loading ? 'Bezig...' : 'Wachtwoord opslaan'}
              </button>
            </form>
          )}

          {!ready && !error && (
            <p className="text-center text-[13px] text-[#888]">Laden...</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center"><div className="text-[#888] text-[14px]">Laden...</div></div>}>
      <ResetPasswordForm />
    </Suspense>
  )
}
