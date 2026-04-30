export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[var(--dark)]">
        {/* Placeholder for hero image — replace with Chiva hero photo */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1C1812] via-[#2a2218] to-[#1C1812]" />
        <div className="absolute inset-0 bg-black/40" />
        {/* Placeholder shimmer */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white/10 text-[120px] font-['Cormorant_Garamond'] select-none">LXQ</div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-[700px] mx-auto px-6 text-center pt-24 pb-16">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-1.5 mb-8">
          <span className="text-[11px] text-white/60 tracking-wide">📍 Arnhem · Gecertificeerde lash artist & educator</span>
        </div>

        {/* Title */}
        <h1 className="font-['Cormorant_Garamond'] text-[clamp(36px,6vw,68px)] font-light leading-[1.1] text-white mb-6">
          The art of lashes.<br />
          <em>Perfected.</em>
        </h1>

        {/* Subtitle */}
        <p className="text-[clamp(14px,1.5vw,16px)] text-white/60 max-w-[480px] mx-auto leading-relaxed mb-10">
          Behandelingen in Arnhem. Opleidingen voor de nieuwe lichting lash artists — door Nederland&apos;s #1 lash educator.
        </p>

        {/* CTAs — pill buttons side by side */}
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <a href="#academy" className="bg-[var(--rose)] hover:bg-[var(--rose-light)] text-white px-8 py-4 rounded-full text-[13px] font-semibold transition-all hover:-translate-y-0.5 hover:shadow-lg">
            Bekijk de opleidingen
          </a>
          <a href="#boeken" className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-8 py-4 rounded-full text-[13px] font-medium hover:bg-white/20 transition">
            Boek een behandeling
          </a>
        </div>

        {/* 5 Star Rating */}
        <div className="mt-16 flex flex-col items-center gap-2">
          <div className="flex items-center gap-1">
            {[1,2,3,4,5].map(i => (
              <span key={i} className="text-[var(--rose)] text-lg">★</span>
            ))}
          </div>
          <p className="text-[12px] text-white/40">5.0 · Gebaseerd op 47 reviews</p>
        </div>
      </div>
    </section>
  )
}
