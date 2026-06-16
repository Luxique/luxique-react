'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

interface Consent {
  stats: boolean
  mkt: boolean
  ts: string
}

const STORAGE_KEY = 'ck-consent'

function getConsent(): Consent | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function saveConsent(stats: boolean, mkt: boolean) {
  const consent: Consent = { stats, mkt, ts: new Date().toISOString() }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(consent))
}

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showPill, setShowPill] = useState(false)
  const [stats, setStats] = useState(false)
  const [mkt, setMkt] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const hideOnAcademy = pathname?.startsWith('/academy') ?? false

  useEffect(() => {
    setMounted(true)
    const existing = getConsent()
    if (existing) {
      setStats(existing.stats)
      setMkt(existing.mkt)
      setShowPill(true)
    } else {
      setTimeout(() => setShowBanner(true), 800)
    }

    const openHandler = () => {
      setShowModal(true)
      setShowBanner(false)
    }
    window.addEventListener('open-cookie-prefs', openHandler)
    return () => window.removeEventListener('open-cookie-prefs', openHandler)
  }, [])

  function handleAccept() {
    setStats(true)
    setMkt(true)
    saveConsent(true, true)
    setShowBanner(false)
    setShowModal(false)
    setShowPill(true)
  }

  function handleReject() {
    setStats(false)
    setMkt(false)
    saveConsent(false, false)
    setShowBanner(false)
    setShowModal(false)
    setShowPill(true)
  }

  function handleSave() {
    saveConsent(stats, mkt)
    setShowModal(false)
    setShowPill(true)
  }

  if (!mounted) return null

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Jost:wght@300;400;500;600&display=swap');
        .ck-banner{position:fixed;left:24px;bottom:24px;z-index:60;width:min(440px,calc(100vw - 48px));background:radial-gradient(120% 130% at 0% 0%,rgba(176,141,79,.1),transparent 55%),#FBF8F2;border:1px solid rgba(28,24,20,.14);border-radius:18px;box-shadow:0 30px 70px -24px rgba(28,24,20,.4),0 0 0 1px rgba(176,141,79,.08);padding:24px 24px 20px;transform:translateY(140%);opacity:0;transition:transform .5s cubic-bezier(.16,1,.3,1),opacity .5s;font-family:'Jost',system-ui,sans-serif}
        .ck-banner.show{transform:translateY(0);opacity:1}
        .ck-eyebrow{font-weight:600;font-size:.68rem;letter-spacing:.2em;text-transform:uppercase;color:#B08D4F;margin-bottom:.5rem}
        .ck-banner h3{font-family:'Cormorant Garamond',Georgia,serif;font-weight:600;font-size:1.5rem;margin-bottom:.5rem;color:#1C1814}
        .ck-banner p{font-size:.92rem;color:#4A433B;margin-bottom:1.1rem;line-height:1.6}
        .ck-banner p a{color:#B08D4F;text-decoration:none;border-bottom:1px solid rgba(176,141,79,.4)}
        .ck-actions{display:flex;gap:.6rem;flex-wrap:wrap}
        .ck-btn{flex:1 1 auto;font-family:'Jost',sans-serif;font-weight:500;font-size:.9rem;letter-spacing:.02em;border-radius:11px;padding:.78em 1em;cursor:pointer;border:1px solid transparent;transition:transform .15s,background .2s,border-color .2s;white-space:nowrap}
        .ck-btn:active{transform:translateY(1px)}
        .ck-btn.accept{background:#B08D4F;color:#1C1611;order:3}
        .ck-btn.accept:hover{background:#C9A86A}
        .ck-btn.reject{background:#1A1611;color:#F6F1E7;order:1}
        .ck-btn.reject:hover{background:#241D14}
        .ck-btn.prefs{flex:0 0 auto;background:transparent;color:#4A433B;border-color:rgba(28,24,20,.14);order:2}
        .ck-btn.prefs:hover{background:#F4EFE4;color:#1C1814}
        .ck-btn.save{background:#1A1611;color:#F6F1E7}
        .ck-btn.save:hover{background:#241D14}
        .ck-overlay{position:fixed;inset:0;z-index:70;background:rgba(20,16,12,.5);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;padding:24px;opacity:0;pointer-events:none;transition:opacity .35s}
        .ck-overlay.show{opacity:1;pointer-events:auto}
        .ck-modal{width:min(560px,100%);max-height:90vh;overflow:auto;background:#FBF8F2;border:1px solid rgba(28,24,20,.14);border-radius:20px;box-shadow:0 40px 100px -30px rgba(28,24,20,.6);transform:translateY(16px) scale(.98);transition:transform .35s cubic-bezier(.16,1,.3,1)}
        .ck-overlay.show .ck-modal{transform:translateY(0) scale(1)}
        .ck-modal-head{padding:28px 30px 18px;border-bottom:1px solid rgba(28,24,20,.14)}
        .ck-modal-head h2{font-family:'Cormorant Garamond',Georgia,serif;font-weight:600;font-size:1.9rem;color:#1C1814;margin:0}
        .ck-modal-head p{font-size:.9rem;color:#4A433B;margin-top:.4rem}
        .ck-list{padding:8px 30px}
        .ck-row{display:flex;gap:18px;align-items:flex-start;padding:20px 0;border-bottom:1px solid rgba(28,24,20,.14)}
        .ck-row:last-child{border-bottom:none}
        .ck-row-txt{flex:1}
        .ck-row-txt .t{font-weight:600;font-size:1rem;color:#1C1814;display:flex;align-items:center;gap:.6rem;margin-bottom:.25rem}
        .ck-row-txt .tag{font-weight:500;font-size:.64rem;letter-spacing:.12em;text-transform:uppercase;color:#B08D4F;border:1px solid rgba(176,141,79,.4);border-radius:999px;padding:.25em .7em}
        .ck-row-txt .d{font-size:.86rem;color:#4A433B;line-height:1.5}
        .tog{position:relative;width:48px;height:28px;flex:0 0 auto;margin-top:2px}
        .tog input{opacity:0;width:0;height:0;position:absolute}
        .tog .track{position:absolute;inset:0;background:#D8CFBE;border-radius:999px;transition:background .25s;cursor:pointer}
        .tog .track::after{content:"";position:absolute;top:3px;left:3px;width:22px;height:22px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.25);transition:transform .25s}
        .tog input:checked+.track{background:#B08D4F}
        .tog input:checked+.track::after{transform:translateX(20px)}
        .tog input:disabled+.track{background:#1A1611;cursor:not-allowed;opacity:.85}
        .tog input:disabled+.track::after{transform:translateX(20px)}
        .ck-modal-foot{padding:20px 30px 26px;display:flex;gap:.6rem;flex-wrap:wrap;border-top:1px solid rgba(28,24,20,.14);background:#F4EFE4;border-radius:0 0 20px 20px}
        .ck-modal-foot .ck-btn{flex:1 1 auto}
        .ck-reopen{position:fixed;left:20px;bottom:20px;z-index:55;font-family:'Jost',sans-serif;font-weight:500;font-size:.78rem;letter-spacing:.03em;background:#FBF8F2;color:#4A433B;border:1px solid rgba(28,24,20,.14);border-radius:999px;padding:.6em 1.1em;cursor:pointer;display:none;align-items:center;gap:.5rem;box-shadow:0 10px 30px -14px rgba(28,24,20,.5)}
        .ck-reopen.show{display:inline-flex}
        .ck-reopen:hover{background:#F4EFE4;color:#1C1814}
        .ck-reopen .dot{width:7px;height:7px;border-radius:50%;background:#B08D4F}
        @media(max-width:480px){.ck-banner{left:12px;right:12px;bottom:12px;width:auto;padding:20px}.ck-actions{flex-direction:column}.ck-btn{flex:1 1 100%;order:0!important}}
      `}</style>

      {/* BANNER */}
      {showBanner && (
        <div className="ck-banner show" role="dialog" aria-live="polite" aria-label="Cookie-toestemming">
          <div className="ck-eyebrow">Jouw privacy</div>
          <h3>Even over cookies</h3>
          <p>We gebruiken noodzakelijke cookies om de site, je account en betalingen te laten werken. Met jouw toestemming meten we ook websitegebruik en tonen we relevante content. <a href="/voorwaarden#cookies">Lees onze cookieverklaring</a>.</p>
          <div className="ck-actions">
            <button className="ck-btn reject" onClick={handleReject}>Alles weigeren</button>
            <button className="ck-btn prefs" onClick={() => setShowModal(true)}>Voorkeuren</button>
            <button className="ck-btn accept" onClick={handleAccept}>Alles accepteren</button>
          </div>
        </div>
      )}

      {/* MODAL */}
      {showModal && (
        <div className="ck-overlay show" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="ck-modal" role="dialog" aria-modal="true" aria-label="Cookievoorkeuren">
            <div className="ck-modal-head">
              <h2>Cookievoorkeuren</h2>
              <p>Kies zelf welke cookies we mogen plaatsen. Je kunt dit altijd weer aanpassen.</p>
            </div>
            <div className="ck-list">
              <div className="ck-row">
                <div className="ck-row-txt">
                  <div className="t">Noodzakelijk <span className="tag">Altijd actief</span></div>
                  <div className="d">Nodig om de website, je account, boekingen (Cal.com) en betalingen (Stripe) te laten werken. Hiervoor is geen toestemming vereist.</div>
                </div>
                <label className="tog"><input type="checkbox" checked disabled readOnly /><span className="track"></span></label>
              </div>
              <div className="ck-row">
                <div className="ck-row-txt">
                  <div className="t">Statistieken</div>
                  <div className="d">Vercel Analytics meet geanonimiseerd hoe de site gebruikt wordt, zodat we &lsquo;m kunnen verbeteren.</div>
                </div>
                <label className="tog"><input type="checkbox" checked={stats} onChange={(e) => setStats(e.target.checked)} /><span className="track"></span></label>
              </div>
              <div className="ck-row">
                <div className="ck-row-txt">
                  <div className="t">Marketing</div>
                  <div className="d">Meta Pixel maakt advertenties relevanter en meet het effect ervan. Alleen geplaatst na jouw toestemming.</div>
                </div>
                <label className="tog"><input type="checkbox" checked={mkt} onChange={(e) => setMkt(e.target.checked)} /><span className="track"></span></label>
              </div>
            </div>
            <div className="ck-modal-foot">
              <button className="ck-btn reject" onClick={handleReject}>Alles weigeren</button>
              <button className="ck-btn save" onClick={handleSave}>Voorkeuren opslaan</button>
              <button className="ck-btn accept" onClick={handleAccept}>Alles accepteren</button>
            </div>
          </div>
        </div>
      )}

      {/* REOPEN PILL */}
      {showPill && !showBanner && !showModal && !hideOnAcademy && (
        <button className="ck-reopen show" onClick={() => setShowModal(true)}>
          <span className="dot"></span>Cookievoorkeuren
        </button>
      )}

      {/* Conditional scripts */}
      {mounted && getConsent()?.stats && (
        <script dangerouslySetInnerHTML={{ __html: `window.va = window.va || function(){(window.va.q=window.va.q||[]).push(arguments)}` }} />
      )}
      {mounted && getConsent()?.mkt && (
        <>
          <script dangerouslySetInnerHTML={{ __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','PIXEL_ID');fbq('track','PageView');` }} />
        </>
      )}
    </>
  )
}
