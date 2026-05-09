'use client'

import { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

export default function Navbar() {
  const { user, role, signOut } = useAuth()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const isAcademyPage = pathname === '/courses' || pathname.startsWith('/courses/')

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const firstName = user?.user_metadata?.first_name || user?.user_metadata?.full_name?.split(' ')[0] || ''

  return (
    <>
      <nav className="fixed top-[14px] max-md:top-[10px] left-0 right-0 z-50 flex items-center gap-[10px] h-[52px] max-md:h-[48px] shrink-0 px-[14px] max-md:px-[10px]">
        {/* Mobile: hamburger circle — FIRST in DOM */}
        <button onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden w-[48px] h-[48px] rounded-full bg-[rgba(22,19,16,0.84)] backdrop-blur-[28px] border border-[rgba(196,162,101,0.15)] flex items-center justify-center cursor-pointer shrink-0">
          <div className="flex flex-col gap-[4.5px] items-center">
            <span className={`w-[18px] h-[1.5px] bg-[rgba(255,255,255,0.65)] rounded-[2px] transition-all ${mobileOpen ? 'rotate-45 translate-y-[6px]' : ''}`} />
            <span className={`w-[18px] h-[1.5px] bg-[rgba(255,255,255,0.65)] rounded-[2px] transition-all ${mobileOpen ? 'opacity-0' : ''}`} />
            <span className={`w-[18px] h-[1.5px] bg-[rgba(255,255,255,0.65)] rounded-[2px] transition-all ${mobileOpen ? '-rotate-45 -translate-y-[6px]' : ''}`} />
          </div>
        </button>

        <div className="relative h-[52px] max-md:h-[48px]">
          <div className="h-[52px] max-md:h-[48px] rounded-full bg-[rgba(22,19,16,0.84)] backdrop-blur-[28px] border border-[rgba(196,162,101,0.15)] flex items-center justify-center shrink-0 md:shrink md:flex-none md:px-[26px] max-md:flex-1 max-md:px-4">
            <a href="/" className="font-['Avenir_Next'] max-md:font-['Josefin_Sans'] text-[18px] max-md:text-[15px] font-[400] tracking-[0.45em] max-md:tracking-[0.35em] text-white uppercase whitespace-nowrap select-none">
              Luxique
            </a>
          </div>
          {isAcademyPage && (
            <span className="absolute -right-[10px] -top-[6px] px-[10px] py-[2px] rounded-full bg-[rgba(22,19,16,0.92)] backdrop-blur-[16px] border border-[rgba(196,162,101,0.3)] text-[8px] font-semibold tracking-[0.18em] uppercase text-[#C4A265] whitespace-nowrap z-10 pointer-events-none">
              Academy
            </span>
          )}
        </div>

        {/* Desktop: links pill */}
        <div className="hidden md:flex h-[52px] flex-1 items-center justify-center px-5 gap-8 rounded-full bg-[rgba(22,19,16,0.84)] backdrop-blur-[28px] border border-[rgba(196,162,101,0.15)]">
          {['Behandelingen', 'Academy', 'Over ons'].map(label => (
            <a key={label} href={label === 'Behandelingen' ? '/#behandelingen' : label === 'Academy' ? '/courses' : '/about'}
              className="text-[12px] tracking-[0.05em] text-[rgba(255,255,255,0.55)] hover:text-[#DFC08A] transition-colors whitespace-nowrap">
              {label}
            </a>
          ))}
          <a href="/booking" className="text-[12px] font-medium px-5 py-2 rounded-full bg-[#C4A265] text-[#0C0A07] hover:bg-[#DFC08A] transition-colors whitespace-nowrap ml-2">
            Boek
          </a>
        </div>

        {/* Login / Profile circle */}
        {user ? (
          <div className="relative" ref={dropdownRef}>
            <button onClick={() => setProfileOpen(!profileOpen)}
              className="w-[52px] h-[52px] rounded-full bg-[rgba(22,19,16,0.84)] backdrop-blur-[28px] border border-[rgba(196,162,101,0.15)] flex items-center justify-center cursor-pointer shrink-0">
              <div className="w-[22px] h-[22px] rounded-full bg-[#C4A265] flex items-center justify-center text-white text-[10px] font-semibold">
                {firstName ? firstName[0].toUpperCase() : 'U'}
              </div>
            </button>
            {profileOpen && (
              <div className="absolute right-0 top-[60px] w-[220px] bg-[rgba(22,19,16,0.95)] backdrop-blur-[28px] rounded-2xl border border-[rgba(196,162,101,0.15)] overflow-hidden py-1 z-50">
                <div className="px-4 py-3 border-b border-[rgba(196,162,101,0.1)]">
                  <p className="text-[13px] font-medium text-white">{user.user_metadata?.full_name || firstName || 'Gebruiker'}</p>
                  <p className="text-[11px] text-[rgba(255,255,255,0.4)] truncate">{user.email}</p>
                </div>
                {[
                  { icon: '📊', label: 'Dashboard', href: '/dashboard' },
                  { icon: '🎬', label: 'Cursussen', href: '/courses' },
                  { icon: '📅', label: 'Boeken', href: '/booking' },
                  { icon: '👤', label: 'Profiel', href: '/profile' },
                ].map(item => (
                  <a key={item.href} href={item.href} className="flex items-center gap-3 px-4 py-2.5 hover:bg-[rgba(196,162,101,0.08)] transition">
                    <span className="text-[14px]">{item.icon}</span>
                    <span className="text-[13px] text-[rgba(255,255,255,0.7)]">{item.label}</span>
                  </a>
                ))}
                {role === 'admin' && (
                  <>
                    <div className="border-t border-[rgba(196,162,101,0.1)] my-1" />
                    <a href="/admin" className="flex items-center gap-3 px-4 py-2.5 hover:bg-[rgba(196,162,101,0.08)] transition">
                      <span className="text-[14px]">⚡</span>
                      <span className="text-[13px] text-[#C4A265] font-medium">Dashboard</span>
                    </a>
                    <a href="/admin/courses" className="flex items-center gap-3 px-4 py-2.5 hover:bg-[rgba(196,162,101,0.08)] transition">
                      <span className="text-[14px]">📚</span>
                      <span className="text-[13px] text-[rgba(255,255,255,0.5)]">Cursus Builder</span>
                    </a>
                    <a href="/admin/customers" className="flex items-center gap-3 px-4 py-2.5 hover:bg-[rgba(196,162,101,0.08)] transition">
                      <span className="text-[14px]">👥</span>
                      <span className="text-[13px] text-[rgba(255,255,255,0.5)]">Klanten</span>
                    </a>
                  </>
                )}
                <div className="border-t border-[rgba(196,162,101,0.1)] my-1" />
                <button onClick={() => { signOut(); setProfileOpen(false) }}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-[rgba(196,162,101,0.08)] transition w-full text-left">
                  <span className="text-[14px]">👋</span>
                  <span className="text-[13px] text-[rgba(255,255,255,0.4)]">Uitloggen</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <a href="/login" title="Inloggen"
            className="w-[52px] h-[52px] rounded-full bg-[rgba(22,19,16,0.84)] backdrop-blur-[28px] border border-[rgba(196,162,101,0.15)] flex items-center justify-center cursor-pointer shrink-0 group">
            <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] stroke-[rgba(255,255,255,0.65)] fill-none stroke-[1.5] stroke-linecap-round stroke-linejoin-round group-hover:stroke-[#DFC08A] transition-colors">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
          </a>
        )}
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
          <div className="absolute left-[14px] top-[76px] w-[260px] bg-[rgba(22,19,16,0.95)] backdrop-blur-[28px] rounded-2xl border border-[rgba(196,162,101,0.15)] p-6 space-y-1" onClick={e => e.stopPropagation()}>
            {[
              { label: 'Behandelingen', href: '/#behandelingen' },
              { label: 'Academy', href: '/courses' },
              { label: 'Over ons', href: '/about' },
              { label: 'Reviews', href: '/#reviews' },
              { label: 'FAQ', href: '/faq' },
              { label: 'Contact', href: '/contact' },
            ].map(l => (
              <a key={l.href} href={l.href} className="block text-[14px] py-2.5 px-3 rounded-xl text-[rgba(255,255,255,0.65)] hover:text-[#DFC08A] hover:bg-[rgba(196,162,101,0.08)] transition" onClick={() => setMobileOpen(false)}>
                {l.label}
              </a>
            ))}
            <hr className="border-[rgba(196,162,101,0.1)] my-2" />
            {user ? (
              <>
                <a href="/dashboard" className="block text-[14px] py-2.5 px-3 rounded-xl text-[rgba(255,255,255,0.65)] hover:text-[#DFC08A] hover:bg-[rgba(196,162,101,0.08)] transition" onClick={() => setMobileOpen(false)}>Dashboard</a>
                <a href="/profile" className="block text-[14px] py-2.5 px-3 rounded-xl text-[rgba(255,255,255,0.65)] hover:text-[#DFC08A] hover:bg-[rgba(196,162,101,0.08)] transition" onClick={() => setMobileOpen(false)}>Profiel</a>
                {role === 'admin' && (
                  <>
                    <a href="/admin" className="block text-[14px] py-2.5 px-3 rounded-xl text-[#C4A265] font-medium hover:bg-[rgba(196,162,101,0.08)] transition" onClick={() => setMobileOpen(false)}>⚡ Dashboard</a>
                    <a href="/admin/courses" className="block text-[14px] py-2.5 px-3 rounded-xl text-[rgba(255,255,255,0.55)] hover:bg-[rgba(196,162,101,0.08)] transition" onClick={() => setMobileOpen(false)}>📚 Cursus Builder</a>
                    <a href="/admin/customers" className="block text-[14px] py-2.5 px-3 rounded-xl text-[rgba(255,255,255,0.55)] hover:bg-[rgba(196,162,101,0.08)] transition" onClick={() => setMobileOpen(false)}>👥 Klanten</a>
                  </>
                )}
                <button onClick={() => { signOut(); setMobileOpen(false) }} className="block text-[14px] py-2.5 px-3 rounded-xl text-[rgba(255,255,255,0.4)] hover:bg-[rgba(196,162,101,0.08)] transition w-full text-left">Uitloggen</button>
              </>
            ) : (
              <a href="/login" className="block text-[14px] py-2.5 px-3 rounded-xl text-[#C4A265] font-medium hover:bg-[rgba(196,162,101,0.08)] transition" onClick={() => setMobileOpen(false)}>Inloggen</a>
            )}
          </div>
        </div>
      )}
    </>
  )
}
