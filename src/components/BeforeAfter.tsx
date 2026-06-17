'use client'

const CDN = 'https://osldoolmbpqayxhgmbum.supabase.co/storage/v1/object/public/images'

const BA_PAIRS = [
  { name: 'Wispy Set', before: `${CDN}/ba-wispy-before.webp`, after: `${CDN}/ba-wispy-after.webp` },
  { name: 'Medusa Set', before: `${CDN}/ba-medusa-before.webp`, after: `${CDN}/ba-medusa-after.webp` },
]

export default function BeforeAfter() {
  return (
    <section className="ba-section">
      <style>{`
        .ba-section {
          background: #FBF8F2;
          padding: clamp(48px, 7vw, 96px) 0;
        }
        .ba-wrap {
          max-width: 1180px;
          margin: 0 auto;
          padding: 0 28px;
        }
        .ba-grid {
          display: grid;
          grid-template-columns: 0.85fr 1.15fr;
          gap: 48px;
          align-items: center;
        }
        .ba-copy {
          opacity: 0;
          transform: translateY(22px);
          transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .ba-copy.revealed {
          opacity: 1;
          transform: none;
        }
        .ba-eyebrow {
          display: block;
          font-family: 'Jost', system-ui, sans-serif;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: #B08D4F;
          margin-bottom: 16px;
        }
        .ba-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-weight: 500;
          font-size: clamp(2.6rem, 4.5vw, 4rem);
          line-height: 1.02;
          margin-bottom: 20px;
          color: #1C1814;
          letter-spacing: -0.01em;
        }
        .ba-title em {
          font-style: italic;
          color: #B08D4F;
        }
        .ba-desc {
          color: #46403A;
          font-size: 1rem;
          line-height: 1.6;
          margin-bottom: 14px;
          max-width: 42ch;
        }
        .ba-hint {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-top: 10px;
          font-size: 13.5px;
          color: #B08D4F;
          font-weight: 500;
        }
        .ba-pair {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          opacity: 0;
          transform: translateY(22px);
          transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.1s, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.1s;
        }
        .ba-pair.revealed {
          opacity: 1;
          transform: none;
        }
        .ba-item {
          position: relative;
          overflow: hidden;
          border-radius: 16px;
          aspect-ratio: 4/5;
          user-select: none;
          cursor: ew-resize;
          background: #E0DCD4;
        }
        .ba-item img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          pointer-events: none;
        }
        .ba-after-img {
          z-index: 1;
          transition: clip-path 0.2s ease-out;
          clip-path: inset(0 0 0 50%);
        }
        .ba-before-img {
          z-index: 0;
        }
        .ba-handle {
          position: absolute;
          top: 0;
          bottom: 0;
          left: 50%;
          width: 2px;
          background: rgba(251, 248, 242, 0.9);
          transform: translateX(-1px);
          pointer-events: none;
          box-shadow: 0 0 14px rgba(0, 0, 0, 0.35);
        }
        .ba-grip {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(251, 248, 242, 0.92);
          display: grid;
          place-items: center;
          pointer-events: none;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
        }
        .ba-grip svg {
          width: 20px;
          height: 20px;
          color: #B08D4F;
        }
        .ba-tag {
          position: absolute;
          z-index: 3;
          font-size: 10.5px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          font-weight: 600;
          padding: 6px 13px;
          border-radius: 999px;
          background: rgba(28, 24, 20, 0.55);
          color: #fff;
          backdrop-filter: blur(4px);
        }
        .ba-tag.before {
          top: 14px;
          left: 14px;
        }
        .ba-tag.after {
          top: 14px;
          right: 14px;
          background: #B08D4F;
          color: #0e0b09;
        }
        .ba-name {
          position: absolute;
          z-index: 3;
          left: 50%;
          bottom: 16px;
          transform: translateX(-50%);
          background: rgba(251, 248, 242, 0.92);
          color: #1C1814;
          font-size: 13px;
          font-weight: 500;
          padding: 7px 16px;
          border-radius: 999px;
          letter-spacing: 0.02em;
          white-space: nowrap;
        }
        @media (max-width: 860px) {
          .ba-grid {
            grid-template-columns: 1fr;
            gap: 30px;
          }
          .ba-pair {
            grid-template-columns: 1fr;
            gap: 18px;
          }
          .ba-item {
            max-width: 440px;
            margin: 0 auto;
            width: 100%;
          }
          .ba-section {
            padding: 70px 0;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .ba-copy, .ba-pair {
            opacity: 1;
            transform: none;
            transition: none;
          }
        }
      `}</style>

      <div className="ba-wrap">
        <div className="ba-copy">
          <span className="ba-eyebrow">Resultaten</span>
          <h2 className="ba-title">Before &amp; <em>After</em></h2>
          <p className="ba-desc">Geen voor-en-na om indruk te maken, maar om te laten zien hoe een set rond jouw oog wordt gebouwd.</p>
          <p className="ba-desc">Sleep over elke foto en zie het verschil zelf.</p>
          <span className="ba-hint">← sleep om te onthullen →</span>
        </div>
        <div className="ba-pair">
          {BA_PAIRS.map((pair) => (
            <div key={pair.name} className="ba-item" data-ba>
              <img className="ba-after-img" src={pair.after} alt={pair.name} />
              <img className="ba-before-img" src={pair.before} alt={pair.name} />
              <span className="ba-tag before">Before</span>
              <span className="ba-tag after">After</span>
              <div className="ba-handle" />
              <div className="ba-grip">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 7l-5 5 5 5M16 7l5 5-5 5"/>
                </svg>
              </div>
              <span className="ba-name">{pair.name}</span>
            </div>
          ))}
        </div>
      </div>

      <script>{`
        document.querySelectorAll('[data-ba]').forEach(ba=>{
          const after=ba.querySelector('.after-img');
          const handle=ba.querySelector('.ba-handle');
          const grip=ba.querySelector('.ba-grip');
          let dragging=false;
          function set(clientX){
            const r=ba.getBoundingClientRect();
            let pct=((clientX-r.left)/r.width)*100;
            pct=Math.max(0,Math.min(100,pct));
            after.style.clipPath='inset(0 0 0 '+pct+'%)';
            handle.style.left=pct+'%';
            grip.style.left=pct+'%';
          }
          const start=e=>{
            dragging=true;
            set((e.touches?e.touches[0].clientX:e.clientX));
          };
          const move=e=>{
            if(dragging)set((e.touches?e.touches[0].clientX:e.clientX));
          };
          const end=()=>dragging=false;
          ba.addEventListener('mousedown',start);
          ba.addEventListener('touchstart',start,{passive:!0});
          window.addEventListener('mousemove',move);
          window.addEventListener('touchmove',move,{passive:!0});
          window.addEventListener('mouseup',end);
          window.addEventListener('touchend',end);
          ba.addEventListener('click',e=>set(e.clientX));
        });
        const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('revealed');io.unobserve(e.target)}}),{threshold:.1});
        document.querySelectorAll('.ba-copy,.ba-pair').forEach(el=>io.observe(el));
      `}</script>
    </section>
  )
}