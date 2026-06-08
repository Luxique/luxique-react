'use client'

import { useState } from 'react'

const faqs = [
  // Treatment FAQs
  { q: 'Hoe lang duurt een behandeling?', a: 'Een nieuwe set duurt ongeveer 2 uur. Een refill is sneller — reken op ongeveer een uur, afhankelijk van hoeveel lashes er bijgevuld moeten worden.' },
  { q: 'Hoe vaak moet ik komen voor een refill?', a: 'Voor een vol resultaat raad ik aan om elke 2 tot 3 weken langs te komen. Je natuurlijke wimpers vallen uit en groeien aan, dus een regelmatige refill houdt je set er op zijn best uit.' },
  { q: 'Doet het pijn?', a: 'Nee. De behandeling is volledig pijnloos. Je ligt comfortabel met gesloten ogen — veel klanten vinden het zo ontspannend dat ze in slaap vallen.' },
  { q: 'Hoe verzorg ik mijn lashes thuis?', a: 'Je krijgt na de behandeling persoonlijk nazorgadvies. Kort gezegd: de eerste 24 uur niet nat maken, voorzichtig reinigen, en niet wrijven. Ik leg je alles uit tijdens je afspraak.' },
  { q: 'Welke stijl past bij mij?', a: 'Dat bepalen we samen tijdens de consultatie. Op basis van je oogvorm, natuurlijke wimpers en wensen kies ik de styling die jouw blik het mooist versterkt.' },
  { q: 'Wanneer moet ik mijn wimpers laten opvullen?', a: 'Ik vul wimpers op tot 3 weken na je afspraak. De prijs voor een opvulbehandeling is altijd €90, ongeacht of je binnen 1 week, 2 weken of 3 weken terugkomt. Na 3 weken wordt er een nieuwe set geplaatst.' },
  { q: 'Zijn alle sets €130?', a: 'Ja. Alle sets worden volledig aangepast aan jouw ogen. Je kunt iedere gewenste stijl en vorm kiezen, maar deze wordt altijd afgestemd op jouw oogvorm, uitstraling en natuurlijke wimpers. Elke set is een customized set en heeft daarom één vaste prijs van €130. Voor iedere nieuwe set reserveer ik 3 uur in mijn agenda, zodat er voldoende tijd is om jouw set perfect te creëren.' },
  // Course / Academy FAQs
  { q: 'Wat als ik tijdens de cursus ontdek dat dit vak toch niets voor mij is?', a: 'Helaas is restitutie niet mogelijk. De cursusdagen worden speciaal voor jou gereserveerd en kunnen daardoor niet meer aan iemand anders worden aangeboden. Om teleurstelling te voorkomen kun je vooraf een workshop van 1 uur boeken. Tijdens deze workshop ontdek je of het vak echt bij je past. Je maakt kennis met de materialen, leert werken met pincetten en kunt ervaren of het werk prettig is voor je ogen, houding en concentratie.' },
  { q: 'Krijg ik een starterspakket bij de cursus?', a: 'Bij ieder persoonlijk traject ontvang je een starterspakket. Bij online cursussen is geen starterspakket inbegrepen. In de online cursussen staat duidelijk vermeld welke materialen en producten je zelf moet aanschaffen.' },
  { q: 'Krijg ik een certificaat?', a: 'Ja. Na afloop van iedere cursus ontvang je een certificaat van deelname. Let op: een certificaat van deelname betekent dat je de theorie en informatie hebt gevolgd. Het is geen garantie dat je de technieken volledig beheerst of op professioneel niveau kunt uitvoeren.' },
  { q: 'Is de cursus één op één?', a: 'De online cursussen volg je volledig zelfstandig. Je kunt inloggen wanneer het jou uitkomt en verdergaan waar je bent gebleven. De persoonlijke trajecten worden gegeven in kleine groepen van maximaal 2 personen. Wil je liever een volledig één-op-één traject? Dat is mogelijk tegen een meerprijs.' },
  { q: 'Wat als ik hulp nodig heb tijdens een online cursus?', a: 'Je kunt altijd vragen stellen. Stuur een e-mail naar: info@luxique.nl. Wij streven ernaar om binnen 2 werkdagen te reageren. Daarnaast kun je gebruikmaken van de chatbot voor veelgestelde vragen en extra ondersteuning.' },
  { q: 'Sta ik er alleen voor nadat ik de cursus heb afgerond?', a: 'Nee. Ook na het afronden van de cursus kun je rekenen op ondersteuning. Je wordt onderdeel van een community waarin cursisten elkaar helpen, ervaringen delen en elkaar ondersteunen tijdens hun groei als lash artist.' },
  // General FAQs
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
