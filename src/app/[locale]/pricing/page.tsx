'use client'

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <div className="bg-white border-b border-[#eee]">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="font-['Cormorant_Garamond'] text-[24px] tracking-[0.15em] text-[#1a1a1a]">LUXIQUE</a>
          <a href="/login" className="text-[13px] text-[#D4AF37] font-medium">Inloggen</a>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#D4AF37] mb-4 block">
          LXQ Academy
        </span>
        <h1 className="font-['Cormorant_Garamond'] text-[clamp(32px,6vw,48px)] text-[#1a1a1a] mb-4">
          Word een Lash Artist
        </h1>
        <p className="text-[15px] text-[#888] max-w-[500px] mx-auto mb-12">
          Toegang tot alle cursussen, exclusieve content, en persoonlijke begeleiding van Chiva.
        </p>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-[700px] mx-auto">
          {/* Monthly */}
          <div className="bg-white rounded-2xl p-8 border border-[#eee] text-left">
            <h3 className="font-semibold text-[18px] mb-1">Maandelijks</h3>
            <p className="text-[13px] text-[#888] mb-6">Flexibel opzegbaar</p>
            <div className="mb-6">
              <span className="font-['Cormorant_Garamond'] text-[48px] text-[#1a1a1a]">€49</span>
              <span className="text-[14px] text-[#888]">/maand</span>
            </div>
            <ul className="space-y-3 mb-8">
              {['Alle cursussen', 'Nieuwe content maandelijks', 'Community toegang', 'Q&A sessies'].map(f => (
                <li key={f} className="flex items-center gap-2 text-[13px] text-[#666]">
                  <span className="text-[#D4AF37]">✓</span> {f}
                </li>
              ))}
            </ul>
            <button className="w-full py-3 rounded-full border-2 border-[#D4AF37] text-[#D4AF37] font-semibold text-[14px] hover:bg-[#D4AF37] hover:text-white transition">
              Beginnen
            </button>
          </div>

          {/* Yearly — featured */}
          <div className="relative bg-white rounded-2xl p-8 border-2 border-[#D4AF37] text-left shadow-[0_0_40px_rgba(212,175,55,0.15)]">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#D4AF37] text-white text-[10px] font-bold tracking-wider uppercase px-4 py-1 rounded-full">
              Populair
            </div>
            <h3 className="font-semibold text-[18px] mb-1">Jaarlijks</h3>
            <p className="text-[13px] text-[#888] mb-6">Bespaar 2 maanden</p>
            <div className="mb-6">
              <span className="font-['Cormorant_Garamond'] text-[48px] text-[#1a1a1a]">€470</span>
              <span className="text-[14px] text-[#888]">/jaar</span>
            </div>
            <ul className="space-y-3 mb-8">
              {['Alles uit Maandelijks', '1-op-1 feedback sessies', 'Prioriteit support', 'Certificaat van voltooiing'].map(f => (
                <li key={f} className="flex items-center gap-2 text-[13px] text-[#666]">
                  <span className="text-[#D4AF37]">✓</span> {f}
                </li>
              ))}
            </ul>
            <button className="w-full py-3 rounded-full bg-[#D4AF37] text-white font-semibold text-[14px] hover:bg-[#C5A028] transition">
              Beginnen
            </button>
          </div>
        </div>

        <p className="text-[12px] text-[#aaa] mt-8">
          🔒 Veilig betalen via Stripe. Elke maand opzegbaar.
        </p>
      </div>
    </div>
  )
}
