'use client'

import { useState } from 'react'

const faqs = [
  { q: 'Heb ik ervaring nodig om te starten?', a: 'Nee! Onze cursussen zijn geschikt voor complete beginners. Wij leren je alles vanaf nul, inclusief de basistechnieken en theorie achter lash extensions.' },
  { q: 'Zijn de cursussen online of op locatie?', a: 'Wij bieden een persoonlijk traject — een combinatie van online lesmateriaal dat je in je eigen tempo doorneemt, en persoonlijke begeleiding.' },
  { q: 'Wat is het verschil met een standaard lash cursus?', a: 'Wij leren je niet alleen de techniek, maar het denken als een artist. Oogvorm analyse, curl selectie, set design — dingen die de meeste cursussen overslaan.' },
  { q: 'Kan ik de eerste les gratis bekijken?', a: 'Ja! Elke cursus heeft een gratis inleidingsles. Maak een account aan om te starten.' },
  { q: 'Hoe lang duurt een cursus?', a: 'Dat verschilt per cursus. Gemiddeld 8-12 lessen die je in je eigen tempo doorneemt.' },
  { q: 'Is er mentorship na de cursus?', a: 'Ja, bij LXQ Academy krijg je ook na afloop toegang tot onze community en kun je altijd terecht met vragen.' },
  { q: 'Welke betalingsmethoden accepteren jullie?', a: 'Wij accepteren iDEAL, creditcard, en andere gangbare betaalmethoden via Stripe.' },
  { q: 'Kan ik mijn abonnement opzeggen?', a: 'Ja, je kunt op elk moment opzeggen. Je behoudt toegang tot het einde van je betaalde periode.' },
]

export default function FAQPage() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-[#FAFAFA] pt-24">

      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="font-['Cormorant_Garamond'] text-[clamp(32px,6vw,48px)] text-[#1a1a1a] mb-4">
          Veelgestelde vragen
        </h1>
        <div className="w-20 h-0.5 bg-[#D4AF37] mb-10" />

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white rounded-2xl border border-[#eee] overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full text-left px-6 py-5 flex items-center justify-between"
              >
                <span className="text-[14px] font-medium text-[#1a1a1a] pr-4">{faq.q}</span>
                <span className={`text-[#D4AF37] transition-transform ${open === i ? 'rotate-180' : ''}`}>▾</span>
              </button>
              {open === i && (
                <div className="px-6 pb-5">
                  <p className="text-[14px] text-[#888] leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 bg-[#f9f8f6] rounded-2xl p-8 border border-[#eee] text-center">
          <p className="text-[14px] text-[#888] mb-4">Staat je vraag er niet bij?</p>
          <div className="flex items-center justify-center gap-4">
            <a href="/contact" className="px-6 py-2.5 rounded-full border border-[#D4AF37] text-[#D4AF37] font-semibold text-[13px] hover:bg-[#D4AF37] hover:text-white transition">
              Neem contact op
            </a>
            <p className="text-[13px] text-[#aaa]">of gebruik de chatbot ↘</p>
          </div>
        </div>
      </div>
    </div>
  )
}
