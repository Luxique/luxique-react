'use client'

import { useState } from 'react'

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Floating navbar */}
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-[900px]">
        <div className="flex items-center justify-between px-4 h-14 rounded-full bg-white/60 backdrop-blur-xl border border-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
          {/* Left: Book Now + Hamburger */}
          <div className="flex items-center gap-3">
            <button className="md:hidden flex flex-col gap-1 p-1" onClick={() => setMobileOpen(!mobileOpen)}>
              <span className={`w-5 h-0.5 bg-[var(--dark)] transition-all ${mobileOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`w-5 h-0.5 bg-[var(--dark)] transition-all ${mobileOpen ? 'opacity-0' : ''}`} />
              <span className={`w-5 h-0.5 bg-[var(--dark)] transition-all ${mobileOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </button>
            <a href="#boeken" className="hidden md:inline-flex items-center gap-1 text-[12px] font-semibold text-white bg-[var(--rose)] hover:bg-[var(--rose-light)] px-4 py-2 rounded-full transition">
              Book Now
            </a>
            <a href="#boeken" className="md:hidden text-[12px] font-semibold text-white bg-[var(--rose)] px-3 py-1.5 rounded-full">
              Book
            </a>
          </div>

          {/* Center: Logo */}
          <a href="#" className="absolute left-1/2 -translate-x-1/2 font-['Avenir_Next'] text-[18px] tracking-[0.25em] font-[100] text-[var(--dark)] uppercase select-none">
            LUXIQUE
          </a>

          {/* Right: Desktop links */}
          <div className="hidden md:flex items-center gap-5">
            <a href="#behandelingen" className="text-[12px] font-medium text-[var(--text2)] hover:text-[var(--rose)] transition">Behandelingen</a>
            <a href="#academy" className="text-[12px] font-medium text-[var(--text2)] hover:text-[var(--rose)] transition">Academy</a>
            <a href="#over-mij" className="text-[12px] font-medium text-[var(--text2)] hover:text-[var(--rose)] transition">Over mij</a>
            <a href="#reviews" className="text-[12px] font-medium text-[var(--text2)] hover:text-[var(--rose)] transition">Reviews</a>
            <a href="#contact" className="text-[12px] font-medium text-[var(--text2)] hover:text-[var(--rose)] transition">Contact</a>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
          <div className="absolute left-4 top-24 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl p-6 w-[260px] space-y-1 border border-white/30" onClick={e => e.stopPropagation()}>
            <a href="#behandelingen" className="block text-[14px] py-2.5 px-3 rounded-xl hover:bg-[var(--rose-pale)] transition" onClick={() => setMobileOpen(false)}>Behandelingen</a>
            <a href="#boeken" className="block text-[14px] py-2.5 px-3 rounded-xl hover:bg-[var(--rose-pale)] transition" onClick={() => setMobileOpen(false)}>Boek een afspraak</a>
            <a href="#academy" className="block text-[14px] py-2.5 px-3 rounded-xl hover:bg-[var(--rose-pale)] transition" onClick={() => setMobileOpen(false)}>Academy</a>
            <a href="#online-cursussen" className="block text-[14px] py-2.5 px-3 rounded-xl hover:bg-[var(--rose-pale)] pl-7 transition" onClick={() => setMobileOpen(false)}>Online Cursussen</a>
            <a href="#persoonlijk-traject" className="block text-[14px] py-2.5 px-3 rounded-xl hover:bg-[var(--rose-pale)] pl-7 transition" onClick={() => setMobileOpen(false)}>Persoonlijk Traject</a>
            <a href="#over-mij" className="block text-[14px] py-2.5 px-3 rounded-xl hover:bg-[var(--rose-pale)] transition" onClick={() => setMobileOpen(false)}>Over mij</a>
            <a href="#reviews" className="block text-[14px] py-2.5 px-3 rounded-xl hover:bg-[var(--rose-pale)] transition" onClick={() => setMobileOpen(false)}>Reviews</a>
            <a href="#faq" className="block text-[14px] py-2.5 px-3 rounded-xl hover:bg-[var(--rose-pale)] transition" onClick={() => setMobileOpen(false)}>FAQ</a>
            <a href="#contact" className="block text-[14px] py-2.5 px-3 rounded-xl hover:bg-[var(--rose-pale)] transition" onClick={() => setMobileOpen(false)}>Contact</a>
            <hr className="border-black/[0.06] my-2" />
            <div className="flex items-center justify-center gap-2 py-2">
              <span className="text-[12px] font-semibold text-[var(--rose)]">NL</span>
              <span className="text-[12px] text-[var(--text3)]">/</span>
              <span className="text-[12px] text-[var(--text3)] cursor-pointer hover:text-[var(--rose)] transition">ENG</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
