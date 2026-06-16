'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

/**
 * LoginGate — shows children (Cal widget) ONLY when authenticated.
 * When unauthenticated: renders a styled login overlay, NO Cal widget in DOM.
 * When loading: shows a neutral spinner.
 */
export function LoginGate({
  children,
  returnUrl,
  title = 'Log in om te boeken',
  subtitle = 'Zodat we je afspraak aan je account koppelen en je boekingen altijd terugvindt in je dashboard.',
}: {
  children: React.ReactNode
  returnUrl?: string
  title?: string
  subtitle?: string
}) {
  const { user, loading } = useAuth()
  const router = useRouter()

  const redirectUrl = returnUrl || (typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/booking')

  useEffect(() => {
    // No auto-redirect — let user click the CTA
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: 400 }}>
        <div className="text-[#9a9183] text-[14px] font-['Jost',sans-serif]">Laden...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div
        className="flex items-center justify-center px-6 py-16"
        style={{
          background: 'radial-gradient(600px 400px at 50% -8%, rgba(176,141,79,0.10), transparent 62%), #f6f1e7',
          minHeight: 400,
          borderRadius: 18,
        }}
      >
        <div className="text-center" style={{ maxWidth: 420 }}>
          {/* Lock icon */}
          <div
            className="mx-auto mb-6 flex items-center justify-center"
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'rgba(176,141,79,0.12)',
              border: '1px solid rgba(176,141,79,0.25)',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#b08d4f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>

          <h3
            className="mb-3"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 'clamp(24px, 4vw, 32px)',
              fontWeight: 500,
              color: '#1C1814',
              lineHeight: 1.2,
            }}
          >
            {title}
          </h3>

          <p
            className="mb-8"
            style={{
              fontFamily: "'Jost', sans-serif",
              fontSize: 15,
              color: '#6a6256',
              lineHeight: 1.7,
              maxWidth: 340,
              marginInline: 'auto',
            }}
          >
            {subtitle}
          </p>

          <button
            onClick={() => router.push(`/login?redirect=${encodeURIComponent(redirectUrl)}`)}
            className="inline-block"
            style={{
              fontFamily: "'Jost', sans-serif",
              fontSize: 15,
              fontWeight: 600,
              color: '#fff',
              background: 'linear-gradient(180deg, #b08d4f, #9a7838)',
              padding: '14px 36px',
              borderRadius: 999,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(176,141,79,0.25)',
              transition: 'transform 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            Inloggen / account aanmaken →
          </button>
        </div>
      </div>
    )
  }

  // Authenticated — render the Cal widget
  return <>{children}</>
}
