export default function FAQ() {
  const faqs = [
    { q: 'Heb ik ervaring nodig voor de cursus?', a: 'Nee! De Medusa cursus is speciaal ontworpen voor beginners. Je start vanaf nul en bouwt op tot een volledige lash artist.' },
    { q: 'Hoe lang duurt het persoonlijk traject?', a: 'Het persoonlijk traject is verspreid over meerdere dagen, afhankelijk van jouw niveau en doelen. Neem contact op voor een vrijblijvend gesprek.' },
    { q: 'Zijn de materialen inbegrepen?', a: 'Ja, bij het persoonlijk traject zijn alle materialen inbegrepen. Bij de online cursussen ontvang je een materialenlijst met aanbevelingen.' },
    { q: 'Krijg ik een certificaat?', a: 'Ja, na succesvolle afronding ontvang je een officieel LXQ Academy certificaat.' },
    { q: 'Wat is het verschil tussen online en IRL?', a: 'Online leer je op eigen tempo via videolessen. Het IRL traject is bij Chiva op locatie in Arnhem, met hands-on begeleiding en maximaal 2 cursisten per dag.' },
    { q: 'Hoe boek ik een behandeling?', a: 'Via de &ldquo;Book Now&rdquo; knop bovenin de pagina kun je direct een afspraak inplannen. Kies tussen Nieuwe Set (90 min) of Opvullen (60 min).' },
    { q: 'Wanneer moet ik mijn wimpers laten opvullen?', a: 'Ik vul wimpers op tot 3 weken na je afspraak. De prijs voor een opvulbehandeling is altijd €90, ongeacht of je binnen 1 week, 2 weken of 3 weken terugkomt. Na 3 weken wordt er een nieuwe set geplaatst.' },
    { q: 'Zijn alle sets €130?', a: 'Ja. Alle sets worden volledig aangepast aan jouw ogen. Je kunt iedere gewenste stijl en vorm kiezen, maar deze wordt altijd afgestemd op jouw oogvorm, uitstraling en natuurlijke wimpers. Elke set is een customized set en heeft daarom één vaste prijs van €130. Voor iedere nieuwe set reserveer ik 3 uur in mijn agenda, zodat er voldoende tijd is om jouw set perfect te creëren.' },
    { q: 'Wat is het annuleringsbeleid?', a: 'Afspraken kunnen tot 24 uur van tevoren kosteloos worden geannuleerd. Bij no-show of late annulering worden de volledige kosten in rekening gebracht.' },
  ]

  return (
    <section id="faq" className="py-24 bg-white">
      <div className="max-w-[700px] mx-auto px-6">
        <div className="section-tag text-center">FAQ</div>
        <h2 className="section-title text-center mb-12">
          Veelgestelde <em>vragen</em>
        </h2>

        <div className="space-y-4">
          {faqs.map((f, i) => (
            <details key={i} className="group bg-[var(--bg2)] rounded-2xl border border-[var(--border)] overflow-hidden">
              <summary className="flex items-center justify-between p-5 cursor-pointer text-[16px] font-medium text-[var(--text)] hover:text-[var(--rose)] transition list-none">
                {f.q}
                <span className="text-[var(--text3)] group-open:rotate-45 transition-transform text-xl">+</span>
              </summary>
              <div className="px-5 pb-5 text-[16px] text-[var(--text2)] leading-relaxed">
                {f.a}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
