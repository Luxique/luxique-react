'use client'

import { useState } from 'react'

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [academyOpen, setAcademyOpen] = useState(false)

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/[0.06]">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <a href="#" className="font-['Cormorant_Garamond'] text-xl tracking-[0.08em] font-light text-[var(--dark)]">
            LUXIQUE
          </a>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#behandelingen" className="text-[13px] font-medium text-[var(--text2)] hover:text-[var(--rose)] transition">Behandelingen</a>
            
            {/* Academy Dropdown */}
            <div className="relative" onMouseEnter={() => setAcademyOpen(true)} onMouseLeave={() => setAcademyOpen(false)}>
              <button className="text-[13px] font-medium text-[var(--text2)] hover:text-[var(--rose)] transition flex items-center gap-1">
                🎓 Academy ▾
              </button>
              {academyOpen && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-white/95 backdrop-blur-xl rounded-2xl border border-black/[0.06] shadow-xl p-3 space-y-1">
                  <a href="#academy" className="flex items-start gap-3 p-3 rounded-xl hover:bg-[var(--rose-pale)] transition">
                    <span className="text-xl mt-0.5">🎬</span>
                    <div>
                      <div className="text-[13px] font-semibold">Online Leeromgeving</div>
                      <div className="text-[11px] text-[var(--text3)]">Videocursussen op eigen tempo</div>
                    </div>
                  </a>
                  <a href="#academy" className="flex items-start gap-3 p-3 rounded-xl hover:bg-[var(--rose-pale)] transition">
                    <span className="text-xl mt-0.5">🤝</span>
                    <div>
                      <div className="text-[13px] font-semibold">Persoonlijk Traject</div>
                      <div className="text-[11px] text-[var(--text3)]">Bij Chiva op locatie</div>
                    </div>
                  </a>
                </div>
              )}
            </div>

            <a href="#over-mij" className="text-[13px] font-medium text-[var(--text2)] hover:text-[var(--rose)] transition">Over mij</a>
            
            {/* Language Toggle */}
            <span className="text-[11px] text-[var(--text3)] cursor-pointer hover:text-[var(--rose)] transition">NL / EN</span>
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <a href="#boeken" className="btn-ghost text-[12px] py-2.5 px-5">Boek een behandeling</a>
            <a href="#academy" className="btn-filled text-[12px] py-2.5 px-5">Start je opleiding →</a>
          </div>

          {/* Mobile Burger */}
          <button className="md:hidden flex flex-col gap-1.5 p-2" onClick={() => setMobileOpen(!mobileOpen)}>
            <span className={`w-5 h-0.5 bg-[var(--dark)] transition-all ${mobileOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`w-5 h-0.5 bg-[var(--dark)] transition-all ${mobileOpen ? 'opacity-0' : ''}`} />
            <span className={`w-5 h-0.5 bg-[var(--dark)] transition-all ${mobileOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
          <div className="absolute right-4 top-20 bg-white rounded-2xl shadow-2xl p-6 w-[280px] space-y-4" onClick={e => e.stopPropagation()}>
            <a href="#behandelingen" className="block text-[16px] font-['Cormorant_Garamond'] py-2" onClick={() => setMobileOpen(false)}>Behandelingen</a>
            <a href="#academy" className="block text-[16px] font-['Cormorant_Garamond'] py-2" onClick={() => setMobileOpen(false)}>Academy</a>
            <a href="#over-mij" className="block text-[16px] font-['Cormorant_Garamond'] py-2" onClick={() => setMobileOpen(false)}>Over mij</a>
            <hr className="border-black/[0.06]" />
            <a href="#boeken" className="btn-ghost block text-center text-[12px] py-2.5" onClick={() => setMobileOpen(false)}>Boek een behandeling</a>
            <a href="#academy" className="btn-filled block text-center text-[12px] py-2.5" onClick={() => setMobileOpen(false)}>Start je opleiding →</a>
          </div>
        </div>
      )}
    </>
  )
}
