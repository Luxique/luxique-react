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
        .ba-copy .eyebrow {
          display: block;
          margin-bottom: 16px;
        }
        .ba-copy h2 {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-weight: 500;
          font-size: clamp(2.6rem, 4.5vw, 4rem);
          line-height: 1.02;
          margin-bottom: 20px;
        }
        .ba-copy h2 em {
          font-style: italic;
          color: #B08D4F;
        }
        .ba-copy p {
          color: #46403A;
          font-size: 1rem;
          max-width: 42ch;
          margin-bottom: 14px;
        }
        .ba-copy .hint {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-top: 10px;
          font-size: 13.5px;
          color: #B08D4F;
          font-weight: 500;
        }
        .eyebrow {
          font-family: 'Jost', system-ui, sans-serif;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: #B08D4F;
        }
        .ba-pair {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        .ba {
          position: relative;
          overflow: hidden;
          border-radius: 16px;
          aspect-ratio: 4/5;
          user-select: none;
          cursor: ew-resize;
          background: #ccc;
        }
        .ba img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          pointer-events: none;
        }
        .ba .after-img {
          z-index: 1;
        }
        .ba .before-img {
          z-index: 0;
        }
        .ba .handle {
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
        .ba .grip {
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
        .ba .grip svg {
          width: 20px;
          height: 20px;
          color: #B08D4F;
        }
        .ba .tag {
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
        .ba .tag.before {
          top: 14px;
          left: 14px;
        }
        .ba .tag.after {
          top: 14px;
          right: 14px;
          background: #B08D4F;
          color: #0e0b09;
        }
        .ba .name {
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
        .reveal {
          opacity: 0;
          transform: translateY(22px);
          transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .reveal.in {
          opacity: 1;
          transform: none;
        }
        @media (prefers-reduced-motion: reduce) {
          .reveal {
            opacity: 1;
            transform: none;
          }
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
          .ba {
            max-width: 440px;
            margin: 0 auto;
            width: 100%;
          }
          .ba-section {
            padding: 70px 0;
          }
        }
      `}</style>

      <div className="ba-wrap">
        <div className="ba-grid">
          <div className="ba-copy reveal">
            <span className="eyebrow">Resultaten</span>
            <h2>Before &amp; <em>After</em></h2>
            <p>Geen voor-en-na om indruk te maken, maar om te laten zien hoe een set rond jouw oog wordt gebouwd.</p>
            <p>Sleep over elke foto en zie het verschil zelf.</p>
            <span className="hint">← sleep om te onthullen →</span>
          </div>
          <div className="ba-pair reveal">
            {BA_PAIRS.map((pair) => (
              <div key={pair.name} className="ba" data-ba>
                <img className="before-img" src={pair.before} alt="" />
                <img className="after-img" src={pair.after} alt="" />
                <span className="tag before">Before</span>
                <span className="tag after">After</span>
                <div className="handle" />
                <div className="grip">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8 7l-5 5 5 5M16 7l5 5-5 5"/>
                  </svg>
                </div>
                <span className="name">{pair.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <script>{`
        document.querySelectorAll('[data-ba]').forEach(ba=>{
          const after=ba.querySelector('.after-img');
          const handle=ba.querySelector('.handle');
          const grip=ba.querySelector('.grip');
          let dragging=false;
          function set(clientX){
            const r=ba.getBoundingClientRect();
            let pct=((clientX-r.left)/r.width)*100;
            pct=Math.max(0,Math.min(100,pct));
            after.style.clipPath='inset(0 0 0 '+pct+'%)';
            handle.style.left=pct+'%';
            grip.style.left=pct+'%';
          }
          after.style.clipPath='inset(0 0 0 50%)';
          const start=e=>{dragging=true;set((e.touches?e.touches[0]:e).clientX)};
          const move=e=>{if(dragging)set((e.touches?e.touches[0]:e).clientX)};
          const end=()=>dragging=false;
          ba.addEventListener('mousedown',start);
          ba.addEventListener('touchstart',start,{passive:true});
          window.addEventListener('mousemove',move);
          window.addEventListener('touchmove',move,{passive:true});
          window.addEventListener('mouseup',end);
          window.addEventListener('touchend',end);
          ba.addEventListener('click',e=>set(e.clientX));
        });
        const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.15});
        document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
      `}</script>
    </section>
  )
}