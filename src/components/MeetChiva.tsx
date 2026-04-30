export default function MeetChiva() {
  return (
    <section id="over-mij" className="py-24 bg-white">
      <div className="max-w-[900px] mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Image placeholder */}
          <div className="aspect-[3/4] bg-gradient-to-br from-[#f5f0eb] to-[#e8ddd0] rounded-2xl flex items-center justify-center border border-[var(--border)]">
            <div className="text-center">
              <div className="text-4xl mb-3">📸</div>
              <p className="text-[12px] text-[var(--text3)]">Chiva — Portrait Photo</p>
              <p className="text-[10px] text-[var(--text3)] mt-1">/Desktop/LBC/Foto_s/</p>
            </div>
          </div>

          {/* Text */}
          <div>
            <div className="section-tag">Over mij</div>
            <h2 className="section-title mb-6">
              Meet <em>Chiva</em>
            </h2>
            <div className="space-y-4 text-[14px] text-[var(--text2)] leading-[1.9]">
              <p>
                Ik ben Chiva, lash artist en oprichter van LXQ Academy in Arnhem. Toen ik begon met lashes, wist ik meteen: dit is wat ik wil doen. Maar ik wilde het op mijn manier doen.
              </p>
              <p>
                In een markt waar Russian volume de standaard was, koos ik voor wispy — lichter, natuurlijker, meer &ldquo;me&rdquo;. Mensen snapten het niet altijd in het begin. Maar ik bleef consistent, en nu is wispy één van de meest gevraagde styles.
              </p>
              <p>
                LXQ Academy is mijn manier om alles door te geven wat ik heb geleerd. Niet alleen de techniek, maar het denken als een artist.
              </p>
            </div>
            <div className="mt-8 flex items-center gap-6">
              <a href="https://instagram.com/lashedbychiva" target="_blank" className="text-[13px] text-[var(--rose)] font-semibold hover:text-[var(--rose-light)] transition">
                @lashedbychiva →
              </a>
              <a href="#academy" className="text-[13px] text-[var(--rose)] font-semibold hover:text-[var(--rose-light)] transition">
                Bekijk de opleidingen →
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
