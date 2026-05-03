'use client'

import { Suspense, useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [magicLinkSent, setMagicLinkSent] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message === 'Invalid login credentials'
        ? 'Ongeldig e-mailadres of wachtwoord'
        : error.message)
      setLoading(false)
    } else {
      router.push(redirect)
      router.refresh()
    }
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback?redirect=${redirect}`,
      },
    })

    if (error) {
      setError(error.message)
    } else {
      setMagicLinkSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-10">
          <h1 className="font-['Cormorant_Garamond'] text-[36px] tracking-[0.15em] text-[#1a1a1a]">LUXIQUE</h1>
          <p className="text-[13px] text-[#888] mt-2 tracking-wide">Academy by Chiva</p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-sm border border-[#eee]">
          <h2 className="font-['Cormorant_Garamond'] text-[24px] text-[#1a1a1a] mb-6 text-center">Inloggen</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-[13px] rounded-xl px-4 py-3 mb-4">
              {error}
            </div>
          )}

          {magicLinkSent && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-[13px] rounded-xl px-4 py-3 mb-4">
              ✨ Magic link verstuurd! Check je e-mail.
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
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
                className="w-full px-4 py-3 rounded-xl border border-[#ddd] bg-white text-[14px] focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/20 transition"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-full bg-[#D4AF37] text-white font-semibold text-[14px] hover:bg-[#C5A028] transition disabled:opacity-50"
            >
              {loading ? 'Bezig...' : 'Inloggen'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#eee]" />
            </div>
            <div className="relative flex justify-center text-[11px]">
              <span className="bg-white px-3 text-[#aaa]">of</span>
            </div>
          </div>

          <button
            onClick={handleMagicLink}
            disabled={loading || !email}
            className="w-full py-3 rounded-full border border-[#D4AF37] text-[#D4AF37] font-semibold text-[14px] hover:bg-[#D4AF37]/5 transition disabled:opacity-50"
          >
            Magic link via e-mail
          </button>

          <p className="text-center text-[12px] text-[#aaa] mt-6">
            Nog geen account?{' '}
            <a href="/register" className="text-[#D4AF37] font-medium hover:underline">
              Account aanmaken
            </a>
          </p>
        </div>

        <p className="text-center text-[10px] text-[#bbb] mt-6 tracking-wide">
          🔒 Beveiligd met end-to-end encryptie
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center"><div className="text-[#888] text-[14px]">Laden...</div></div>}>
      <LoginForm />
    </Suspense>
  )
}
