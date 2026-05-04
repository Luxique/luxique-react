export default function ReviewsSection() {
  const reviews = [
    { name: 'Sarah M.', role: 'Lash artist — Amsterdam', time: '2 weken geleden', text: 'Na de cursus had ik direct mijn eerste betalende klanten. De kwaliteit van Chiva\'s uitleg is echt op een ander niveau.' },
    { name: 'Jessica K.', role: 'Vaste klant — Arnhem', time: '1 maand geleden', text: 'Mijn lashes zien er nog nooit zo goed uit. Chiva weet precies wat bij jouw ogen past.' },
    { name: 'Ayesha B.', role: 'Salon eigenaar — Rotterdam', time: '6 weken geleden', text: 'De coaching bij Chiva was precies wat ik nodig had. Ze is geduldig, gedetailleerd en geeft je echt het gevoel dat je klaar bent om zelfstandig aan de slag te gaan.' },
    { name: 'Nour A.', role: 'Student — Utrecht', time: '2 maanden geleden', text: 'Ik had geen enkele ervaring met lashes en na de Medusa cursus van Chiva voel ik me echt een professional.' },
    { name: 'Fatima O.', role: 'Lash artist — Den Haag', time: '4 maanden geleden', text: 'Chiva\'s cursussen zijn letterlijk de beste investering die ik heb gedaan in mijn carrière.' },
  ]

  return (
    <section className="py-12 md:py-24 bg-white">
      <div className="max-w-[900px] mx-auto px-6">
        <div className="section-tag">Reviews</div>
        <h2 className="section-title mb-6">
          Wat klanten<br /><em>zeggen</em>
        </h2>

        {/* Score */}
        <div className="flex items-center gap-4 mb-10">
          <div className="text-[36px] font-['Cormorant_Garamond'] text-[var(--rose)]">5.0</div>
          <div>
            <div className="text-[#D4AF37] text-lg">★★★★★</div>
            <div className="text-[11px] text-[var(--text3)]">Gebaseerd op 47 reviews</div>
          </div>
        </div>

        {/* Horizontal scroll reviews */}
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory -mx-6 px-6">
          {reviews.map((r, i) => (
            <div key={i} className="flex-shrink-0 w-[340px] snap-start bg-[var(--bg2)] border border-[var(--border)] rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[var(--rose-pale)] flex items-center justify-center text-[14px] font-semibold text-[var(--rose)]">
                  {r.name[0]}
                </div>
                <div>
                  <div className="text-[13px] font-semibold">{r.name}</div>
                  <div className="text-[11px] text-[var(--text3)]">{r.role} · {r.time}</div>
                </div>
              </div>
              <div className="text-[#D4AF37] text-[13px] mb-3">★★★★★</div>
              <p className="text-[13px] text-[var(--text2)] leading-relaxed">&ldquo;{r.text}&rdquo;</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
