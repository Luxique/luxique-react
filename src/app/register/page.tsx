'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
        data: { full_name: fullName },
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
      // Check if email confirmation is needed
      router.push('/login?message=check-email')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-10">
          <h1 className="font-['Cormorant_Garamond'] text-[36px] tracking-[0.15em] text-[#1a1a1a]">LUXIQUE</h1>
          <p className="text-[13px] text-[#888] mt-2 tracking-wide">Academy by Chiva</p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-sm border border-[#eee]">
          <h2 className="font-['Cormorant_Garamond'] text-[24px] text-[#1a1a1a] mb-6 text-center">Account aanmaken</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-[13px] rounded-xl px-4 py-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888] mb-1.5 block">
                Volledige naam
              </label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-[#ddd] bg-white text-[14px] focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/20 transition"
                placeholder="Je naam"
              />
            </div>

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

            <div>
              <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888] mb-1.5 block">
                Wachtwoord
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-4 py-3 rounded-xl border border-[#ddd] bg-white text-[14px] focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/20 transition"
                placeholder="Minimaal 8 tekens"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888] mb-1.5 block">
                Bevestig wachtwoord
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
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
              {loading ? 'Bezig...' : 'Account aanmaken'}
            </button>
          </form>

          <p className="text-center text-[12px] text-[#aaa] mt-6">
            Al een account?{' '}
            <a href="/login" className="text-[#D4AF37] font-medium hover:underline">
              Inloggen
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
