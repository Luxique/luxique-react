'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'

export default function Navbar() {
  const { user, role, signOut } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const navLinks = [
    { label: 'Behandelingen', href: '/#behandelingen' },
    { label: 'Academy', href: '/courses' },
    { label: 'Over ons', href: '/about' },
    { label: 'Reviews', href: '/#reviews' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Contact', href: '/contact' },
  ]

  const firstName = user?.user_metadata?.first_name || user?.user_metadata?.full_name?.split(' ')[0] || ''

  return (
    <>
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-[960px]">
        <div className="flex items-center justify-between px-4 h-14 bg-white/60 backdrop-blur-xl border border-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.08)] rounded-[28px]">

          {/* Left: Hamburger (mobile) */}
          <button className="md:hidden flex flex-col gap-1 p-1" onClick={() => setMobileOpen(!mobileOpen)}>
            <span className={`w-5 h-0.5 bg-[var(--dark)] transition-all ${mobileOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`w-5 h-0.5 bg-[var(--dark)] transition-all ${mobileOpen ? 'opacity-0' : ''}`} />
            <span className={`w-5 h-0.5 bg-[var(--dark)] transition-all ${mobileOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>

          {/* Center: Logo */}
          <a href="/" className="absolute left-1/2 -translate-x-1/2 font-['Avenir_Next'] text-[18px] tracking-[0.25em] font-[100] text-[var(--dark)] uppercase select-none">
            LUXIQUE
          </a>

          {/* Left desktop links */}
          <div className="hidden md:flex items-center gap-4">
            {navLinks.slice(0, 3).map(l => (
              <a key={l.href} href={l.href} className="text-[12px] font-medium text-[var(--text2)] hover:text-[#D4AF37] transition">{l.label}</a>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                {/* Logged in: profile dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 px-2 py-1 rounded-full hover:bg-[#f5f5f5] transition">
                    <div className="w-8 h-8 rounded-full bg-[#D4AF37] flex items-center justify-center text-white text-[12px] font-semibold">
                      {firstName ? firstName[0].toUpperCase() : 'U'}
                    </div>
                    <span className="hidden md:block text-[12px] font-medium text-[#1a1a1a] max-w-[80px] truncate">{firstName || 'Profiel'}</span>
                    <svg className={`w-3.5 h-3.5 text-[#888] transition ${profileOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 top-12 w-[220px] bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-[#eee] overflow-hidden py-1">
                      <div className="px-4 py-3 border-b border-[#f0f0f0]">
                        <p className="text-[13px] font-medium text-[#1a1a1a]">{user.user_metadata?.full_name || firstName || 'Gebruiker'}</p>
                        <p className="text-[11px] text-[#888] truncate">{user.email}</p>
                      </div>

                      <a href="/dashboard" className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#fafafa] transition">
                        <span className="text-[14px]">📊</span>
                        <span className="text-[13px] text-[#1a1a1a]">Dashboard</span>
                      </a>
                      <a href="/profile" className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#fafafa] transition">
                        <span className="text-[14px]">👤</span>
                        <span className="text-[13px] text-[#1a1a1a]">Profiel</span>
                      </a>
                      <a href="/booking" className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#fafafa] transition">
                        <span className="text-[14px]">📅</span>
                        <span className="text-[13px] text-[#1a1a1a]">Boek afspraak</span>
                      </a>
                      <a href="/courses" className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#fafafa] transition">
                        <span className="text-[14px]">🎬</span>
                        <span className="text-[13px] text-[#1a1a1a]">Cursussen</span>
                      </a>

                      {role === 'admin' && (
                        <>
                          <div className="border-t border-[#f0f0f0] my-1" />
                          <a href="/admin" className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#fafafa] transition">
                            <span className="text-[14px]">⚡</span>
                            <span className="text-[13px] text-[#D4AF37] font-medium">Admin</span>
                          </a>
                        </>
                      )}

                      <div className="border-t border-[#f0f0f0] my-1" />
                      <button onClick={() => { signOut(); setProfileOpen(false) }} className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#fafafa] transition w-full text-left">
                        <span className="text-[14px]">👋</span>
                        <span className="text-[13px] text-[#888]">Uitloggen</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <a href="/booking" className="text-[12px] font-semibold text-[#D4AF37] border border-[#D4AF37] px-4 py-2 rounded-full hover:bg-[#D4AF37] hover:text-white transition hidden md:inline-flex">
                  Book
                </a>
                <a href="/login" className="text-[12px] font-semibold text-white bg-[#D4AF37] px-4 py-2 rounded-full hover:bg-[#C5A028] transition hidden md:inline-flex">
                  Login
                </a>
                <a href="/login" className="md:hidden w-8 h-8 rounded-full bg-[#D4AF37] flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </a>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
          <div className="absolute left-4 top-24 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl p-6 w-[260px] space-y-1 border border-white/30" onClick={e => e.stopPropagation()}>
            {navLinks.map(l => (
              <a key={l.href} href={l.href} className="block text-[14px] py-2.5 px-3 rounded-xl hover:bg-[#D4AF37]/5 transition" onClick={() => setMobileOpen(false)}>
                {l.label}
              </a>
            ))}
            <hr className="border-black/[0.06] my-2" />
            {user ? (
              <>
                <a href="/dashboard" className="block text-[14px] py-2.5 px-3 rounded-xl hover:bg-[#D4AF37]/5 transition" onClick={() => setMobileOpen(false)}>Dashboard</a>
                <a href="/profile" className="block text-[14px] py-2.5 px-3 rounded-xl hover:bg-[#D4AF37]/5 transition" onClick={() => setMobileOpen(false)}>Profiel</a>
                {role === 'admin' && <a href="/admin" className="block text-[14px] py-2.5 px-3 rounded-xl text-[#D4AF37] font-medium hover:bg-[#D4AF37]/5 transition" onClick={() => setMobileOpen(false)}>⚡ Admin</a>}
                <button onClick={() => { signOut(); setMobileOpen(false) }} className="block text-[14px] py-2.5 px-3 rounded-xl text-[#888] hover:bg-[#D4AF37]/5 transition w-full text-left">Uitloggen</button>
              </>
            ) : (
              <a href="/login" className="block text-[14px] py-2.5 px-3 rounded-xl text-[#D4AF37] font-semibold hover:bg-[#D4AF37]/5 transition" onClick={() => setMobileOpen(false)}>Inloggen</a>
            )}
          </div>
        </div>
      )}
    </>
  )
}
