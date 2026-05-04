'use client'

import { useState } from 'react'

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  const navLinks = [
    { label: 'Behandelingen', href: '/#behandelingen' },
    { label: 'Academy', href: '/courses' },
    { label: 'Over ons', href: '/about' },
    { label: 'Reviews', href: '/#reviews' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Contact', href: '/contact' },
  ]

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

          {/* Right: Book + Login */}
          <div className="flex items-center gap-2">
            <a href="/booking" className="text-[12px] font-semibold text-[#D4AF37] border border-[#D4AF37] px-4 py-2 rounded-full hover:bg-[#D4AF37] hover:text-white transition hidden md:inline-flex">
              Book
            </a>
            <a href="/login" className="text-[12px] font-semibold text-white bg-[#D4AF37] px-4 py-2 rounded-full hover:bg-[#C5A028] transition hidden md:inline-flex">
              Login
            </a>
            {/* Mobile: just login icon */}
            <a href="/login" className="md:hidden text-[12px] font-semibold text-[#D4AF37]">
              Login
            </a>
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
            <a href="/booking" className="block text-[14px] py-2.5 px-3 rounded-xl text-[#D4AF37] font-semibold hover:bg-[#D4AF37]/5 transition" onClick={() => setMobileOpen(false)}>
              Book een afspraak
            </a>
            <div className="flex items-center justify-center gap-2 py-2">
              <span className="text-[12px] font-semibold text-[#D4AF37]">NL</span>
              <span className="text-[12px] text-[var(--text3)]">/</span>
              <span className="text-[12px] text-[var(--text3)] cursor-pointer hover:text-[#D4AF37] transition">ENG</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
