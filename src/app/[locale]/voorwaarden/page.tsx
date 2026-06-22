'use client'

import { useEffect, useRef } from 'react'
import { useTranslations, useLocale } from 'next-intl'

export default function VoorwaardenPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const t = useTranslations('Policies')
  const locale = useLocale()
  const isNL = locale === 'nl'

  useEffect(() => {
    // Reading progress
    const onScroll = () => {
      const h = document.documentElement
      const max = h.scrollHeight - h.clientHeight
      const bar = document.querySelector('.juridisch-progress') as HTMLElement
      if (bar) bar.style.width = (max > 0 ? (h.scrollTop / max * 100) : 0) + '%'
    }
    document.addEventListener('scroll', onScroll, { passive: true })
    onScroll()

    // Scroll-spy
    const links = Array.from(document.querySelectorAll('.juridisch-index a[data-target]')) as HTMLElement[]
    const map: Record<string, HTMLElement> = {}
    links.forEach(a => { const tt = a.dataset.target; if (tt) map[tt] = a })

    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          links.forEach(l => l.classList.remove('juridisch-active'))
          const a = map[e.target.id]
          if (a) a.classList.add('juridisch-active')
        }
      })
    }, { rootMargin: '-30% 0px -60% 0px', threshold: 0 })

    document.querySelectorAll('.juridisch-doc').forEach(d => io.observe(d))

    return () => {
      document.removeEventListener('scroll', onScroll)
      io.disconnect()
    }
  }, [])

  const css = `:root{
    --bg:#F3EFE7; --bg-soft:#EDE7DB; --panel:#FBF8F2;
    --ink:#1C1814; --ink-soft:#4A433B; --ink-faint:#7A7167;
    --card-dark:#1A1611; --card-dark-2:#241D14;
    --gold:#B08D4F; --gold-soft:#C9A86A; --gold-bright:#D8B97A;
    --gold-glow:rgba(176,141,79,.4);
    --line:rgba(28,24,20,.12);
    --display:"Cormorant Garamond",Georgia,serif;
    --body:"Jost",system-ui,sans-serif;
  }
  html{scroll-behavior:smooth}
  .juridisch-root{background:var(--bg);color:var(--ink);font-family:var(--body);font-size:1.05rem;line-height:1.65;-webkit-font-smoothing:antialiased;overflow-x:clip}
  .juridisch-root .serif{font-family:var(--display)}
  .juridisch-root em{font-style:italic}
  .juridisch-root section{position:relative}
  .juridisch-root .wrap{max-width:1080px;margin:0 auto;padding:0 24px}
  .juridisch-root .rv{opacity:0;transform:translateY(28px);transition:opacity .9s cubic-bezier(.2,.7,.2,1),transform .9s cubic-bezier(.2,.7,.2,1)}
  .juridisch-root .rv.in{opacity:1;transform:none}
  @media(prefers-reduced-motion:reduce){.juridisch-root .rv{opacity:1;transform:none;transition:none}.juridisch-root .clip{clip-path:none}}
  .juridisch-progress{position:fixed;top:0;left:0;height:3px;width:0%;z-index:50;background:linear-gradient(90deg,var(--gold-soft),var(--gold));box-shadow:0 0 12px -2px rgba(176,141,79,.4);transition:width .1s linear}
  .juridisch-hero{min-height:70vh;display:flex;flex-direction:column;justify-content:center;padding-top:100px;padding-bottom:60px;position:relative;overflow:hidden;
    background:
      radial-gradient(120% 90% at 50% -20%, rgba(176,141,79,.10), transparent 60%),
      linear-gradient(180deg,var(--bg) 0%,var(--bg-soft) 100%)}
  .juridisch-hero .eyebrow{display:flex;align-items:center;gap:14px;color:var(--gold);letter-spacing:.24em;text-transform:uppercase;font-size:.78rem;margin-bottom:22px}
  .juridisch-hero .eyebrow::before{content:"";width:46px;height:1px;background:var(--gold)}
  .juridisch-hero h1{font-family:var(--display);font-weight:600;line-height:.92;font-size:clamp(3.4rem,13vw,8.5rem);letter-spacing:-.01em;margin:0}
  .juridisch-hero h1 .l2{display:block;color:var(--gold);font-style:italic;font-weight:500}
  .juridisch-hero .sub{margin-top:26px;max-width:46ch;font-size:1.15rem;color:var(--ink-soft)}
  .juridisch-hero .updated{margin-top:18px;font-size:.82rem;color:var(--ink-faint);letter-spacing:.04em}
  .juridisch-hero .ghost{position:absolute;right:-4vw;bottom:-2vh;font-family:var(--display);font-weight:600;font-size:22vw;color:rgba(176,141,79,.07);pointer-events:none;letter-spacing:.02em;z-index:0}
  .juridisch-hero .wrap{position:relative;z-index:1}
  .juridisch-wrap{display:grid;grid-template-columns:240px 1fr;gap:64px;padding-top:80px;padding-bottom:120px}
  .juridisch-index{position:sticky;top:80px;align-self:start;font-size:.9rem}
  .juridisch-index .index-label{font-family:var(--body);font-weight:600;font-size:.72rem;letter-spacing:.18em;text-transform:uppercase;color:var(--gold);margin-bottom:1.2rem}
  .juridisch-index a{display:flex;align-items:baseline;gap:12px;padding:.5rem 0;color:var(--ink-soft);text-decoration:none;transition:color .2s}
  .juridisch-index a:hover{color:var(--ink)}
  .juridisch-index a .num{font-family:var(--display);font-style:italic;font-size:.82rem;color:var(--gold-soft);min-width:24px}
  .juridisch-index a .txt{font-size:.88rem}
  .juridisch-index a.juridisch-active{color:var(--ink)}
  .juridisch-index a.juridisch-active .num{color:var(--gold-bright)}
  .juridisch-index a.juridisch-active .txt{color:var(--ink)}
  .juridisch-index .index-foot{margin-top:1.6rem;padding-top:1.4rem;border-top:1px solid var(--line);font-size:.82rem;color:var(--ink-faint);line-height:1.6;padding-left:2px}
  .juridisch-index .index-foot a{color:var(--gold);text-decoration:none}
  .juridisch-index .index-foot a:hover{text-decoration:underline}
  .juridisch-content{min-width:0}
  .juridisch-doc{scroll-margin-top:32px;margin-bottom:clamp(56px,7vw,96px)}
  .juridisch-doc:last-child{margin-bottom:0}
  .juridisch-doc .doc-head{display:flex;align-items:baseline;gap:1rem;margin-bottom:.4rem}
  .juridisch-doc .doc-head .dnum{font-family:var(--display);font-style:italic;font-weight:500;font-size:clamp(1.6rem,3vw,2.1rem);color:var(--gold)}
  .juridisch-doc .doc-head h2{font-family:var(--display);font-weight:500;font-size:clamp(2rem,4vw,3rem);line-height:1.05;letter-spacing:-.01em;margin:0}
  .juridisch-doc .doc-meta{font-size:.82rem;color:var(--ink-faint);letter-spacing:.04em;margin-bottom:1.6rem}
  .juridisch-doc .tldr{background:radial-gradient(120% 130% at 0% 0%, rgba(176,141,79,.12), transparent 55%),var(--panel);border:1px solid var(--line);border-radius:16px;padding:clamp(20px,2.6vw,30px);margin-bottom:2.2rem;box-shadow:0 14px 40px -28px var(--gold-glow)}
  .juridisch-doc .tldr h3{font-family:var(--body);font-weight:600;font-size:.74rem;letter-spacing:.2em;text-transform:uppercase;color:var(--gold);margin-bottom:.9rem}
  .juridisch-doc .tldr ul{list-style:none;display:flex;flex-direction:column;gap:.55rem;margin:0;padding:0}
  .juridisch-doc .tldr li{position:relative;padding-left:1.5rem;font-size:.98rem;color:var(--ink-soft)}
  .juridisch-doc .tldr li::before{content:"";position:absolute;left:0;top:.62em;width:7px;height:7px;border-radius:50%;background:var(--gold);box-shadow:0 0 0 3px rgba(176,141,79,.18)}
  .juridisch-doc p{margin-bottom:.9rem;color:var(--ink-soft)}
  .juridisch-doc p strong,.juridisch-doc li strong{color:var(--ink);font-weight:600}
  .juridisch-doc h4{font-family:var(--display);font-weight:600;font-size:1.35rem;margin:1.9rem 0 .5rem;color:var(--ink);scroll-margin-top:32px}
  .juridisch-doc h4:first-of-type{margin-top:.6rem}
  .juridisch-doc ul.list{list-style:none;margin:.4rem 0 1.1rem;display:flex;flex-direction:column;gap:.5rem}
  .juridisch-doc ul.list li{position:relative;padding-left:1.4rem;color:var(--ink-soft)}
  .juridisch-doc ul.list li::before{content:"";position:absolute;left:.1rem;top:.66em;width:6px;height:6px;border-radius:50%;background:var(--gold-soft)}
  .juridisch-doc .art{margin-bottom:1.3rem;scroll-margin-top:32px}
  .juridisch-doc .art .art-h{font-family:var(--body);font-weight:600;font-size:1.02rem;color:var(--ink);margin-bottom:.3rem;letter-spacing:.01em}
  .juridisch-doc .art p{margin-bottom:.5rem}
  .juridisch-doc .sub{font-family:var(--body);font-weight:600;font-size:.78rem;letter-spacing:.14em;text-transform:uppercase;color:var(--gold);margin:1.4rem 0 .7rem}
  .juridisch-doc a.inline{color:var(--gold);text-decoration:none;border-bottom:1px solid rgba(176,141,79,.4)}
  .juridisch-doc a.inline:hover{border-bottom-color:var(--gold)}
  .juridisch-divider{height:1px;background:var(--line);margin:clamp(40px,5vw,64px) 0}
  .juridisch-bizcard{background:linear-gradient(165deg,var(--card-dark-2),var(--card-dark));border:1px solid rgba(176,141,79,.3);border-radius:18px;padding:clamp(24px,3vw,38px);color:rgba(246,241,231,.8);margin-top:clamp(40px,5vw,64px);font-size:.92rem;line-height:1.9}
  .juridisch-bizcard .bc-title{font-family:var(--display);font-style:italic;font-size:1.5rem;color:var(--gold-bright);margin-bottom:.6rem}
  .juridisch-bizcard a{color:var(--gold-soft);text-decoration:none}
  .juridisch-bizcard a:hover{text-decoration:underline}
  .juridisch-disclaimer{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:14px 20px;margin-bottom:32px;font-size:.82rem;color:var(--ink-faint);line-height:1.6;font-style:italic}
  @media (max-width:880px){
    .juridisch-wrap{grid-template-columns:1fr;gap:0}
    .juridisch-index{position:static;margin-bottom:36px;background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:18px}
    .juridisch-index .index-foot{display:none}
  }
  @media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}}`

  const html = `
  <div class="juridisch-progress"></div>

  <header class="juridisch-hero">
    <div class="ghost serif">LUXIQUE</div>
    <div class="wrap">
      <div class="eyebrow">${t('heroEyebrow')}</div>
      <h1>${t('heroTitlePlain')}<span class="l2 serif">${t('heroTitleEm')}</span></h1>
      <p class="sub">${t('heroSubtitle')}</p>
      <div class="updated">${t('lastUpdated')}</div>
    </div>
  </header>

  <div class="juridisch-wrap wrap">

    <nav class="juridisch-index" id="index">
      <div class="index-label">${t('tocTitle')}</div>
      <a href="#voorwaarden" data-target="voorwaarden"><span class="num">${t('toc01Num')}</span><span class="txt">${t('toc01')}</span></a>
      <a href="#privacy" data-target="privacy"><span class="num">${t('toc02Num')}</span><span class="txt">${t('toc02')}</span></a>
      <a href="#cookies" data-target="cookies"><span class="num">${t('toc03Num')}</span><span class="txt">${t('toc03')}</span></a>
      <a href="#annulering" data-target="annulering"><span class="num">${t('toc04Num')}</span><span class="txt">${t('toc04')}</span></a>
      <div class="index-foot">
        ${t('tocQuestions')} <a href="mailto:${t('tocEmail')}">${t('tocEmail')}</a><br>${t('tocOrDm')} <a href="https://instagram.com/lashedbychiva">${t('tocInstagram')}</a>.
      </div>
    </nav>

    <main class="juridisch-content">

      ${!isNL && t('disclaimer') ? `<div class="juridisch-disclaimer">${t('disclaimer')}</div>` : ''}

      <!-- 1. TERMS -->
      <section class="juridisch-doc" id="voorwaarden">
        <div class="doc-head"><span class="dnum">${t('termsNum')}</span><h2>${t('termsTitle')}</h2></div>
        <div class="doc-meta">${t('termsKvk')}</div>

        <div class="tldr">
          <h3>${t('termsShortTitle')}</h3>
          <ul>
            <li>${t('termsShort1')}</li>
            <li>${t('termsShort2')}</li>
            <li>${t('termsShort3')}</li>
            <li>${t('termsShort4')}</li>
            <li>${t('termsShort5')}</li>
          </ul>
        </div>

        <p>${t('termsIntro')}</p>

        <div class="art"><div class="art-h">${t('art1Title')}</div>
          <ul class="list">
            <li><strong>${t('art1Def1Label')}</strong> ${t('art1Def1')}</li>
            <li><strong>${t('art1Def2Label')}</strong> ${t('art1Def2')}</li>
            <li><strong>${t('art1Def3Label')}</strong> ${t('art1Def3')}</li>
            <li><strong>${t('art1Def4Label')}</strong> ${t('art1Def4')}</li>
            <li><strong>${t('art1Def5Label')}</strong> ${t('art1Def5')}</li>
          </ul>
        </div>

        <div class="art"><div class="art-h">${t('art2Title')}</div>
          <p>${t('art2_1')}</p>
          <p>${t('art2_2')}</p>
          <p>${t('art2_3')}</p>
        </div>

        <div class="art"><div class="art-h">${t('art3Title')}</div>
          <p>${t('art3_1')}</p>
          <p>${t('art3_2')}</p>
        </div>

        <div class="art"><div class="art-h">${t('art4Title')}</div>
          <p>${t('art4_1')}</p>
          <p>${t('art4_2Label')} ${t('art4_2')}</p>
          <p>${t('art4_3Label')} ${t('art4_3')}</p>
          <p>${t('art4_4Label')} ${t('art4_4')}</p>
          <p>${t('art4_5')}</p>
        </div>

        <div class="art"><div class="art-h">${t('art5Title')}</div>
          <p>${t('art5_1')}</p>
          <p>${t('art5_2')}</p>
          <p>${t('art5_3')}</p>
        </div>

        <div class="art"><div class="art-h">${t('art6Title')}</div>
          <div class="sub">${t('art6BehSub')}</div>
          <p>${t('art6_1')}</p>
          <p>${t('art6_2')}</p>
          <p>${t('art6_3')}</p>
          <div class="sub">${t('art6CursusSub')}</div>
          <p><strong>${t('art6_4Num')} ${t('art6_4Label')}</strong> ${t('art6_4')}</p>
          <p><strong>${t('art6_5Num')} ${t('art6_5Label')}</strong> ${t('art6_5')}</p>
          <p><strong>${t('art6_6Num')} ${t('art6_6Label')}</strong> ${t('art6_6')}</p>
          <div class="sub">${t('art6OnlineSub')}</div>
          <p>${t('art6_8')}</p>
        </div>

        <div class="art"><div class="art-h">${t('art7Title')}</div>
          <p>${t('art7_1')}</p>
          <p>${t('art7_2')}</p>
        </div>

        <div class="art"><div class="art-h">${t('art8Title')}</div>
          <p>${t('art8_1')}</p>
          <p>${t('art8_2')}</p>
          <p>${t('art8_3')}</p>
        </div>

        <div class="art"><div class="art-h">${t('art9Title')}</div>
          <p>${t('art9_1')}</p>
          <p>${t('art9_2')}</p>
          <p>${t('art9_3')}</p>
          <p>${t('art9_4')}</p>
        </div>

        <div class="art"><div class="art-h">${t('art10Title')}</div>
          <p>${t('art10_1')}</p>
          <p>${t('art10_2')}</p>
          <p>${t('art10_3')}</p>
        </div>

        <div class="art"><div class="art-h">${t('art11Title')}</div>
          <p>${t('art11_1')}</p>
          <p>${t('art11_2')}</p>
          <p>${t('art11_3')}</p>
        </div>

        <div class="art"><div class="art-h">${t('art12Title')}</div>
          <p>${t('art12_1')}</p>
          <p>${t('art12_2')}</p>
          <p>${t('art12_3')}</p>
        </div>

        <div class="art"><div class="art-h">${t('art13Title')}</div>
          <p>${t('art13_1')}</p>
          <p>${t('art13_2')}</p>
        </div>

        <div class="art"><div class="art-h">${t('art14Title')}</div>
          <p>${t('art14_1')}</p>
          <p>${t('art14_2')}</p>
          <p>${t('art14_3')}</p>
          <ul class="list">
            <li>${t('art14_3a')}</li>
            <li>${t('art14_3b')}</li>
            <li>${t('art14_3c')}</li>
          </ul>
          <p>${t('art14_4')}</p>
        </div>

        <div class="art"><div class="art-h">${t('art15Title')}</div>
          <p>${t('art15_1')}</p>
        </div>

        <div class="art"><div class="art-h">${t('art16Title')}</div>
          <p>${t('art16_1')}</p>
          <p>${t('art16_2')}</p>
          <p>${t('art16_3')}</p>
          <p>${t('art16_4')}</p>
        </div>
      </section>

      <div class="juridisch-divider"></div>

      <!-- 2. PRIVACY -->
      <section class="juridisch-doc" id="privacy">
        <div class="doc-head"><span class="dnum">${t('privNum')}</span><h2>${t('privTitle')}</h2></div>
        <div class="doc-meta">${t('privSubtitle')}</div>

        <div class="tldr">
          <h3>${t('privShortTitle')}</h3>
          <ul>
            <li>${t('privShort1')}</li>
            <li>${t('privShort2')}</li>
            <li>${t('privShort3')}</li>
            <li>${t('privShort4')}</li>
          </ul>
        </div>

        <p>${t('privIntro')}</p>

        <h4>${t('priv1Title')}</h4>
        <p>${t('priv1')}</p>
        <h4>${t('priv2Title')}</h4>
        <p>${t('priv2Intro')}</p>
        <ul class="list">
          <li>${t('priv2a')}</li>
          <li>${t('priv2b')}</li>
          <li>${t('priv2c')}</li>
          <li>${t('priv2d')}</li>
          <li>${t('priv2e')}</li>
          <li>${t('priv2f')}</li>
          <li>${t('priv2g')}</li>
        </ul>
        <h4>${t('priv3Title')}</h4>
        <ul class="list">
          <li>${t('priv3a')}</li>
          <li>${t('priv3b')}</li>
          <li>${t('priv3c')}</li>
          <li>${t('priv3d')}</li>
          <li>${t('priv3e')}</li>
        </ul>
        <h4>${t('priv4Title')}</h4>
        <p>${t('priv4')}</p>
        <h4>${t('priv5Title')}</h4>
        <p>${t('priv5')}</p>
        <h4>${t('priv6Title')}</h4>
        <p>${t('priv6')}</p>
        <h4>${t('priv7Title')}</h4>
        <p>${t('priv7Intro')}</p>
        <ul class="list">
          <li><strong>${t('priv7a').split('—')[0].trim()}</strong> — ${t('priv7a').split('—')[1]?.trim() || ''}</li>
          <li><strong>${t('priv7b').split('—')[0].trim()}</strong> — ${t('priv7b').split('—')[1]?.trim() || ''}</li>
          <li><strong>${t('priv7c').split('—')[0].trim()}</strong> — ${t('priv7c').split('—')[1]?.trim() || ''}</li>
          <li><strong>${t('priv7d').split('—')[0].trim()}</strong> — ${t('priv7d').split('—')[1]?.trim() || ''}</li>
          <li><strong>${t('priv7e').split('—')[0].trim()}</strong> — ${t('priv7e').split('—')[1]?.trim() || ''}</li>
          <li><strong>${t('priv7f').split('—')[0].trim()}</strong> — ${t('priv7f').split('—')[1]?.trim() || ''}</li>
          <li><strong>${t('priv7g').split('—')[0].trim()}</strong> — ${t('priv7g').split('—')[1]?.trim() || ''}</li>
        </ul>
        <p>${t('priv7Outro')}</p>
        <h4>${t('priv8Title')}</h4>
        <p>${t('priv8')}</p>
        <h4>${t('priv9Title')}</h4>
        <p>${t('priv9')}</p>
        <h4>${t('priv10Title')}</h4>
        <p>${t('priv10')}</p>
      </section>

      <div class="juridisch-divider"></div>

      <!-- 3. COOKIES -->
      <section class="juridisch-doc" id="cookies">
        <div class="doc-head"><span class="dnum">${t('cookieNum')}</span><h2>${t('cookieTitle')}</h2></div>
        <div class="doc-meta">${t('cookieSubtitle')}</div>

        <div class="tldr">
          <h3>${t('cookieShortTitle')}</h3>
          <ul>
            <li>${t('cookieShort1')}</li>
            <li>${t('cookieShort2')}</li>
            <li>${t('cookieShort3')}</li>
          </ul>
        </div>

        <p>${t('cookieIntro')}</p>
        <h4>${t('cookie1Title')}</h4>
        <p>${t('cookie1')}</p>
        <h4>${t('cookie2Title')}</h4>
        <ul class="list">
          <li><strong>${t('cookie2aLabel')}</strong> ${t('cookie2a')}</li>
          <li><strong>${t('cookie2bLabel')}</strong> ${t('cookie2b')}</li>
          <li><strong>${t('cookie2cLabel')}</strong> ${t('cookie2c')}</li>
        </ul>
        <h4>${t('cookie3Title')}</h4>
        <p>${t('cookie3')}</p>
        <h4>${t('cookie4Title')}</h4>
        <p>${t('cookie4')}</p>
        <h4>${t('cookie5Title')}</h4>
        <p>${t('cookie5')}</p>
      </section>

      <div class="juridisch-divider"></div>

      <!-- 4. CANCELLATION -->
      <section class="juridisch-doc" id="annulering">
        <div class="doc-head"><span class="dnum">${t('cancelNum')}</span><h2>${t('cancelTitle')}</h2></div>
        <div class="doc-meta">${t('cancelSubtitle')}</div>

        <div class="tldr">
          <h3>${t('cancelShortTitle')}</h3>
          <ul>
            <li>${t('cancelShort1')}</li>
            <li>${t('cancelShort2')}</li>
            <li>${t('cancelShort3')}</li>
            <li>${t('cancelShort4')}</li>
          </ul>
        </div>

        <h4>${t('cancelOnlineSub')}</h4>
        <ul class="list">
          <li>${t('cancelOnline')}</li>
        </ul>

        <h4>${t('cancelBehSub')}</h4>
        <ul class="list">
          <li>${t('cancelBeh1')}</li>
          <li>${t('cancelBeh2')}</li>
          <li>${t('cancelBeh3')}</li>
          <li>${t('cancelBeh4')}</li>
          <li>${t('cancelBeh5')}</li>
          <li>${t('cancelBeh6')}</li>
        </ul>

        <h4>${t('cancelTrajectSub')}</h4>
        <ul class="list">
          <li>${t('cancelTraject1')}</li>
          <li><strong>${t('cancelTraject2Label')}</strong> ${t('cancelTraject2')}</li>
          <li><strong>${t('cancelTraject3Label')}</strong> ${t('cancelTraject3')}</li>
          <li><strong>${t('cancelTraject4Label')}</strong> ${t('cancelTraject4')}</li>
        </ul>

        <h4>${t('cancelKlachtenSub')}</h4>
        <ul class="list">
          <li>${t('cancelKlachten1')}</li>
          <li>${t('cancelKlachten2')}</li>
        </ul>

        <div class="juridisch-bizcard">
          <div class="bc-title">${t('bizName')}</div>
          ${t('bizDetails')}<br>
          ${t('bizAddress')}<br>
          <a href="mailto:${t('bizEmail')}">${t('bizEmail')}</a> · ${t('bizPhone')}<br>
          <a href="https://instagram.com/lashedbychiva">${t('bizInstagram')}</a> · <a href="https://www.luxique.nl">${t('bizWebsite')}</a>
        </div>
      </section>

    </main>
  </div>
  `

  return (
    <div ref={containerRef} className="juridisch-root">
      <style>{css}</style>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}
