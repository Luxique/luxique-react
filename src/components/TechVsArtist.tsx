export default function TechVsArtist() {
  return (
    <section className="py-24 bg-[var(--bg2)]">
      <div className="max-w-[900px] mx-auto px-6">
        {/* Intro */}
        <p className="text-[15px] text-[var(--text2)] leading-relaxed text-center mb-16 max-w-[600px] mx-auto">
          Er is een verschil tussen wimpers zetten en wimpers creëren.<br />
          Ik leer je het tweede.
        </p>

        {/* Two columns */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Lash Tech */}
          <div className="bg-white rounded-2xl p-8 border border-[var(--border)]">
            <div className="text-3xl mb-3">🔧</div>
            <h3 className="font-['Cormorant_Garamond'] text-[20px] font-normal mb-4">Lash Tech</h3>
            <p className="text-[13px] text-[var(--text2)] leading-[1.9]">
              Je beheerst de techniek. Je werkt nauwkeurig. Je legt fans aan. Je klant gaat tevreden naar huis.
            </p>
            <p className="text-[13px] text-[var(--text2)] leading-[1.9] mt-4">
              Maar je werkt grotendeels vanuit standaard maps en vaste patronen — Russian volume, hybrids, classics. Je kopieert wat werkt.
            </p>
            <p className="text-[13px] text-[var(--text2)] leading-[1.9] mt-4">
              Er is niets mis mee. Maar er is meer.
            </p>
            <div className="mt-6 pt-4 border-t border-[var(--border)] text-[11px] text-[var(--text3)] tracking-wide uppercase">
              De basis. Het startpunt.
            </div>
          </div>

          {/* Lash Artist */}
          <div className="bg-white rounded-2xl p-8 border border-[var(--rose)] shadow-[0_0_20px_rgba(201,169,106,0.1)]">
            <div className="text-3xl mb-3">✦</div>
            <h3 className="font-['Cormorant_Garamond'] text-[20px] font-normal text-[var(--rose)] mb-4">Lash Artist</h3>
            <p className="text-[13px] text-[var(--text2)] leading-[1.9] font-medium">
              Je ziet het oog. Niet de wimper.
            </p>
            <p className="text-[13px] text-[var(--text2)] leading-[1.9] mt-4">
              Je analyseert de oogvorm voordat je begint. Je weet welke curl past bij welk oog — en waarom. Je bouwt een set die echt van díe persoon is. Niet een kopie van wat iedereen maakt.
            </p>
            <div className="mt-6 pt-4 border-t border-[var(--rose)]/[0.2] text-[11px] text-[var(--rose)] tracking-wide uppercase">
              Waar ik je naartoe breng.
            </div>
          </div>
        </div>

        {/* Pull Quote */}
        <div className="pull-quote text-center">
          &ldquo;A normal lash tech just copies and pastes. I look at eye shapes. I have knowledge about every curl and I know how to use it, when to use it.&rdquo;
        </div>

        {/* Bridge */}
        <p className="text-center text-[15px] text-[var(--text2)] mt-8">
          Bij LXQ Academy leer ik je denken als een artist. Vanaf dag één.
        </p>

        {/* CTA */}
        <div className="text-center mt-8">
          <a href="#academy" className="btn-filled">Bekijk de opleidingen →</a>
        </div>
      </div>
    </section>
  )
}
