'use client'

import './eye-shapes-v2.css'

const SHAPES = [
  {
    name: 'Almond',
    desc: 'De allrounder — bijna elke stijl werkt. <strong>Hier mag de set het verhaal vertellen.</strong>',
    svg: `<g class="blink">
            <path class="line" d="M12 32 C36 10, 92 10, 118 32 C92 54, 36 54, 12 32 Z"/>
            <circle class="iris" cx="65" cy="32" r="12"/>
            <circle class="pupil" cx="65" cy="32" r="4.5"/>
          </g>
          <path class="accent" d="M40 12 l-3 -7 M65 9 l0 -8 M90 12 l3 -7"/>`,
  },
  {
    name: 'Round',
    desc: 'Open en expressief. <strong>Verlenging + lift</strong> geven het oog richting en elegantie.',
    svg: `<g class="blink">
            <path class="line" d="M22 32 C36 6, 94 6, 108 32 C94 58, 36 58, 22 32 Z"/>
            <circle class="iris" cx="65" cy="32" r="14"/>
            <circle class="pupil" cx="65" cy="32" r="5"/>
          </g>
          <path class="accent" d="M42 9 l-3 -7 M65 6 l0 -7 M88 9 l3 -7"/>`,
  },
  {
    name: 'Hooded',
    desc: 'Het ooglid steelt ruimte. <strong>Strategische curl &amp; lengte</strong> openen het oog weer.',
    svg: `<path class="accent" d="M16 20 C42 2, 88 2, 114 20"/>
          <g class="blink">
            <path class="line" d="M14 34 C38 16, 92 16, 116 34 C92 52, 38 52, 14 34 Z"/>
            <circle class="iris" cx="65" cy="34" r="11"/>
            <circle class="pupil" cx="65" cy="34" r="4.2"/>
          </g>`,
  },
  {
    name: 'Downturned',
    desc: 'De buitenhoek wijst omlaag. <strong>Lift met de juiste curl</strong> draait dat subtiel om.',
    svg: `<g class="blink">
            <path class="line" d="M12 28 C36 10, 86 12, 118 40 C88 52, 36 48, 12 28 Z"/>
            <circle class="iris" cx="62" cy="31" r="11.5"/>
            <circle class="pupil" cx="62" cy="31" r="4.4"/>
          </g>
          <path class="accent" d="M96 18 C104 14, 112 12, 120 13"/>`,
  },
  {
    name: 'Upturned',
    desc: 'Natuurlijke lift van zichzelf. <strong>Volg de lijn</strong> — niet ertegenin werken.',
    svg: `<g class="blink">
            <path class="line" d="M12 36 C36 16, 84 8, 118 22 C90 48, 38 54, 12 36 Z"/>
            <circle class="iris" cx="62" cy="33" r="11.5"/>
            <circle class="pupil" cx="62" cy="33" r="4.4"/>
          </g>
          <path class="accent" d="M98 10 l4 -7 M110 12 l6 -5"/>`,
  },
  {
    name: 'Wide Set',
    desc: 'Ruimte tussen de ogen. <strong>Inner corner focus</strong> brengt alles in balans.',
    svg: `<g class="blink">
            <path class="line" d="M6 32 C16 18, 40 18, 50 32 C40 46, 16 46, 6 32 Z"/>
            <circle class="iris" cx="28" cy="32" r="8"/>
            <circle class="pupil" cx="28" cy="32" r="3.2"/>
            <path class="line" d="M80 32 C90 18, 114 18, 124 32 C114 46, 90 46, 80 32 Z"/>
            <circle class="iris" cx="102" cy="32" r="8"/>
            <circle class="pupil" cx="102" cy="32" r="3.2"/>
          </g>
          <path class="accent" d="M58 32 h14" stroke-dasharray="3 4"/>`,
  },
]

export default function EyeShapes() {
  return (
    <section className="eyeshapes-panel">
      <div className="eyeshapes-inner">

        <div className="eyeshapes-head">
          <div>
            <div className="eyeshapes-eyebrow">Kennis</div>
            <h2 className="eyeshapes-h2">Elk oog is anders.<br />Elke set <em>ook.</em></h2>
          </div>
          <p className="eyeshapes-manifesto">
            De meeste cursussen leren je één set voor iedereen. Wij beginnen waar het echt begint: <b>jouw oogvorm</b>. Want wat een almond oog laat stralen, doet een hooded oog dicht. Daarom ontwerpen we elke set rond het oog dat &apos;m draagt.
          </p>
        </div>

        <div className="eyeshapes-grid">
          {SHAPES.map((shape) => (
            <article key={shape.name} className="eyeshapes-card">
              <svg viewBox="0 0 130 64" dangerouslySetInnerHTML={{ __html: shape.svg }} />
              <h3>{shape.name}</h3>
              <p dangerouslySetInnerHTML={{ __html: shape.desc }} />
            </article>
          ))}
        </div>

      </div>
    </section>
  )
}
