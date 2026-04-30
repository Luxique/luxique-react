export default function Footer() {
  return (
    <footer className="bg-[var(--dark)] text-white py-16">
      <div className="max-w-[900px] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div>
            <div className="font-['Cormorant_Garamond'] text-xl tracking-[0.08em] mb-3">LUXIQUE</div>
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
            <a href="#academy" className="block text-[12px] text-white/40 hover:text-[var(--rose)] transition mb-2">Online Cursussen</a>
            <a href="#academy" className="block text-[12px] text-white/40 hover:text-[var(--rose)] transition">Persoonlijk Traject</a>
          </div>

          {/* Info */}
          <div>
            <h5 className="text-[13px] font-semibold mb-4 text-white/60">Info</h5>
            <a href="#over-mij" className="block text-[12px] text-white/40 hover:text-[var(--rose)] transition mb-2">Over mij</a>
            <a href="#" className="block text-[12px] text-white/40 hover:text-[var(--rose)] transition mb-2">FAQ</a>
            <a href="https://instagram.com/lashedbychiva" className="block text-[12px] text-white/40 hover:text-[var(--rose)] transition">@lashedbychiva</a>
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
