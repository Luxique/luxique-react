export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-end pb-24 pt-16 overflow-hidden">
      {/* Background — placeholder for hero photo */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#1C1812]/90 via-[#1C1812]/70 to-[#1C1812]/95">
        <div className="absolute inset-0 bg-[var(--dark)] opacity-60" />
        {/* [GEORGE: hero foto — Chiva aan het werk, close-up handen] */}
      </div>

      <div className="relative z-10 max-w-[1200px] mx-auto px-6 w-full">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-1.5 mb-8">
          <span className="text-[11px] text-white/60 tracking-wide">📍 Arnhem · Gecertificeerde lash artist & educator</span>
        </div>

        {/* Title */}
        <h1 className="font-['Cormorant_Garamond'] text-[clamp(40px,6vw,72px)] font-light leading-[1.1] text-white mb-6">
          The art of lashes.<br />
          <em>Perfected.</em>
        </h1>

        {/* Subtitle */}
        <p className="text-[clamp(14px,1.5vw,16px)] text-white/60 max-w-[560px] leading-relaxed mb-10">
          Behandelingen in Arnhem. Opleidingen voor de nieuwe lichting lash artists — door Nederland&apos;s #1 lash educator.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap gap-4">
          <a href="#academy" className="bg-[var(--rose)] hover:bg-[var(--rose-light)] text-white px-8 py-4 rounded-2xl text-[13px] font-semibold transition-all hover:-translate-y-0.5 hover:shadow-lg">
            Bekijk de opleidingen
          </a>
          <a href="#boeken" className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-8 py-4 rounded-2xl text-[13px] font-medium hover:bg-white/20 transition">
            Boek een behandeling
          </a>
        </div>
      </div>
    </section>
  )
}
