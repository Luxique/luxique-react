import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Lash Behandeling — LUXIQUE',
  description: 'Boek een professionele lash behandeling bij Chiva. 3 uur lang aandacht voor jouw ogen. Inclusief foto-reportage van het proces.',
}

export default function BehandelingPage() {
  return (
    <main style={{ background: '#0C0A07', color: '#FAF8F4', fontFamily: "'Outfit', sans-serif", fontWeight: 300 }}>
      {/* Hero */}
      <section style={{ padding: '160px 0 100px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%,-50%)', width: 800, height: 800, background: 'radial-gradient(circle, rgba(196,162,101,0.08) 0%, transparent 60%)', filter: 'blur(80px)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: 1180, margin: '0 auto', padding: '0 32px' }}>
          <span style={{ display: 'inline-block', padding: '8px 18px', border: '1px solid rgba(196,162,101,0.18)', borderRadius: 999, background: 'rgba(196,162,101,0.06)', color: '#C4A265', fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 32 }}>
            Lash Behandeling
          </span>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(48px, 7vw, 88px)', color: '#FAF8F4', marginBottom: 24, fontStyle: 'italic', fontWeight: 300, letterSpacing: '-0.01em', lineHeight: 1.1 }}>
            Jouw ogen verdienen<br /><span style={{ color: '#C4A265' }}>3 uur aandacht</span>
          </h1>
          <p style={{ fontSize: 19, color: 'rgba(250,248,244,0.6)', maxWidth: 620, margin: '0 auto 44px', lineHeight: 1.6 }}>
            Een lash behandeling bij LUXIQUE is geen snelle behandeling. Het is een experience. Chiva neemt de tijd om jouw oogvorm te analyseren, het perfecte design te kiezen, en elke lash met precisie te plaatsen.
          </p>
          <a href="#boeken" style={{ background: '#C4A265', color: '#0C0A07', padding: '18px 38px', borderRadius: 999, border: 'none', fontSize: 15, fontWeight: 500, letterSpacing: '0.04em', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 12 }}>
            Boek je afspraak →
          </a>
        </div>
      </section>

      {/* What to Expect */}
      <section style={{ background: '#14110C', borderTop: '1px solid rgba(196,162,101,0.18)', borderBottom: '1px solid rgba(196,162,101,0.18)', padding: '130px 0' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 32px' }}>
          <div style={{ textAlign: 'center', marginBottom: 70 }}>
            <span style={{ fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#C4A265', fontWeight: 500, marginBottom: 16, display: 'inline-block' }}>— Wat je kunt verwachten —</span>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(36px,5vw,56px)', color: '#FAF8F4', marginBottom: 18, fontStyle: 'italic', fontWeight: 300, lineHeight: 1.1 }}>
              De behandeling stap voor stap
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {[
              { num: '01', title: 'Lash Mapping & Consult', time: '30 min', desc: 'Chiva analyseert jouw oogvorm en maakt een persoonlijke lash mapping. Deze wordt met foto\'s opgeslagen voor toekomstige afspraken — zodat elke visit consistent is.' },
              { num: '02', title: 'De behandeling', time: '2 uur', desc: 'Elke lash wordt met precisie geplaatst volgens de mapping. Chiva werkt laag voor laag, van basis tot punt, voor het meest natuurlijke resultaat.' },
              { num: '03', title: 'Foto\'s & Aftercare', time: '30 min', desc: 'Professionele foto\'s van het resultaat. De mapping + foto\'s worden opgeslagen in je klantdossier. Plus uitgebreide aftercare instructies.' },
            ].map((step) => (
              <div key={step.num} style={{ background: '#1C1812', border: '1px solid rgba(196,162,101,0.18)', borderRadius: 22, padding: '44px 36px' }}>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", color: '#C4A265', fontSize: 48, fontStyle: 'italic', marginBottom: 8 }}>{step.num}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, color: '#FAF8F4', fontStyle: 'italic', fontWeight: 400 }}>{step.title}</h3>
                  <span style={{ background: 'rgba(196,162,101,0.1)', color: '#C4A265', padding: '4px 12px', borderRadius: 999, fontSize: 11, letterSpacing: '0.1em' }}>{step.time}</span>
                </div>
                <p style={{ color: 'rgba(250,248,244,0.55)', fontSize: 15, lineHeight: 1.7 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section style={{ padding: '130px 0' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 32px' }}>
          <div style={{ textAlign: 'center', marginBottom: 70 }}>
            <span style={{ fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#C4A265', fontWeight: 500, marginBottom: 16, display: 'inline-block' }}>— Inbegrepen —</span>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(36px,5vw,56px)', color: '#FAF8F4', fontStyle: 'italic', fontWeight: 300, lineHeight: 1.1 }}>
              Wat zit er in de prijs
            </h2>
          </div>

          <div style={{ maxWidth: 760, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
            {[
              'Professionele lash consult & mapping',
              'Maatwerk lash design',
              'Premium lash materialen',
              '3 uur behandeltijd (nieuwe set)',
              'Foto-reportage van het resultaat',
              "Mapping + foto's opgeslagen in klantdossier",
              'Aftercare kit & instructies',
              '2 weken na-behandeling garantie',
            ].map((item, i) => (
              <div key={i} style={{ background: '#14110C', border: '1px solid rgba(196,162,101,0.18)', borderRadius: 14, padding: '20px 24px', display: 'flex', gap: 14, alignItems: 'center' }}>
                <span style={{ color: '#C4A265', fontSize: 16 }}>✓</span>
                <span style={{ color: '#FAF8F4', fontSize: 15 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section style={{ background: '#14110C', borderTop: '1px solid rgba(196,162,101,0.18)', borderBottom: '1px solid rgba(196,162,101,0.18)', padding: '130px 0' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 32px', textAlign: 'center' }}>
          <span style={{ fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#C4A265', fontWeight: 500, marginBottom: 16, display: 'inline-block' }}>— Investering —</span>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(36px,5vw,56px)', color: '#FAF8F4', marginBottom: 24, fontStyle: 'italic', fontWeight: 300, lineHeight: 1.1 }}>
            Transparante prijzen
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, maxWidth: 820, margin: '0 auto 60px' }}>
            <div style={{ background: '#1C1812', border: '1px solid rgba(196,162,101,0.18)', borderRadius: 22, padding: 44 }}>
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, color: '#FAF8F4', fontStyle: 'italic', fontWeight: 400, marginBottom: 12 }}>Nieuwe Set</h3>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', color: '#C4A265', fontSize: 48, marginBottom: 8 }}>€ 129</div>
              <p style={{ color: 'rgba(250,248,244,0.5)', fontSize: 14, marginBottom: 20 }}>3 uur behandeltijd · Alles inbegrepen</p>
              <ul style={{ listStyle: 'none', padding: 0, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {['Lash mapping & consult', 'Maatwerk lash design', 'Foto-reportage', 'Mapping opgeslagen voor toekomstige visits'].map((f, i) => (
                  <li key={i} style={{ display: 'flex', gap: 10, color: 'rgba(250,248,244,0.7)', fontSize: 14 }}><span style={{ color: '#C4A265' }}>✓</span>{f}</li>
                ))}
              </ul>
              <a href="#boeken" style={{ display: 'block', marginTop: 28, background: '#C4A265', color: '#0C0A07', padding: '14px 28px', borderRadius: 999, fontSize: 14, fontWeight: 500, letterSpacing: '0.04em', textDecoration: 'none', textAlign: 'center' }}>
                Boek Nieuwe Set →
              </a>
            </div>
            <div style={{ background: '#1C1812', border: '2px solid rgba(196,162,101,0.4)', borderRadius: 22, padding: 44, position: 'relative' }}>
              <span style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: '#C4A265', color: '#0C0A07', padding: '4px 16px', borderRadius: 999, fontSize: 10, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Populair</span>
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, color: '#FAF8F4', fontStyle: 'italic', fontWeight: 400, marginBottom: 12 }}>Opvullen</h3>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', color: '#C4A265', fontSize: 48, marginBottom: 8 }}>€ 89</div>
              <p style={{ color: 'rgba(250,248,244,0.5)', fontSize: 14, marginBottom: 20 }}>2 uur behandeltijd · Opvullen van bestaande set</p>
              <ul style={{ listStyle: 'none', padding: 0, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {['Opvullen op basis van opgeslagen mapping', 'Foto-update na behandeling', 'Aftercare check'].map((f, i) => (
                  <li key={i} style={{ display: 'flex', gap: 10, color: 'rgba(250,248,244,0.7)', fontSize: 14 }}><span style={{ color: '#C4A265' }}>✓</span>{f}</li>
                ))}
              </ul>
              <a href="#boeken" style={{ display: 'block', marginTop: 28, background: '#C4A265', color: '#0C0A07', padding: '14px 28px', borderRadius: 999, fontSize: 14, fontWeight: 500, letterSpacing: '0.04em', textDecoration: 'none', textAlign: 'center' }}>
                Boek Opvulbeurt →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Process Photos Placeholder */}
      <section style={{ padding: '130px 0' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 32px', textAlign: 'center' }}>
          <span style={{ fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#C4A265', fontWeight: 500, marginBottom: 16, display: 'inline-block' }}>— Resultaten —</span>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(36px,5vw,56px)', color: '#FAF8F4', marginBottom: 18, fontStyle: 'italic', fontWeight: 300, lineHeight: 1.1 }}>
            Voordat & Na
          </h2>
          <p style={{ color: 'rgba(250,248,244,0.55)', fontSize: 17, maxWidth: 560, margin: '0 auto 60px' }}>
            Elke behandeling wordt vastgelegd. Zie het verschil.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ aspectRatio: '4/5', borderRadius: 22, background: '#14110C', border: '1px solid rgba(196,162,101,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: 'rgba(196,162,101,0.3)', fontSize: 14, letterSpacing: '0.1em' }}>FOTO {i}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ background: '#14110C', borderTop: '1px solid rgba(196,162,101,0.18)', borderBottom: '1px solid rgba(196,162,101,0.18)', padding: '130px 0' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 32px' }}>
          <div style={{ textAlign: 'center', marginBottom: 70 }}>
            <span style={{ fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#C4A265', fontWeight: 500, marginBottom: 16, display: 'inline-block' }}>— Veelgesteld —</span>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(36px,5vw,56px)', color: '#FAF8F4', fontStyle: 'italic', fontWeight: 300, lineHeight: 1.1 }}>
              Goed om te weten
            </h2>
          </div>
          {[
            { q: 'Hoe lang duurt een behandeling?', a: 'Reken op 3 uur. Chiva neemt de tijd voor een perfect resultaat — geen haast, geen compromissen.' },
            { q: 'Hoe lang blijft de set zitten?', a: 'Gemiddeld 4-6 weken met goede aftercare. Na 2-3 weken adviseren we een refill voor een frisse look.' },
            { q: 'Is het pijnlijk?', a: 'Nee. De meeste klanten vinden het zelfs ontspannen. Je ligt comfortabel en veel klanten vallen in slaap tijdens de behandeling.' },
            { q: 'Welke materialen gebruik je?', a: 'Alleen premium, cruelty-free lash materialen van de hoogste kwaliteit. Lichtgewicht en comfortabel voor dagelijks gebruik.' },
            { q: 'Kan ik ook een refill boeken?', a: 'Ja! Refills boeken we 2-3 weken na je eerste set. Prijs: €79 (Classic) of €99 (Volume).' },
            { q: 'Wat als ik niet tevreden ben?', a: 'Binnen 2 weken na de behandeling kun je gratis terugkomen voor aanpassingen. Jouw tevredenheid staat voorop.' },
          ].map((item, i) => (
            <div key={i} style={{ background: '#1C1812', border: '1px solid rgba(196,162,101,0.18)', borderRadius: 14, marginBottom: 14, padding: '24px 28px' }}>
              <h3 style={{ color: '#FAF8F4', fontSize: 17, fontWeight: 500, marginBottom: 10 }}>{item.q}</h3>
              <p style={{ color: 'rgba(250,248,244,0.55)', fontSize: 15, lineHeight: 1.7 }}>{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section id="boeken" style={{ padding: '140px 0', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 1000, height: 600, background: 'radial-gradient(ellipse, rgba(196,162,101,0.08) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: 800, margin: '0 auto', padding: '0 32px' }}>
          <span style={{ fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#C4A265', fontWeight: 500, marginBottom: 16, display: 'inline-block' }}>— Klaar? —</span>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(40px,6vw,64px)', color: '#FAF8F4', marginBottom: 24, fontStyle: 'italic', fontWeight: 300, lineHeight: 1.1 }}>
            Boek jouw <span style={{ color: '#C4A265' }}>behandeling</span>
          </h2>
          <p style={{ color: 'rgba(250,248,244,0.6)', fontSize: 18, maxWidth: 560, margin: '0 auto 44px' }}>
            Kies een datum die jou uitkomt. Chiva bevestigt je boeking binnen 24 uur.
          </p>
          <div style={{ maxWidth: 640, margin: '0 auto 40px', borderRadius: 22, overflow: 'hidden', border: '1px solid rgba(196,162,101,0.18)', background: '#14110C' }}>
            {/* Cal.com inline widget */}
            <iframe
              src="https://cal.com/luxique/lash-behandeling?embed=true"
              style={{ width: '100%', height: 600, border: 'none' }}
              title="Boek je afspraak"
            />
          </div>
          <p style={{ color: 'rgba(250,248,244,0.3)', fontSize: 12, letterSpacing: '0.1em' }}>
            Gratis annuleren tot 24 uur van tevoren · Bevestiging via WhatsApp
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '60px 0 100px', textAlign: 'center', color: 'rgba(250,248,244,0.3)', fontSize: 13, borderTop: '1px solid rgba(196,162,101,0.18)' }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, letterSpacing: '0.32em', color: '#FAF8F4', marginBottom: 16 }}>LUXIQUE</div>
        <p>Eerst begrijpen, dan doen.</p>
        <p style={{ marginTop: 16, fontSize: 11, letterSpacing: '0.1em' }}>© LUXIQUE · 2026</p>
      </footer>
    </main>
  )
}
