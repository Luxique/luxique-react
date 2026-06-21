'use client'

import { useEffect, useRef } from 'react'

export default function VoorwaardenPage() {
  const containerRef = useRef<HTMLDivElement>(null)

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
    links.forEach(a => { const t = a.dataset.target; if (t) map[t] = a })
    
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
    --fs-body:1.05rem;
  }
  *{box-sizing:border-box;margin:0;padding:0}
  html{scroll-behavior:smooth}
  body{background:var(--bg);color:var(--ink);font-family:var(--body);
    font-size:var(--fs-body);line-height:1.7;-webkit-font-smoothing:antialiased}

  /* top reading-progress bar */
  .progress{position:fixed;top:0;left:0;height:3px;width:0%;z-index:50;
    background:linear-gradient(90deg,var(--gold-soft),var(--gold));
    box-shadow:0 0 12px -2px var(--gold-glow);transition:width .1s linear}

  /* hero */
  .hero{position:relative;overflow:hidden;
    background:
      radial-gradient(120% 90% at 50% -20%, rgba(176,141,79,.10), transparent 60%),
      var(--bg);
    border-bottom:1px solid var(--line);
    padding:clamp(64px,9vw,120px) clamp(24px,5vw,64px) clamp(40px,5vw,64px);
    text-align:center}
  .hero .eyebrow{display:inline-block;font-family:var(--body);font-weight:500;
    font-size:.76rem;letter-spacing:.24em;text-transform:uppercase;color:var(--ink);
    border:1px solid var(--line);border-radius:999px;padding:.5em 1.3em;margin-bottom:1.6rem}
  .hero h1{font-family:var(--display);font-weight:500;
    font-size:clamp(2.8rem,6vw,4.6rem);line-height:1.02;letter-spacing:-.01em}
  .hero h1 em{font-style:italic;color:var(--gold)}
  .hero p{margin:1.2rem auto 0;max-width:560px;color:var(--ink-soft);font-size:1.1rem}
  .hero .updated{margin-top:1.4rem;font-size:.8rem;letter-spacing:.1em;
    text-transform:uppercase;color:var(--ink-faint)}

  /* layout */
  .wrap{max-width:1180px;margin-inline:auto;
    padding:clamp(40px,6vw,80px) clamp(24px,5vw,64px) clamp(80px,10vw,140px);
    display:grid;grid-template-columns:264px 1fr;gap:clamp(32px,5vw,72px);
    align-items:start}

  /* sticky index */
  .index{position:sticky;top:40px;align-self:start}
  .index-label{font-family:var(--body);font-weight:600;font-size:.72rem;
    letter-spacing:.2em;text-transform:uppercase;color:var(--ink-faint);
    margin-bottom:1.1rem;padding-left:2px}
  .index a{display:flex;align-items:baseline;gap:.7rem;text-decoration:none;
    color:var(--ink-soft);padding:.7rem .85rem;border-radius:12px;
    transition:background .2s,color .2s;position:relative;margin-bottom:.15rem}
  .index a .num{font-family:var(--display);font-style:italic;font-size:1.05rem;
    color:var(--gold);min-width:1.3em;transition:color .2s}
  .index a .txt{font-family:var(--body);font-weight:500;font-size:.95rem;line-height:1.3}
  .index a:hover{background:var(--bg-soft);color:var(--ink)}
  .index a.active{background:var(--card-dark);color:#F6F1E7}
  .index a.active .num{color:var(--gold-bright)}
  .index a.active .txt{color:#F6F1E7}

  .index-foot{margin-top:1.6rem;padding-top:1.4rem;border-top:1px solid var(--line);
    font-size:.82rem;color:var(--ink-faint);line-height:1.6;padding-left:2px}
  .index-foot a{color:var(--gold);text-decoration:none}
  .index-foot a:hover{text-decoration:underline}

  /* content */
  .content{min-width:0}
  .doc{scroll-margin-top:32px;margin-bottom:clamp(56px,7vw,96px)}
  .doc:last-child{margin-bottom:0}
  .doc-head{display:flex;align-items:baseline;gap:1rem;margin-bottom:.4rem}
  .doc-head .dnum{font-family:var(--display);font-style:italic;font-weight:500;
    font-size:clamp(1.6rem,3vw,2.1rem);color:var(--gold)}
  .doc-head h2{font-family:var(--display);font-weight:500;
    font-size:clamp(2rem,4vw,3rem);line-height:1.05;letter-spacing:-.01em}
  .doc-meta{font-size:.82rem;color:var(--ink-faint);letter-spacing:.04em;
    margin-bottom:1.6rem}

  /* "in het kort" summary card */
  .tldr{background:
      radial-gradient(120% 130% at 0% 0%, rgba(176,141,79,.12), transparent 55%),
      var(--panel);
    border:1px solid var(--line);border-radius:16px;
    padding:clamp(20px,2.6vw,30px);margin-bottom:2.2rem;
    box-shadow:0 14px 40px -28px var(--gold-glow)}
  .tldr h3{font-family:var(--body);font-weight:600;font-size:.74rem;
    letter-spacing:.2em;text-transform:uppercase;color:var(--gold);margin-bottom:.9rem}
  .tldr ul{list-style:none;display:flex;flex-direction:column;gap:.55rem}
  .tldr li{position:relative;padding-left:1.5rem;font-size:.98rem;color:var(--ink-soft)}
  .tldr li::before{content:"";position:absolute;left:0;top:.62em;width:7px;height:7px;
    border-radius:50%;background:var(--gold);box-shadow:0 0 0 3px rgba(176,141,79,.18)}

  .doc h4{font-family:var(--display);font-weight:600;font-size:1.35rem;
    margin:1.9rem 0 .5rem;color:var(--ink);scroll-margin-top:32px}
  .doc h4:first-of-type{margin-top:.6rem}
  .doc p{margin-bottom:.9rem;color:var(--ink-soft)}
  .doc p strong, .doc li strong{color:var(--ink);font-weight:600}
  .doc ul.list{list-style:none;margin:.4rem 0 1.1rem;display:flex;
    flex-direction:column;gap:.5rem}
  .doc ul.list li{position:relative;padding-left:1.4rem;color:var(--ink-soft)}
  .doc ul.list li::before{content:"";position:absolute;left:.1rem;top:.66em;
    width:6px;height:6px;border-radius:50%;background:var(--gold-soft)}
  .art{margin-bottom:1.3rem;scroll-margin-top:32px}
  .art .art-h{font-family:var(--body);font-weight:600;font-size:1.02rem;
    color:var(--ink);margin-bottom:.3rem;letter-spacing:.01em}
  .art p{margin-bottom:.5rem}
  .sub{font-family:var(--body);font-weight:600;font-size:.78rem;letter-spacing:.14em;
    text-transform:uppercase;color:var(--gold);margin:1.4rem 0 .7rem}
  a.inline{color:var(--gold);text-decoration:none;border-bottom:1px solid rgba(176,141,79,.4)}
  a.inline:hover{border-bottom-color:var(--gold)}

  .divider{height:1px;background:var(--line);margin:clamp(40px,5vw,64px) 0}

  /* business footer block */
  .bizcard{background:linear-gradient(165deg,var(--card-dark-2),var(--card-dark));
    border:1px solid rgba(176,141,79,.3);border-radius:18px;
    padding:clamp(24px,3vw,38px);color:rgba(246,241,231,.8);
    margin-top:clamp(40px,5vw,64px);font-size:.92rem;line-height:1.9}
  .bizcard .bc-title{font-family:var(--display);font-style:italic;font-size:1.5rem;
    color:var(--gold-bright);margin-bottom:.6rem}
  .bizcard a{color:var(--gold-soft);text-decoration:none}
  .bizcard a:hover{text-decoration:underline}

  /* mobile */
  @media (max-width:880px){
    .wrap{grid-template-columns:1fr;gap:0}
    .index{position:static;margin-bottom:36px;
      background:var(--panel);border:1px solid var(--line);border-radius:16px;
      padding:18px}
    .index-foot{display:none}
  }

  @media (prefers-reduced-motion:reduce){
    html{scroll-behavior:auto}
    .progress{transition:none}
  }`
  const html = `

  <div class="progress" id="progress"></div>

  <header class="hero">
    <span class="eyebrow">Goed om te weten</span>
    <h1>Voorwaarden &amp; <em>beleid</em></h1>
    <p>Transparant en in gewone taal. Alles wat je wilt weten over boeken, betalen, annuleren en je privacy — op één plek.</p>
    <div class="updated">Laatst bijgewerkt: 15 juni 2026</div>
  </header>

  <div class="wrap">

    <!-- STICKY INDEX -->
    <nav class="index" id="index">
      <div class="index-label">Inhoud</div>
      <a href="#voorwaarden" data-target="voorwaarden"><span class="num">01</span><span class="txt">Algemene voorwaarden</span></a>
      <a href="#privacy" data-target="privacy"><span class="num">02</span><span class="txt">Privacyverklaring</span></a>
      <a href="#cookies" data-target="cookies"><span class="num">03</span><span class="txt">Cookieverklaring</span></a>
      <a href="#annulering" data-target="annulering"><span class="num">04</span><span class="txt">Annulerings­beleid</span></a>
      <div class="index-foot">
        Vragen? Mail <a href="mailto:info@luxique.nl">info@luxique.nl</a><br>of stuur een DM <a href="https://instagram.com/lashedbychiva">@lashedbychiva</a>.
      </div>
    </nav>

    <!-- CONTENT -->
    <main class="content">

      <!-- ===================== 1. ALGEMENE VOORWAARDEN ===================== -->
      <section class="doc" id="voorwaarden">
        <div class="doc-head"><span class="dnum">01</span><h2>Algemene voorwaarden</h2></div>
        <div class="doc-meta">LUXIQUE · KvK 94764158</div>

        <div class="tldr">
          <h3>In het kort</h3>
          <ul>
            <li>Door te betalen of te boeken ga je akkoord met deze voorwaarden.</li>
            <li>Behandelingen: 50% aanbetaling bij boeken, de rest na de behandeling in de studio.</li>
            <li>Kosteloos annuleren tot 24 uur vóór aanvang van de afspraak — daarna vervalt de aanbetaling.</li>
            <li>Online cursussen worden niet gerestitueerd; je krijgt direct toegang.</li>
            <li>Minimumleeftijd is 15 jaar.</li>
          </ul>
        </div>

        <p>Door het voldoen van een (aan)betaling of het afronden van een bestelling ga je automatisch akkoord met deze algemene voorwaarden. Lees ze zorgvuldig voordat je boekt of koopt.</p>

        <div class="art" id="art-1-definities"><div class="art-h">Artikel 1 — Definities</div>
          <ul class="list">
            <li><strong>LUXIQUE / wij:</strong> de eenmanszaak (KvK 94764158), geëxploiteerd onder de naam LUXIQUE.</li>
            <li><strong>Klant:</strong> iedere natuurlijke persoon die een behandeling, cursus, traject of ander aanbod afneemt.</li>
            <li><strong>Behandeling:</strong> een lashbehandeling (nieuwe set, refill/opvulling) op afspraak in de studio.</li>
            <li><strong>Online cursus:</strong> een digitaal cursusproduct dat na betaling direct online toegankelijk is.</li>
            <li><strong>Persoonlijk traject / workshop:</strong> begeleiding of les op locatie op een vooraf vastgelegde datum.</li>
          </ul>
        </div>

        <div class="art" id="art-2-toepasselijkheid"><div class="art-h">Artikel 2 — Toepasselijkheid</div>
          <p>2.1 Deze voorwaarden zijn van toepassing op alle aanbiedingen, boekingen, behandelingen, cursussen en overeenkomsten van LUXIQUE.</p>
          <p>2.2 Afwijkingen gelden alleen indien schriftelijk overeengekomen.</p>
          <p>2.3 Door te boeken, te betalen of een online cursus aan te schaffen, verklaart de klant deze voorwaarden te hebben gelezen en aanvaard.</p>
        </div>

        <div class="art" id="art-3-leeftijd"><div class="art-h">Artikel 3 — Minimumleeftijd</div>
          <p>3.1 De minimumleeftijd voor behandelingen en deelname aan cursussen is 15 jaar.</p>
          <p>3.2 Door te boeken verklaart een klant onder de 18 jaar dat een ouder of wettelijk vertegenwoordiger kennis heeft genomen van deze voorwaarden en toestemming heeft gegeven voor de boeking en de behandeling. LUXIQUE mag om een bevestiging van deze toestemming vragen en de behandeling opschorten totdat die is verkregen.</p>
        </div>

        <div class="art" id="art-4-betaling"><div class="art-h">Artikel 4 — Prijzen en betaling</div>
          <p>4.1 De geldende prijzen staan vermeld op de website. LUXIQUE berekent btw; vermelde prijzen zijn inclusief btw.</p>
          <p>4.2 <strong>Behandelingen:</strong> een aanbetaling van 50% van de behandelprijs is verplicht op het moment van boeken. De reservering is pas definitief nadat de aanbetaling is ontvangen. Het resterende bedrag (de overige 50%) voldoe je op de dag van de geplande afspraak, in de studio, direct na afloop van de behandeling, per pin.</p>
          <p>4.3 <strong>Persoonlijke trajecten / workshops:</strong> een aanbetaling van 50% van de totaalprijs is verplicht op het moment van boeken. Het resterende bedrag voldoe je uiterlijk vóór aanvang van de eerste lesdag.</p>
          <p>4.4 <strong>Online cursussen:</strong> je betaalt het volledige bedrag in één keer bij aankoop. Direct na betaling krijg je toegang tot de cursus.</p>
          <p>4.5 Online betalingen verlopen via onze betaalprovider Stripe (o.a. iDEAL, creditcard, Apple Pay, Klarna) en/of via het boekingssysteem Cal.com. Betalingen in de studio kunnen daarnaast per pin worden voldaan. Contant geld wordt niet geaccepteerd.</p>
        </div>

        <div class="art" id="art-5-herroeping"><div class="art-h">Artikel 5 — Herroepingsrecht (uitsluiting)</div>
          <p>5.1 Behandelingen, persoonlijke trajecten en workshops vinden plaats op een specifieke, vooraf vastgelegde datum. Hierdoor is het wettelijke herroepingsrecht voor consumenten niet van toepassing, conform artikel 6:230p sub b BW. De klant erkent bij het boeken dat de dienst wordt uitgevoerd op een vaste datum of binnen een vastgestelde periode.</p>
          <p>5.2 Online cursussen betreffen digitale inhoud die direct na aankoop volledig toegankelijk is. Conform artikel 6:230p sub g BW doet de klant bij aankoop uitdrukkelijk afstand van het herroepingsrecht en erkent daarmee dat het recht op ontbinding vervalt zodra de toegang is verleend.</p>
          <p>5.3 Betaling geldt als bevestiging van afstand van het herroepingsrecht. De boeking of aankoop is na bevestiging bindend.</p>
        </div>

        <div class="art" id="art-6-annuleren"><div class="art-h">Artikel 6 — Annuleren en verplaatsen</div>
          <div class="sub">Behandelingen</div>
          <p>6.1 Tot uiterlijk 24 uur vóór de aanvang (starttijd) van de afspraak kun je kosteloos annuleren of verplaatsen. De aanbetaling wordt in dat geval binnen 14 dagen terugbetaald, of — bij verplaatsen — verrekend met de nieuwe afspraak. Bepalend is het moment waarop je annulering of verzoek tot verplaatsen ons aantoonbaar bereikt via het klantportaal, per e-mail (info@luxique.nl) of via Instagram (@lashedbychiva).</p>
          <p>6.2 Bij annuleren, verplaatsen of niet verschijnen binnen 24 uur vóór de aanvang van de afspraak vervalt de aanbetaling en bestaat geen recht op terugbetaling of verrekening. De aanbetaling strekt in dat geval ter vergoeding van de exclusief voor jou gereserveerde tijd en de reeds verrichte voorbereiding. Dit geldt ook wanneer de verhindering buiten jouw schuld ontstaat, zoals — maar niet beperkt tot — autopech, vertraging of uitval van openbaar vervoer, het ontbreken van vervoer, of een ziek familielid.</p>
          <p>6.3 Kom je meer dan 20 minuten na de afgesproken starttijd, dan kan de behandeling niet meer volledig worden uitgevoerd, vervalt de afspraak en vervalt de aanbetaling. LUXIQUE mag de behandeling in dat geval naar eigen inzicht alsnog verkort uitvoeren binnen de resterende tijd; dit is geen recht van de klant en geeft geen recht op (gedeeltelijke) terugbetaling.</p>
          <div class="sub">Persoonlijke trajecten / workshops / cursussen op locatie</div>
          <p>6.4 <strong>Annuleren tot 7 dagen vóór start:</strong> je krijgt het betaalde bedrag terug, min € 130 voor reeds ingekochte materialen. Je annulering moet ons uiterlijk 7 dagen vóór de startdatum bereiken via info@luxique.nl.</p>
          <p>6.5 <strong>Tussen 7 en 3 dagen vóór start:</strong> je kunt de cursus eenmalig kosteloos verplaatsen naar andere data. Terugbetaling is niet meer mogelijk.</p>
          <p>6.6 <strong>Binnen 3 dagen vóór start of na aanvang:</strong> geen restitutie en geen verplaatsing meer mogelijk. De cursusdagen zijn exclusief voor jou gereserveerd.</p>
          
          <div class="sub">Online cursussen</div>
          <p>6.8 Online cursussen worden niet gerestitueerd. Je krijgt direct na betaling volledige toegang tot de digitale lesstof (zie artikel 5.2).</p>
        </div>

        <div class="art" id="art-7-ziekte"><div class="art-h">Artikel 7 — Ziekte</div>
          <p>7.1 Bij ziekte van de klant binnen 24 uur vóór de aanvang van een behandeling vervalt de aanbetaling, conform artikel 6.2. Tot uiterlijk 24 uur vóór aanvang kun je de afspraak desgewenst kosteloos verplaatsen (zie artikel 6.1).</p>
          <p>7.2 Bij ziekte tijdens een meerdaags traject of cursus blijven de geplande dagen gereserveerd; er bestaat geen recht op restitutie of verplaatsing. Een cursus van bijvoorbeeld drie dagen kan niet op de laatste dag worden onderbroken met aanspraak op een nieuwe afspraak. Ziekte valt onder het eigen risico van de klant.</p>
        </div>

        <div class="art" id="art-8-garantie"><div class="art-h">Artikel 8 — Resultaat, retentie en garantie</div>
          <p>8.1 De klant krijgt direct na de behandeling de gelegenheid het resultaat in de spiegel te beoordelen. Eventuele opmerkingen over het resultaat dienen op dat moment, direct na het zetten van de wimpers, te worden gemeld. Achteraf melden dat het resultaat niet bevalt, geeft geen recht op herstel, restitutie of compensatie.</p>
          <p>8.2 Vallen binnen 3 dagen (72 uur) na de behandeling meer dan 20% van de geplaatste wimpers uit, dan kun je aanspraak maken op éénmalig een kosteloze correctie, mits je: (a) dit binnen die 72 uur meldt via info@luxique.nl; (b) in die periode geen sauna, stoomruimte of zonnebank hebt bezocht; (c) niet intensief hebt gesport; en (d) niet in zout zee- of chloorwater hebt gezwommen. De correctie wordt in overleg ingepland, afhankelijk van de beschikbaarheid.</p>
          <p>8.3 Buiten het in 8.2 genoemde geval wordt op natuurlijke uitval van wimpers geen garantie gegeven; uitval is een normaal en natuurlijk proces.</p>
        </div>

        <div class="art" id="art-9-aansprakelijkheid"><div class="art-h">Artikel 9 — Allergische reacties en aansprakelijkheid</div>
          <p>9.1 De klant is verplicht bekende allergieën, overgevoeligheden en oog- of huidaandoeningen vóór de behandeling te melden. LUXIQUE is niet aansprakelijk voor allergische reacties, huidirritaties of oogklachten die na een behandeling ontstaan, behoudens opzet of bewuste roekeloosheid aan de zijde van LUXIQUE.</p>
          <p>9.2 Bij een allergische reactie bestaat geen recht op terugbetaling. Indien er ruimte is in de planning, kan kosteloos een verwijdering van de wimpers worden aangevraagd.</p>
          <p>9.3 LUXIQUE is voorts niet aansprakelijk voor indirecte schade, gevolgschade of gederfde inkomsten, noch voor schade door onjuiste of onvolledige informatie verstrekt door de klant.</p>
          <p>9.4 De aansprakelijkheid van LUXIQUE is, behoudens opzet of bewuste roekeloosheid en behoudens dwingendrechtelijke bepalingen, te allen tijde beperkt tot het factuurbedrag van de betreffende dienst.</p>
        </div>

        <div class="art" id="art-10-cursist"><div class="art-h">Artikel 10 — Eigen verantwoordelijkheid cursist</div>
          <p>10.1 De cursist is zelf verantwoordelijk voor voldoende zicht (het kunnen zien van fijne haartjes), fysieke belastbaarheid (rug, houding, concentratie gedurende de lesdag) en geschiktheid voor het vak.</p>
          <p>10.2 Blijkt achteraf dat dit niet toereikend is, dan bestaat geen recht op restitutie.</p>
          <p>10.3 De cursist kan vooraf een proefsessie boeken (ca. 1 uur, € 30) om zicht en vaardigheid te testen. Maakt de cursist hiervan geen gebruik, dan is deelname volledig op eigen risico en bestaat achteraf geen recht op compensatie.</p>
        </div>

        <div class="art" id="art-11-modellen"><div class="art-h">Artikel 11 — Modellen</div>
          <p>11.1 De cursist regelt zelf de modellen voor de praktijklessen en wordt vooraf geïnformeerd over de vereisten.</p>
          <p>11.2 Het ontbreken van een model komt volledig voor rekening en risico van de cursist; zonder model is er die dag geen praktijkoefening.</p>
          <p>11.3 Onvoldoende oefening kan leiden tot het niet behalen van het certificaat. Het ontbreken van een model geeft geen recht op restitutie.</p>
        </div>

        <div class="art" id="art-12-certificering"><div class="art-h">Artikel 12 — Certificering en kwaliteit</div>
          <p>12.1 Bij online cursussen ontvang je na afronding een certificaat van deelname. Dit bevestigt dat je de theorie en lesstof hebt doorlopen; het is geen garantie dat de technieken op professioneel niveau worden beheerst.</p>
          <p>12.2 Bij trajecten op locatie wordt een certificaat uitsluitend verstrekt wanneer de techniek voldoende wordt beheerst en de kwaliteit aan de gestelde standaard voldoet.</p>
          <p>12.3 Bij onvoldoende resultaat wordt geen certificaat verstrekt; de cursist behoudt wel volledige toegang tot de kennis en materialen. Extra lesdagen of een examendag kunnen tegen betaling worden bijgeboekt.</p>
        </div>

        <div class="art" id="art-13-telaat"><div class="art-h">Artikel 13 — Te laat komen en aanwezigheid</div>
          <p>13.1 Bij behandelingen vervalt de afspraak na 20 minuten te laat komen en is de aanbetaling verschuldigd/verloren (zie artikel 6.3).</p>
          <p>13.2 Bij cursussen gaat te laat komen van de eigen lestijd af; verlenging is niet mogelijk.</p>
        </div>

        <div class="art" id="art-14-klachten"><div class="art-h">Artikel 14 — Klachten</div>
          <p>14.1 Klachten over een behandeling dienen binnen 72 uur na de afspraak schriftelijk te worden ingediend via <a class="inline" href="mailto:info@luxique.nl">info@luxique.nl</a> of via Instagram (@lashedbychiva). Na 72 uur vervalt de mogelijkheid tot het indienen van een klacht.</p>
          <p>14.2 Klachten over een cursusdag dienen binnen 7 dagen schriftelijk te worden ingediend.</p>
          <p>14.3 Een klacht kan niet in behandeling worden genomen indien deze betrekking heeft op:</p>
          <ul class="list">
            <li>ontevredenheid over het resultaat die niet direct na de behandeling, tijdens het spiegelmoment, is gemeld (zie artikel 8.1);</li>
            <li>de stelling dat een cursus "het geld niet waard" was;</li>
            <li>het niet kunnen afronden van een meerdaags traject door ziekte (zie artikel 7.2).</li>
          </ul>
          <p>14.4 LUXIQUE streeft ernaar gegronde klachten binnen 5 werkdagen te behandelen en in overleg een passende oplossing te bieden. Het indienen van een klacht laat de wettelijke rechten van de klant onverlet.</p>
        </div>

        <div class="art" id="art-15-privacy"><div class="art-h">Artikel 15 — Privacy</div>
          <p>15.1 LUXIQUE verwerkt persoonsgegevens conform de AVG en uitsluitend voor de uitvoering van de overeenkomst, de administratie en — met toestemming — marketing. Zie de <a class="inline" href="#privacy">privacyverklaring</a>.</p>
        </div>

        <div class="art" id="art-16-recht"><div class="art-h">Artikel 16 — Toepasselijk recht</div>
          <p>16.1 Op deze voorwaarden is uitsluitend Nederlands recht van toepassing.</p>
          <p>16.2 Geschillen worden voorgelegd aan de bevoegde rechter in het arrondissement van de vestigingsplaats van LUXIQUE, tenzij de wet dwingend een andere rechter aanwijst.</p>
          <p>16.3 Is een bepaling van deze voorwaarden nietig of vernietigbaar, dan blijven de overige bepalingen volledig van kracht. De betreffende bepaling wordt vervangen door een geldige bepaling die het doel en de strekking ervan zoveel mogelijk benadert.</p>
          <p>16.4 LUXIQUE mag deze voorwaarden wijzigen. Op een boeking of aankoop zijn steeds de voorwaarden van toepassing zoals die golden op het moment van boeken of kopen.</p>
        </div>
      </section>

      <div class="divider"></div>

      <!-- ===================== 2. PRIVACY ===================== -->
      <section class="doc" id="privacy">
        <div class="doc-head"><span class="dnum">02</span><h2>Privacyverklaring</h2></div>
        <div class="doc-meta">Conform de Algemene Verordening Gegevensbescherming (AVG)</div>

        <div class="tldr">
          <h3>In het kort</h3>
          <ul>
            <li>We verwerken alleen wat nodig is om je boeking en behandeling uit te voeren.</li>
            <li>Betaalgegevens lopen via Stripe — wij slaan zelf geen kaartgegevens op.</li>
            <li>We verkopen je gegevens nooit aan derden.</li>
            <li>Je mag je gegevens altijd inzien, corrigeren of laten verwijderen.</li>
          </ul>
        </div>

        <p>LUXIQUE (hierna: "wij") respecteert je privacy en verwerkt persoonsgegevens in overeenstemming met de AVG. In deze verklaring lees je welke gegevens we verwerken, waarom en hoe lang.</p>

        <h4 id="privacy-verantwoordelijke">1. Verwerkingsverantwoordelijke</h4>
        <p>LUXIQUE, Venlosingel 166, 6845 JD Arnhem. Contactpersoon voor privacy: Chiva Daams, bereikbaar via <a class="inline" href="mailto:info@luxique.nl">info@luxique.nl</a>.</p>

        <h4 id="privacy-gegevens">2. Welke gegevens we verwerken</h4>
        <p>Afhankelijk van de dienst verwerken wij:</p>
        <ul class="list">
          <li>naam;</li>
          <li>e-mailadres;</li>
          <li>telefoonnummer;</li>
          <li>adres / woonplaats;</li>
          <li>betaalgegevens (verwerkt via Stripe; wij slaan zelf geen kaartgegevens op);</li>
          <li>foto's (bijvoorbeeld before/after of ter beoordeling van een oogvorm — uitsluitend met jouw toestemming);</li>
          <li>gegevens over je websitegebruik (via cookies en statistieken — zie de <a class="inline" href="#cookies">cookieverklaring</a>).</li>
        </ul>

        <h4 id="privacy-doel">3. Waarom we deze gegevens verwerken</h4>
        <ul class="list">
          <li>om je boeking, behandeling of cursus uit te voeren;</li>
          <li>voor onze administratie en facturatie;</li>
          <li>om met je te communiceren over je afspraak of cursus;</li>
          <li>met jouw toestemming: voor het versturen van een nieuwsbrief of aanbiedingen;</li>
          <li>om onze website en dienstverlening te verbeteren.</li>
        </ul>

        <h4 id="privacy-grondslag">4. Grondslagen</h4>
        <p>Wij verwerken gegevens op basis van: de uitvoering van de overeenkomst, een wettelijke verplichting (zoals de fiscale bewaarplicht), jouw toestemming (marketing, foto's) en/of ons gerechtvaardigd belang.</p>

        <h4 id="privacy-marketing">5. Marketing</h4>
        <p>Met jouw toestemming gebruiken wij je e-mailadres voor een nieuwsbrief of aanbiedingen. Je kunt je hiervoor op elk moment afmelden via de afmeldlink in elke e-mail of door een bericht aan <a class="inline" href="mailto:info@luxique.nl">info@luxique.nl</a>.</p>

        <h4 id="privacy-bewaartermijn">6. Bewaartermijn</h4>
        <p>Wij bewaren persoonsgegevens niet langer dan nodig. In de regel bewaren wij klantgegevens tot 2 jaar na het laatste contact. Voor facturen en financiële administratie geldt de wettelijke fiscale bewaarplicht van 7 jaar; voor die gegevens gaat de termijn van 7 jaar vóór de termijn van 2 jaar.</p>

        <h4 id="privacy-derden">7. Delen met derden (verwerkers)</h4>
        <p>Wij delen gegevens uitsluitend met partijen die nodig zijn voor onze dienstverlening, op basis van verwerkersovereenkomsten:</p>
        <ul class="list">
          <li><strong>Stripe</strong> — betalingsverwerking;</li>
          <li><strong>Cal.com</strong> — afsprakenplanning en boekingen;</li>
          <li><strong>Supabase</strong> — accounts en gegevensopslag;</li>
          <li><strong>Mux</strong> — videohosting voor de cursussen;</li>
          <li><strong>Vercel</strong> — hosting van de website;</li>
          <li><strong>Anthropic</strong> — de AI-chatbot op de website;</li>
          <li><strong>mijndomein</strong> — domein en e-mail.</li>
        </ul>
        <p>Wij verkopen je gegevens nooit aan derden.</p>

        <h4 id="privacy-cookies">8. Cookies en statistieken</h4>
        <p>Onze website gebruikt cookies en Vercel Analytics om het gebruik te meten, en mogelijk een Meta Pixel voor advertenties. Zie de <a class="inline" href="#cookies">cookieverklaring</a>.</p>

        <h4 id="privacy-rechten">9. Jouw rechten</h4>
        <p>Je hebt het recht je gegevens in te zien, te corrigeren, te laten verwijderen, de verwerking te beperken, bezwaar te maken en je gegevens over te dragen. Stuur hiervoor een verzoek aan <a class="inline" href="mailto:info@luxique.nl">info@luxique.nl</a>. Je hebt ook het recht een klacht in te dienen bij de Autoriteit Persoonsgegevens.</p>

        <h4 id="privacy-beveiliging">10. Beveiliging</h4>
        <p>Wij nemen passende technische en organisatorische maatregelen om je gegevens te beschermen.</p>
      </section>

      <div class="divider"></div>

      <!-- ===================== 3. COOKIES ===================== -->
      <section class="doc" id="cookies">
        <div class="doc-head"><span class="dnum">03</span><h2>Cookieverklaring</h2></div>
        <div class="doc-meta">www.luxique.nl</div>

        <div class="tldr">
          <h3>In het kort</h3>
          <ul>
            <li>Noodzakelijke cookies houden de site, je account en betalingen werkend.</li>
            <li>Statistiek- en marketingcookies plaatsen we alleen met jouw toestemming.</li>
            <li>Je kunt je voorkeuren altijd aanpassen of intrekken.</li>
          </ul>
        </div>

        <p>Onze website gebruikt cookies en vergelijkbare technieken. In deze verklaring lees je welke en waarvoor.</p>

        <h4 id="cookies-wat">1. Wat zijn cookies</h4>
        <p>Cookies zijn kleine tekstbestanden die bij een bezoek aan de website op je apparaat worden geplaatst.</p>

        <h4 id="cookies-welke">2. Welke cookies wij gebruiken</h4>
        <ul class="list">
          <li><strong>Functionele en noodzakelijke cookies</strong> — nodig om de website, je account, betalingen (Stripe) en boekingen (Cal.com) te laten werken. Hiervoor is geen toestemming vereist.</li>
          <li><strong>Statistische cookies (Vercel Analytics)</strong> — om geanonimiseerd websitegebruik te meten en de site te verbeteren.</li>
          <li><strong>Marketingcookies (Meta Pixel)</strong> — om advertenties relevanter te maken en het effect ervan te meten. Deze worden alleen geplaatst na jouw toestemming.</li>
        </ul>

        <h4 id="cookies-toestemming">3. Toestemming</h4>
        <p>Bij je eerste bezoek vragen wij via een cookiebanner toestemming voor statistische en marketingcookies. Je kunt je voorkeuren op elk moment aanpassen of intrekken via de cookie-instellingen op de website.</p>

        <h4 id="cookies-beheren">4. Cookies beheren</h4>
        <p>Je kunt cookies ook beheren of verwijderen via de instellingen van je browser.</p>

        <h4 id="cookies-contact">5. Contact</h4>
        <p>Vragen over cookies? Mail naar <a class="inline" href="mailto:info@luxique.nl">info@luxique.nl</a>.</p>
      </section>

      <div class="divider"></div>

      <!-- ===================== 4. ANNULERINGSBELEID ===================== -->
      <section class="doc" id="annulering">
        <div class="doc-head"><span class="dnum">04</span><h2>Annuleringsbeleid</h2></div>
        <div class="doc-meta">Een leesbare samenvatting van artikel 5 t/m 9 · Bij tegenstrijdigheid gelden de Algemene Voorwaarden</div>

        <div class="tldr">
          <h3>In het kort</h3>
          <ul>
            <li>Behandelingen: kosteloos annuleren tot 24 uur vóór aanvang, daarna vervalt de aanbetaling.</li>
            <li>Meer dan 20 minuten na de starttijd te laat → de afspraak en de aanbetaling vervallen.</li>
            <li>Online cursussen worden niet gerestitueerd.</li>
            <li>Trajecten: tot 7 dagen vóór start → terugbetaling minus € 130 materiaalkosten. Tot 3 dagen → eenmalig verplaatsen. Binnen 3 dagen → geen restitutie.</li>
          </ul>
        </div>

        <h4 id="annulering-cursussen">Online cursussen</h4>
        <ul class="list">
          <li>Geen restitutie. Je krijgt direct na betaling volledige toegang tot de digitale lesstof en doet daarmee afstand van het herroepingsrecht.</li>
        </ul>

        <h4 id="annulering-behandelingen">Behandelingen</h4>
        <ul class="list">
          <li>Aanbetaling van 50% bij het boeken; het resterende bedrag betaal je op de dag van de afspraak, in de studio, direct na de behandeling (per pin).</li>
          <li>Kosteloos annuleren of verplaatsen tot uiterlijk 24 uur vóór de aanvang van de afspraak — aanbetaling terug of verrekend.</li>
          <li>Binnen 24 uur vóór aanvang annuleren of niet verschijnen → de aanbetaling vervalt.</li>
          <li>Meer dan 20 minuten na de starttijd te laat → de afspraak vervalt en de aanbetaling vervalt.</li>
          <li>Uitval van meer dan 20% van de wimpers binnen 3 dagen → eenmalige kosteloze correctie, mits tijdig gemeld en geen sauna, intensief sporten of zout-/chloorwater.</li>
          <li>Allergische reactie → geen terugbetaling; kosteloze verwijdering mogelijk als de planning het toelaat.</li>
        </ul>

        <h4 id="annulering-trajecten">Persoonlijke trajecten / workshops</h4>
        <ul class="list">
          <li>Aanbetaling van 50% bij het boeken; het resterende bedrag uiterlijk vóór de eerste lesdag.</li>
          <li><strong>Tot 7 dagen vóór start:</strong> volledige terugbetaling minus € 130 materiaalkosten.</li>
          <li><strong>7 tot 3 dagen vóór start:</strong> eenmalig kosteloos verplaatsen naar andere data (geen terugbetaling).</li>
          <li><strong>Binnen 3 dagen vóór start of na aanvang:</strong> geen restitutie, geen verplaatsing.</li>
        </ul>

        <h4 id="annulering-klachten">Klachten</h4>
        <ul class="list">
          <li>Behandelingen: binnen 72 uur via <a class="inline" href="mailto:info@luxique.nl">info@luxique.nl</a> of @lashedbychiva.</li>
          <li>Cursusdagen: binnen 7 dagen.</li>
        </ul>

        <div class="bizcard">
          <div class="bc-title">LUXIQUE</div>
          Eenmanszaak · KvK 94764158 · Btw-id NL004358432B15<br>
          Venlosingel 166, 6845 JD Arnhem<br>
          <a href="mailto:info@luxique.nl">info@luxique.nl</a> · +31 6 57729588<br>
          <a href="https://instagram.com/lashedbychiva">@lashedbychiva</a> · <a href="https://www.luxique.nl">www.luxique.nl</a>
        </div>
      </section>

    </main>
  </div>

  
`

  return (
    <div ref={containerRef}>
      <style>{css}</style>
      <div className="juridisch-progress" style={{ position: 'fixed', top: 0, left: 0, height: '3px', width: '0%', zIndex: 50, background: 'linear-gradient(90deg,#C9A86A,#B08D4F)', boxShadow: '0 0 12px -2px rgba(176,141,79,.4)', transition: 'width .1s linear' }}></div>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}
