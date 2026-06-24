'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase-client'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password !== confirmPassword) {
      setError('Wachtwoorden komen niet overeen')
      setLoading(false)
      return
    }

    if (password.length < 8) {
      setError('Wachtwoord moet minimaal 8 tekens bevatten')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { first_name: firstName, last_name: lastName, full_name: `${firstName} ${lastName}` },
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })

    if (error) {
      if (error.message.includes('already registered')) {
        setError('Dit e-mailadres is al geregistreerd')
      } else {
        setError(error.message)
      }
      setLoading(false)
    } else {
      // Send branded M01 confirmation email via Resend (Supabase's own email should be disabled)
      try {
        await fetch('/api/auth/send-confirmation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        })
      } catch (e) {
        console.error('Failed to send branded confirmation email:', e)
      }
      setLoading(false)
      setSuccess(true)
    }
  }

  const inputClass = "w-full px-4 py-3 rounded-xl border border-[#ddd] bg-white text-[14px] focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/20 transition"
  const labelClass = "text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888] mb-1.5 block"

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4">
      <div className="w-full max-w-[400px]">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-[#eee]">

          {success ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-[#D4AF37]/10 flex items-center justify-center mx-auto mb-5">
                <svg className="w-8 h-8 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>
              <h2 className="font-['Cormorant_Garamond'] text-[24px] text-[#1a1a1a] mb-3">Controleer je e-mail</h2>
              <p className="text-[14px] text-[#888] leading-relaxed mb-6">
                Wij hebben een verificatielink gestuurd naar <span className="text-[#1a1a1a] font-medium">{email}</span>. Klik op de link om je account te activeren.
              </p>
              <a href="/login" className="inline-block px-8 py-3 rounded-full bg-[#D4AF37] text-white font-semibold text-[14px] hover:bg-[#C5A028] transition">
                Naar inloggen
              </a>
            </div>
          ) : (
            <>
              <h2 className="font-['Cormorant_Garamond'] text-[24px] text-[#1a1a1a] mb-6 text-center">Account aanmaken</h2>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-[13px] rounded-xl px-4 py-3 mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Voornaam</label>
                    <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required className={inputClass} placeholder="Voornaam" />
                  </div>
                  <div>
                    <label className={labelClass}>Achternaam</label>
                    <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} required className={inputClass} placeholder="Achternaam" />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>E-mailadres</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className={inputClass} placeholder="jou@email.nl" />
                </div>

                <div>
                  <label className={labelClass}>Wachtwoord</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} className={inputClass} placeholder="Minimaal 8 tekens" />
                </div>

                <div>
                  <label className={labelClass}>Bevestig wachtwoord</label>
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={8} className={inputClass} placeholder="Herhaal wachtwoord" />
                </div>

                <button type="submit" disabled={loading} className="w-full py-3 rounded-full bg-[#D4AF37] text-white font-semibold text-[14px] hover:bg-[#C5A028] transition disabled:opacity-50">
                  {loading ? 'Bezig...' : 'Account aanmaken'}
                </button>
              </form>

              <p className="text-center text-[12px] text-[#aaa] mt-6">
                Al een account?{' '}
                <a href="/login" className="text-[#D4AF37] font-medium hover:underline">Inloggen</a>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
