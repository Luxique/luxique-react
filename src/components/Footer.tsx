export default function Footer() {
  return (
    <footer className="bg-[var(--dark)] text-white py-16 border-t border-white/5">
      <div className="max-w-[900px] mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-12">
          {/* Brand */}
          <div>
            <div className="font-['Avenir_Next'] text-[16px] tracking-[0.2em] font-[100] uppercase mb-3">LUXIQUE</div>
            <p className="text-[12px] text-white/40 leading-relaxed">
              The art of lashes. Perfected.
            </p>
          </div>

          {/* Behandelingen */}
          <div>
            <h5 className="text-[13px] font-semibold mb-4 text-white/60">Behandelingen</h5>
            <a href="#boeken" className="block text-[12px] text-white/40 hover:text-[var(--rose)] transition mb-2">Nieuwe Set</a>
            <a href="#boeken" className="block text-[12px] text-white/40 hover:text-[var(--rose)] transition mb-2">Opvullen</a>
            <a href="#boeken" className="block text-[12px] text-white/40 hover:text-[var(--rose)] transition">Boek een afspraak</a>
          </div>

          {/* Academy */}
          <div>
            <h5 className="text-[13px] font-semibold mb-4 text-white/60">Academy</h5>
            <a href="#online-cursussen" className="block text-[12px] text-white/40 hover:text-[var(--rose)] transition mb-2">Online Cursussen</a>
            <a href="#persoonlijk-traject" className="block text-[12px] text-white/40 hover:text-[var(--rose)] transition">Persoonlijk Traject</a>
          </div>

          {/* Info */}
          <div>
            <h5 className="text-[13px] font-semibold mb-4 text-white/60">Info</h5>
            <a href="#over-mij" className="block text-[12px] text-white/40 hover:text-[var(--rose)] transition mb-2">Over mij</a>
            <a href="#faq" className="block text-[12px] text-white/40 hover:text-[var(--rose)] transition mb-2">FAQ</a>
            <a href="#contact" className="block text-[12px] text-white/40 hover:text-[var(--rose)] transition mb-2">Contact</a>
            <a href="https://instagram.com/lashedbychiva" target="_blank" className="block text-[12px] text-white/40 hover:text-[var(--rose)] transition">@lashedbychiva</a>
          </div>

          {/* Juridisch */}
          <div>
            <h5 className="text-[13px] font-semibold mb-4 text-white/60">Juridisch</h5>
            <a href="/voorwaarden#voorwaarden" className="block text-[12px] text-white/40 hover:text-[var(--rose)] transition mb-2">Algemene Voorwaarden</a>
            <a href="/voorwaarden#privacy" className="block text-[12px] text-white/40 hover:text-[var(--rose)] transition mb-2">Privacyverklaring</a>
            <a href="/voorwaarden#cookies" className="block text-[12px] text-white/40 hover:text-[var(--rose)] transition mb-2">Cookieverklaring</a>
            <a href="/voorwaarden#annulering" className="block text-[12px] text-white/40 hover:text-[var(--rose)] transition mb-2">Annuleringsbeleid</a>
            <button onClick={() => typeof window !== 'undefined' && window.dispatchEvent(new Event('open-cookie-prefs'))} className="block text-[12px] text-white/40 hover:text-[var(--rose)] transition cursor-pointer">Cookievoorkeuren</button>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[11px] text-white/30">© 2026 LXQ Academy. All rights reserved.</p>
          <p className="text-[11px] text-white/30">Built by <a href="#" className="text-white/50 hover:text-[var(--rose)] transition">House of Labels</a></p>
        </div>
      </div>
    </footer>
  )
}
