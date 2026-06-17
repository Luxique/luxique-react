'use client'

import { useEffect, useRef } from 'react'
import Navbar from '@/components/Navbar'

export default function AboutPage() {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    // Reveal on scroll
    const io = new IntersectionObserver((es) => {
      es.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in')
          io.unobserve(e.target)
        }
      })
    }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' })

    root.querySelectorAll('.rv,.clip').forEach(el => io.observe(el))

    // Light parallax on duo photos
    const ph = Array.from(root.querySelectorAll('.ph2 .img[data-speed]')) as HTMLElement[]
    let tick = false

    const par = () => {
      const vh = window.innerHeight
      ph.forEach(el => {
        const r = el.getBoundingClientRect()
        const c = r.top + r.height / 2
        const off = (c - vh / 2) / vh
        el.style.transform = `translateY(${off * (parseFloat(el.dataset.speed || '0') * 100)}px)`
      })
      tick = false
    }

    const onScroll = () => {
      if (!tick) {
        tick = true
        requestAnimationFrame(par)
      }
    }

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!reduced) {
      window.addEventListener('scroll', onScroll, { passive: true })
      par()
    }

    return () => {
      io.disconnect()
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return (
    <>
      <Navbar />
      <div ref={rootRef}>
        <style>{`
          .about-page {
            --bg:#F3EFE7; --panel:#FBF8F2; --ink:#1C1814; --ink-soft:#46403A;
            --gold:#B08D4F; --gold-soft:#C9A86A; --gold-bright:#D8B97A;
            --green1:#2a3128; --green2:#1c211a; --green-deep:#141811;
            --on-green:#F6F1E7; --on-green-soft:rgba(246,241,231,.72);
            --line:rgba(28,24,20,.13);
            background:var(--bg);color:var(--ink);
            font-family:'Jost',sans-serif;font-size:1.05rem;line-height:1.65;
            -webkit-font-smoothing:antialiased;overflow-x:hidden;
          }
          .about-page .serif{font-family:'Cormorant Garamond',serif}
          .about-page em{font-style:italic}
          .about-page section{position:relative}
          .about-page .wrap{max-width:1080px;margin:0 auto;padding:0 24px}

          .about-page .rv{opacity:0;transform:translateY(28px);transition:opacity .9s cubic-bezier(.2,.7,.2,1),transform .9s cubic-bezier(.2,.7,.2,1)}
          .about-page .rv.in{opacity:1;transform:none}
          .about-page .rv.d1{transition-delay:.08s}
          .about-page .rv.d2{transition-delay:.16s}
          .about-page .rv.d3{transition-delay:.24s}
          .about-page .rv.d4{transition-delay:.32s}
          @media(prefers-reduced-motion:reduce){.about-page .rv{opacity:1;transform:none;transition:none}.about-page .clip{clip-path:none}}

          /* HERO */
          .about-page .hero{min-height:100svh;display:flex;flex-direction:column;justify-content:center;padding-top:64px;overflow:hidden}
          .about-page .hero .eyebrow{display:flex;align-items:center;gap:14px;color:var(--gold);letter-spacing:.24em;text-transform:uppercase;font-size:.78rem;margin-bottom:22px}
          .about-page .hero .eyebrow::before{content:"";width:46px;height:1px;background:var(--gold)}
          .about-page .hero h1{font-family:'Cormorant Garamond',serif;font-weight:600;line-height:.92;font-size:clamp(3.4rem,13vw,8.5rem);letter-spacing:-.01em;margin:0}
          .about-page .hero h1 .l2{display:block;color:var(--gold);font-style:italic;font-weight:500}
          .about-page .hero .sub{margin-top:26px;max-width:46ch;font-size:1.15rem;color:var(--ink-soft)}
          .about-page .ghost{position:absolute;right:-4vw;bottom:-2vh;font-family:'Cormorant Garamond';font-weight:600;font-size:22vw;color:rgba(176,141,79,.07);pointer-events:none;letter-spacing:.02em;z-index:0}
          .about-page .hero .wrap{position:relative;z-index:1}
          .about-page .scrollcue{position:absolute;bottom:26px;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:8px;color:var(--ink-soft);font-size:.72rem;letter-spacing:.2em;text-transform:uppercase;z-index:2}
          .about-page .scrollcue .bar{width:1px;height:42px;background:linear-gradient(var(--gold),transparent);animation:cue 2s ease-in-out infinite}
          @keyframes cue{0%,100%{transform:scaleY(.4);transform-origin:top;opacity:.4}50%{transform:scaleY(1);opacity:1}}

          /* INTRO */
          .about-page .intro{padding:14vh 0}
          .about-page .intro-grid{display:grid;grid-template-columns:1.05fr .95fr;gap:64px;align-items:center}
          .about-page .portrait{position:relative;border-radius:18px;overflow:hidden;aspect-ratio:4/5;box-shadow:0 40px 80px -40px rgba(28,24,20,.5)}
          .about-page .portrait .img{position:absolute;inset:0;background:linear-gradient(135deg,#cdbfa6,#9a8a6e);display:flex;align-items:center;justify-content:center}
          .about-page .portrait .img span{font-family:'Cormorant Garamond';font-style:italic;color:rgba(255,255,255,.6);font-size:1.1rem;letter-spacing:.1em}
          .about-page .clip{clip-path:inset(0 0 100% 0);transition:clip-path 1.1s cubic-bezier(.2,.7,.2,1)}
          .about-page .clip.in{clip-path:inset(0 0 0 0)}
          .about-page .portrait .tag{position:absolute;left:18px;bottom:18px;z-index:2;background:rgba(20,24,17,.62);backdrop-filter:blur(8px);color:var(--on-green);border:1px solid rgba(246,241,231,.18);padding:9px 16px;border-radius:100px;font-size:.78rem;letter-spacing:.12em}
          .about-page .intro h2{font-family:'Cormorant Garamond',serif;font-weight:600;font-size:clamp(2.2rem,4.5vw,3.4rem);line-height:1.04;margin-bottom:22px;margin-top:0}
          .about-page .intro h2 em{color:var(--gold)}
          .about-page .intro p{color:var(--ink-soft);margin-bottom:18px;max-width:46ch}
          .about-page .sig{margin-top:26px;font-family:'Cormorant Garamond';font-style:italic;font-size:1.9rem;color:var(--gold);transform:rotate(-4deg);display:inline-block}

          /* JOURNEY */
          .about-page .journey{padding:12vh 0;background:linear-gradient(180deg,var(--bg),var(--panel))}
          .about-page .journey .head{text-align:center;margin-bottom:9vh}
          .about-page .journey .head .k{color:var(--gold);letter-spacing:.24em;text-transform:uppercase;font-size:.78rem}
          .about-page .journey .head h2{font-family:'Cormorant Garamond';font-weight:600;font-size:clamp(2.2rem,5vw,3.6rem);line-height:1.04;margin-top:14px;margin-bottom:0}
          .about-page .journey .head h2 em{color:var(--gold)}
          .about-page .steps{display:grid;grid-template-columns:repeat(3,1fr);gap:28px}
          .about-page .step{position:relative;padding:34px 28px;border:1px solid var(--line);border-radius:16px;background:var(--panel);box-shadow:0 18px 50px -30px rgba(28,24,20,.4)}
          .about-page .step .n{font-family:'Cormorant Garamond';font-style:italic;font-size:1.4rem;color:var(--gold);margin-bottom:14px}
          .about-page .step h3{font-family:'Cormorant Garamond';font-weight:600;font-size:1.6rem;margin-bottom:10px;line-height:1.1}
          .about-page .step p{color:var(--ink-soft);font-size:.98rem}

          /* PHILOSOPHY */
          .about-page .philo{background:linear-gradient(180deg,var(--green1),var(--green2) 60%,var(--green-deep));color:var(--on-green);padding:16vh 0;position:relative;overflow:hidden}
          .about-page .philo::before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 20% 20%,rgba(216,185,122,.10),transparent 40%),radial-gradient(circle at 80% 80%,rgba(216,185,122,.08),transparent 40%);pointer-events:none}
          .about-page .philo .wrap{position:relative;z-index:1;text-align:center}
          .about-page .philo .k{color:var(--gold-bright);letter-spacing:.24em;text-transform:uppercase;font-size:.78rem;margin-bottom:30px}
          .about-page .philo .quote{font-family:'Cormorant Garamond';font-weight:500;font-style:italic;font-size:clamp(2rem,5.4vw,4rem);line-height:1.12;max-width:18ch;margin:0 auto}
          .about-page .philo .quote b{color:var(--gold-bright);font-weight:600;font-style:italic}
          .about-page .philo .by{margin-top:40px;color:var(--on-green-soft);letter-spacing:.14em;font-size:.85rem;text-transform:uppercase}

          /* DUO PHOTO */
          .about-page .duo{padding:12vh 0}
          .about-page .duo-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px}
          .about-page .ph2{position:relative;border-radius:16px;overflow:hidden;aspect-ratio:3/4;box-shadow:0 30px 70px -40px rgba(28,24,20,.5)}
          .about-page .ph2:nth-child(2){margin-top:14vh}
          .about-page .ph2 .img{position:absolute;inset:-8% 0;background-size:cover;background-position:center;will-change:transform}
          .about-page .ph2 .cap{position:absolute;left:16px;bottom:16px;z-index:2;color:#fff;font-family:'Cormorant Garamond';font-style:italic;font-size:1.2rem;text-shadow:0 2px 20px rgba(0,0,0,.5)}

          /* VALUES */
          .about-page .values{padding:12vh 0;background:var(--panel)}
          .about-page .values h2{font-family:'Cormorant Garamond';font-weight:600;font-size:clamp(2rem,4.5vw,3.2rem);margin-bottom:6vh;text-align:center;margin-top:0}
          .about-page .values h2 em{color:var(--gold)}
          .about-page .vrow{display:flex;align-items:baseline;gap:24px;padding:26px 0;border-top:1px solid var(--line)}
          .about-page .vrow:last-child{border-bottom:1px solid var(--line)}
          .about-page .vrow .vn{font-family:'Cormorant Garamond';font-style:italic;color:var(--gold);font-size:1.2rem;min-width:46px}
          .about-page .vrow .vt{font-family:'Cormorant Garamond';font-weight:600;font-size:clamp(1.5rem,3vw,2.2rem);min-width:38%}
          .about-page .vrow .vd{color:var(--ink-soft);font-size:1rem}

          /* CTA */
          .about-page .cta{padding:16vh 0;text-align:center;position:relative;overflow:hidden}
          .about-page .cta h2{font-family:'Cormorant Garamond';font-weight:600;font-size:clamp(2.4rem,6vw,4.4rem);line-height:1.02;margin-top:0}
          .about-page .cta h2 em{color:var(--gold)}
          .about-page .cta .btns{margin-top:40px;display:flex;gap:16px;justify-content:center;flex-wrap:wrap}
          .about-page .btn{padding:17px 34px;border-radius:100px;font-weight:500;letter-spacing:.02em;cursor:pointer;border:1px solid transparent;font-size:1rem;text-decoration:none;display:inline-block}
          .about-page .btn-gold{background:var(--gold);color:#fff}
          .about-page .btn-ghost{background:transparent;border-color:var(--line);color:var(--ink)}
          .about-page .cta .ghost2{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-family:'Cormorant Garamond';font-size:30vw;color:rgba(176,141,79,.05);pointer-events:none;z-index:0;white-space:nowrap}
          .about-page .cta .wrap{position:relative;z-index:1}

          @media(max-width:860px){
            .about-page .intro-grid{grid-template-columns:1fr;gap:36px}
            .about-page .portrait{max-width:80%;margin:0 auto}
            .about-page .steps{grid-template-columns:1fr;gap:18px}
            .about-page .duo-grid{grid-template-columns:1fr;gap:18px}
            .about-page .ph2:nth-child(2){margin-top:0}
            .about-page .vrow{flex-direction:column;gap:6px}
            .about-page .ghost{font-size:34vw;bottom:2vh}
          }
        `}</style>

        <div className="about-page">
          {/* HERO */}
          <section className="hero">
            <div className="ghost serif">Chiva</div>
            <div className="wrap">
              <div className="eyebrow rv">Over de oprichter</div>
              <h1 className="rv d1">Chiva<span className="l2 serif">Daams.</span></h1>
              <p className="sub rv d2">Lash artist, educator en oprichter van LUXIQUE. Wat begon met één tweezer en een obsessie voor detail, groeide uit tot een academy die een nieuwe lichting lash artists vormt.</p>
            </div>
            <div className="scrollcue"><span>scroll</span><span className="bar"></span></div>
          </section>

          {/* INTRO + PORTRAIT */}
          <section className="intro">
            <div className="wrap intro-grid">
              <div className="portrait clip">
                <img src="https://osldoolmbpqayxhgmbum.supabase.co/storage/v1/object/public/images/chiva-portrait.webp" alt="Chiva Daams" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }} />
                <span className="tag">Arnhem · sinds 2019</span>
              </div>
              <div>
                <h2 className="serif rv">Niet de snelste route — <em>de juiste.</em></h2>
                <p className="rv d1">Chiva geloofde nooit in trucjes of shortcuts. Waar anderen leerden hoe je een set plaatst, wilde zij begrijpen wáárom een set werkt. Oogvorm, balans, symmetrie — de fundering onder elke mooie set.</p>
                <p className="rv d2">Die obsessie voor het waaróm werd het hart van LUXIQUE. Geen kopieën, maar artists die hun eigen signatuur durven neerzetten — en die snappen wat ze doen.</p>
                <span className="sig serif rv d3">— Chiva</span>
              </div>
            </div>
          </section>

          {/* JOURNEY */}
          <section className="journey">
            <div className="wrap">
              <div className="head">
                <div className="k rv">De reis</div>
                <h2 className="serif rv d1">Van tweezer <em>naar academy</em></h2>
              </div>
              <div className="steps">
                <div className="step rv">
                  <div className="n serif">01</div>
                  <h3 className="serif">De start</h3>
                  <p>Begonnen met een massagetafel, met een visie voor ogen en het geduld om het écht goed te leren. Elke set een nieuwe les.</p>
                </div>
                <div className="step rv d1">
                  <div className="n serif">02</div>
                  <h3 className="serif">De studio</h3>
                  <p>Een eigen plek in Arnhem, waar klanten niet voor zomaar lashes komen — maar voor lashes die bij hún ogen passen.</p>
                </div>
                <div className="step rv d2">
                  <div className="n serif">03</div>
                  <h3 className="serif">De academy</h3>
                  <p>De kennis doorgeven. LXQ Academy vormt een nieuwe lichting artists — online én in de praktijk.</p>
                </div>
              </div>
            </div>
          </section>

          {/* PHILOSOPHY */}
          <section className="philo">
            <div className="wrap">
              <div className="k rv">De filosofie</div>
              <div className="quote serif rv d1">&ldquo;Niet kopiëren. <b>Creëren.</b> Elke artist verdient een eigen handtekening.&rdquo;</div>
              <div className="by rv d2">— Chiva Daams, oprichter LUXIQUE</div>
            </div>
          </section>

          {/* DUO PHOTO */}
          <section className="duo">
            <div className="wrap duo-grid">
              <div className="ph2"><div className="img" data-speed="0.08" style={{ background: 'linear-gradient(135deg,#bfa988,#7d6a4a)' }}></div><span className="cap serif">in de studio</span></div>
              <div className="ph2"><div className="img" data-speed="0.14" style={{ background: 'linear-gradient(135deg,#6a5a72,#3a3142)' }}></div><span className="cap serif">de academy</span></div>
            </div>
          </section>

          {/* VALUES */}
          <section className="values">
            <div className="wrap">
              <h2 className="serif rv">Waar LUXIQUE <em>voor staat</em></h2>
              <div className="vrow rv"><span className="vn serif">01</span><span className="vt serif">Begrijpen</span><span className="vd">We leren het waarom, niet alleen het hoe. Inzicht dat blijft, bij elke klant.</span></div>
              <div className="vrow rv d1"><span className="vn serif">02</span><span className="vt serif">Signatuur</span><span className="vd">Geen kopieën. Elke artist ontwikkelt een herkenbaar eigen handschrift.</span></div>
              <div className="vrow rv d2"><span className="vn serif">03</span><span className="vt serif">Begeleiding</span><span className="vd">Je staat er na de opleiding niet alleen voor. Mentoring die blijft.</span></div>
            </div>
          </section>

          {/* CTA */}
          <section className="cta">
            <div className="ghost2 serif">LUXIQUE</div>
            <div className="wrap">
              <h2 className="serif rv">Klaar om je eigen <em>weg te gaan?</em></h2>
              <div className="btns rv d1">
                <a href="/courses" className="btn btn-gold">Bekijk de academy</a>
                <a href="/#behandelingen" className="btn btn-ghost">Boek een behandeling</a>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
