'use client'

export default function Footer() {
  return (
    <footer className="bg-[var(--dark)] text-white py-16 border-t border-white/5">
      <div className="max-w-[900px] mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div>
            <img src="https://osldoolmbpqayxhgmbum.supabase.co/storage/v1/object/public/images/lxq-logo-07.webp" alt="LUXIQUE Academy" className="h-[80px] w-auto mb-3" />
            <p className="text-[12px] text-white/40 leading-relaxed">
              The art of lashes. Perfected.
            </p>
          </div>

          {/* Behandelingen */}
          <div>
            <h5 className="text-[13px] font-semibold mb-4 text-white/60">Behandelingen</h5>
            <a href="/behandelingen" className="block text-[12px] text-white/40 hover:text-[var(--rose)] transition mb-2">Nieuwe Set</a>
            <a href="/behandelingen" className="block text-[12px] text-white/40 hover:text-[var(--rose)] transition mb-2">Opvullen</a>
            <a href="/behandelingen" className="block text-[12px] text-white/40 hover:text-[var(--rose)] transition">Boek een afspraak</a>
          </div>

          {/* Academy */}
          <div>
            <h5 className="text-[13px] font-semibold mb-4 text-white/60">Academy</h5>
            <a href="/courses" className="block text-[12px] text-white/40 hover:text-[var(--rose)] transition mb-2">Online Cursussen</a>
          </div>

          {/* Info */}
          <div>
            <h5 className="text-[13px] font-semibold mb-4 text-white/60">Info</h5>
            <a href="/about" className="block text-[12px] text-white/40 hover:text-[var(--rose)] transition mb-2">Over mij</a>
            <a href="/faq" className="block text-[12px] text-white/40 hover:text-[var(--rose)] transition mb-2">FAQ</a>
            <a href="/contact" className="block text-[12px] text-white/40 hover:text-[var(--rose)] transition mb-2">Contact</a>
            <a href="https://instagram.com/lashedbychiva" target="_blank" rel="noopener noreferrer" className="block text-[12px] text-white/40 hover:text-[var(--rose)] transition">@lashedbychiva</a>
          </div>
        </div>

        {/* Juridisch — full width row */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 mb-8">
          <a href="/voorwaarden#voorwaarden" className="text-[11px] text-white/30 hover:text-[var(--rose)] transition">Algemene Voorwaarden</a>
          <a href="/voorwaarden#privacy" className="text-[11px] text-white/30 hover:text-[var(--rose)] transition">Privacyverklaring</a>
          <a href="/voorwaarden#cookies" className="text-[11px] text-white/30 hover:text-[var(--rose)] transition">Cookieverklaring</a>
          <a href="/voorwaarden#annulering" className="text-[11px] text-white/30 hover:text-[var(--rose)] transition">Annuleringsbeleid</a>
          <button onClick={() => typeof window !== 'undefined' && window.dispatchEvent(new Event('open-cookie-prefs'))} className="text-[11px] text-white/30 hover:text-[var(--rose)] transition cursor-pointer">Cookievoorkeuren</button>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[11px] text-white/30">© 2026 LXQ Academy. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
