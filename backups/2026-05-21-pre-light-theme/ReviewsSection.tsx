'use client'

import { useState, useRef, useEffect } from 'react'

/* ── data ── */
type Source = 'google' | 'treatwell'

interface Review {
  name: string
  initials: string
  color: string
  source: Source
  date: string
  stars: number
  verified?: boolean
  text: string
  photoFilename?: string
}

const REVIEWS: Review[] = [
  { name: 'Sepideh', initials: 'S', color: '#B06A8A', source: 'treatwell', date: '2 maanden geleden', stars: 5, verified: true, text: 'en ik ben nog steeds zo blij met het resultaat! Chiva dacht heel goed met me mee en luisterde naar mijn wensen en gaf eerlijk advies. Ze nam echt de tijd! Omdat mijn ogen wat meer uitdaging geven vond ik het best spannend, maar het is haar prachtig gelukt. Je merkt echt dat ze zich onderscheidt van anderen door haar persoonlijke aandacht en passie voor haar werk. Het resultaat is precies wat ik hoopte ✨' },
  { name: 'Cansu', initials: 'C', color: '#2AA8A0', source: 'treatwell', date: '4 maanden geleden', stars: 5, verified: true, text: 'Super tevreden met mijn nieuwe wimpers! Bedankt dat je uitgebreid de tijd hebt genomen een ook nog eens een mini cursus gekregen. Tot snel!' },
  { name: 'Milva', initials: 'M', color: '#D4782A', source: 'treatwell', date: '5 maanden geleden', stars: 5, verified: true, text: 'I had a great time with chiva. Thank you sooo much and also very gratefull for the listen ear 😊😊' },
  { name: 'Valentina', initials: 'V', color: '#7B6EA8', source: 'treatwell', date: '6 maanden geleden', stars: 5, verified: true, text: 'Loved every bit of it' },
  { name: 'Carii', initials: 'C', color: '#4A9E6E', source: 'treatwell', date: '6 maanden geleden', stars: 5, verified: true, text: 'Chiva is een fijn persoon die haar vak kent en goed uitvoert' },
  { name: 'Petja', initials: 'P', color: '#8B4DB8', source: 'treatwell', date: '8 maanden geleden', stars: 5, verified: true, text: "I'm still new to lashes but I already know I never wanna go to another lash tech!! She is always chill and cheerful and really adapts to your vibe! Wanna talk? Then you'll have some nice conversations and the time flies! Or if you wanna have a little nap and wake up beautiful and STUNNNINGGG! In all my appointments I have not been disappointed! I love trying new things and she has so many options!" },
  { name: 'Linda', initials: 'L', color: '#3B82C4', source: 'treatwell', date: '11 maanden geleden', stars: 5, verified: true, text: 'Ze werkt erg nauwkeurig en wimpers zien er erg mooi en natuurlijk uit ❤️' },
  { name: 'Zara', initials: 'Z', color: '#D4782A', source: 'treatwell', date: '11 maanden geleden', stars: 5, verified: true, text: 'Alles was super duidelijk! Heb zooo veel geleerd. Zeker een aanrader' },
  { name: 'Beatrice', initials: 'B', color: '#7B4D9E', source: 'treatwell', date: 'ongeveer 1 jaar geleden', stars: 5, verified: true, text: 'Awesome, chat, awesome clean working, Happy moments, and 100% satisfaction' },
  { name: 'Avin', initials: 'A', color: '#C97B5A', source: 'treatwell', date: 'meer dan 1 jaar geleden', stars: 5, verified: true, text: 'It was very beautiful and I was really happy with the result of my eyelashes' },
  { name: 'Carii', initials: 'C', color: '#4A9E6E', source: 'treatwell', date: 'meer dan 1 jaar geleden', stars: 5, verified: true, text: 'fijne dame, ze verstaat haar vak! wimpers zijn mooi gezet!' },
  { name: 'Cheely', initials: 'C', color: '#B07A5A', source: 'treatwell', date: 'meer dan 1 jaar geleden', stars: 5, verified: true, text: 'Ze is heel vriendelijk en probeerde me erg op me gemak te stellen wat ook is gelukt!! Ik kom zeker nog een keer langs' },
  { name: 'Melina Yoldas', initials: 'M', color: '#7B6EA8', source: 'google', date: '2 maanden geleden', stars: 5, text: "Onlangs heb ik de lash artist cursus van Chiva gevolgd en ik kan oprecht zeggen dat het een enorme verrijking is geweest voor mijn ontwikkeling als wimperstylist. De inhoud van de training is sterk en diepgaand; er wordt niet alleen gewerkt aan techniek, maar ook aan inzicht, precisie en professionele groei.\n\nWat deze cursus echt onderscheidt, is de manier waarop alles wordt uitgelegd. De uitleg is helder, gedetailleerd en onderbouwd, waardoor je niet alleen leert hoe je iets doet, maar vooral ook waarom.\n\nVoor iedere lash artist die een volgende stap wil zetten in haar carrière en zichzelf serieus wil ontwikkelen, is deze cursus absoluut een aanrader." },
  { name: 'Aisha Castro Kaiser', initials: 'A', color: '#E05C7A', source: 'google', date: '2 maanden geleden', stars: 5, text: "Ik heb bij Chiva de wispy lash artist cursus gevolgd en ik ben zó blij dat ik dit heb gedaan! Ze legt alles super duidelijk uit en neemt echt de tijd voor je.\n\nDoor deze cursus voel ik me veel zelfverzekerder in mijn werk en zie ik echt verschil in mijn resultaten. Echt een aanrader voor elke lash tech die wil groeien tot lash artist ✨" },
  { name: 'Chay Saliji', initials: 'C', color: '#2AA8A0', source: 'google', date: 'een maand geleden', stars: 5, text: "Ik wil even mijn ervaring delen over mijn lash training bij Chiva 🤍\n\nVanaf het eerste moment voelde ik me op mijn gemak. Chiva neemt echt de tijd voor je en ondersteunt je bij elke stap.\n\nIk heb eerder een lash cursus gevolgd, maar daarna had ik eerlijk gezegd niet eens het zelfvertrouwen om op echte ogen te oefenen. Na de cursus van Chiva is dat compleet veranderd.\n\nDit is een investering in jezelf die het écht waard is ✨" },
  { name: 'Nina-li', initials: 'N', color: '#E8784A', source: 'google', date: '6 maanden geleden', stars: 5, text: "Eerste keer wimper extensions bij Chiva laten zetten. Echt een aanrader!\n\nZe denkt met je mee, stelt je op je gemak, neemt de tijd voor je en werkt heel nauwkeurig. 10/10 definitely recommend." },
  { name: 'Maud Lommers', initials: 'M', color: '#4A9E6E', source: 'google', date: '6 maanden geleden', stars: 5, text: 'Beste lash artist ever <3 Ze denkt super goed met je mee en er is heel veel mogelijk. Mn wimpers zijn nog nooit zo mooi geweest' },
  { name: 'mara', initials: 'm', color: '#3B82C4', source: 'google', date: '11 maanden geleden', stars: 5, text: "Ik zeg het je, nadat ik hier ben geweest ben ik nooit ergens anders geweest. She never disappoints. Ik was in het begin heel erg onzeker, maar toen ik het bij lashedbychiva liet doen heb ik nooit ergens last van gehad. Ze luistert echt naar wat je wilt en het is altijd gezellig!! Ik zeg doen ladies!! 🙌" },
  { name: 'Julia Bergen', initials: 'J', color: '#8B4DB8', source: 'google', date: '7 maanden geleden', stars: 5, text: "Ik ben super tevreden! Mijn wimpers blijven echt lang mooi zitten en dat scheelt me zoveel tijd 's ochtends. Daarnaast is ze ontzettend lief en maakt ze je helemaal op je gemak. Echt een aanrader!" },
  { name: 'petja kirkels', initials: 'p', color: '#6B4D9E', source: 'google', date: '6 maanden geleden', stars: 5, text: "Ik zeg het nog een keer: mijn wimpers van Chiva hebben me NOG NOOIT teleurgesteld! Ze heeft zoveel verschillende opties, dus als je af en toe van stijl wilt wisselen, is zij de perfecte keuze! Je raakt er waarschijnlijk verslaafd aan na je eerste set 😫" },
  { name: 'S K', initials: 'S', color: '#D4782A', source: 'google', date: 'een jaar geleden', stars: 5, text: 'Nooit bleven mijn wimpers goed zitten bij andere stylistes, de volgende zag lagen ze er vaak weer af. Bij deze topper zitten ze na 3 weken nog fantastisch!! Zo blij ❤️' },
  { name: 'Jara van den Brenk', initials: 'J', color: '#C97B5A', source: 'google', date: 'een jaar geleden', stars: 5, photoFilename: 'jara-van-den-brenk.jpg', text: 'Ik ben al een aantal keer geweest, ontzettend lieve dame. Ze denkt altijd met je mee, ook een aanrader als je graag bruine lashes wil! 🤎🤗' },
  { name: 'M Mirzojan', initials: 'M', color: '#D45A3A', source: 'google', date: 'een jaar geleden', stars: 5, text: 'Deze dame kan echt hele mooie lashes zetten, ze denkt met je mee en werkt met je oogvorm. Blijven superlang zitten en het is altijd gezellig ❤️' },
  { name: 'nar c', initials: 'n', color: '#2E8B7A', source: 'google', date: 'een jaar geleden', stars: 5, text: 'Ze is super gastvrij en zet de lashes echt goed, ik ben heel blij dat dit mijn vaste lashtag is 🥰' },
  { name: 'Che', initials: 'C', color: '#B05070', source: 'google', date: 'een jaar geleden', stars: 5, photoFilename: 'che.jpg', text: 'Hele aardige dame, ik kwam voor de eerste keer voor wimperextentions en werd erg goed gerustgesteld. En het resultaat was prachtig !!' },
  { name: 'Mäbel Seelen', initials: 'M', color: '#7A6E5A', source: 'google', date: 'een jaar geleden', stars: 5, photoFilename: 'mabel-seelen.jpg', text: 'Deze vrouw is kunstenares. Prachtige set wimpers. En ze is ook nog eens lief!' },
  { name: 'avin abdullah', initials: 'a', color: '#4A6EA8', source: 'google', date: 'een jaar geleden', stars: 5, text: 'Ze is erg aardig en haar werk is erg mooi ❤️❤️❤️❤️🙌🙌🙌' },
  { name: 'Fanity Meier', initials: 'F', color: '#D47A2A', source: 'google', date: 'een jaar geleden', stars: 5, text: 'Ben altijd tevreden als ik weg ga' },
  { name: 'Roroo', initials: 'R', color: '#9B4DB8', source: 'google', date: 'een maand geleden', stars: 5, text: 'Ik heb de wispy cursus gevolgd en heb daar zeker geen spijt van! Ik heb zoveel geleerd en merkte echt dat ze dit met passie doet! Tijdens andere cursussen leerde ik alleen de basis, maar bij haar leer je echt ALLES! Zeker aan te raden! ✨😁' },
  { name: 'H K', initials: 'H', color: '#D45A2A', source: 'google', date: 'een maand geleden', stars: 5, text: 'Super tevreden! De beste in medusa lashes en super vriendelijk! En oh ja de lijm die ze gebruikt? Ge-wel-dig: was verbaasd dat na 3 weken ze nog goed zaten <3' },
  { name: 'Michela Eriu', initials: 'M', color: '#C76A8A', source: 'google', date: 'een maand geleden', stars: 5, photoFilename: 'michela-eriu.jpg', text: 'Ik was al super lang op zoek naar iemand die medusa lashes kon doen. Chiva heeft me echt precies gegeven wat ik wilde. Ik ben er enorm blij mee! Verder is ze heel verwelkomend en vloog de tijd voorbij. Ik kom zeker weer 💗' },
  { name: 'Ifeoluwa Oladipo', initials: 'I', color: '#5A5A7A', source: 'google', date: '2 maanden geleden', stars: 5, photoFilename: 'ifeoluwa-oladipo.jpg', text: 'Ik heb enorm veel geluk gehad dat Chiva mij heeft begeleid. Ze maakte van een technische cursus een fluitje in een cent – ondanks dat het online was! Ze was zo vriendelijk en geduldig en corrigeerde me op een liefdevolle manier. Ik voel me veel zelfverzekerder in mijn vaardigheden na de training met haar.' },
]

const BATCH = 5

function needsExpand(text: string) {
  return text.length > 200 || text.includes('\n\n')
}

/* ── SVGs ── */
function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  )
}

function TreatwellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="twgrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E85D4A" />
          <stop offset="100%" stopColor="#C13B6B" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="10" fill="url(#twgrad)" />
      <text x="24" y="34" textAnchor="middle" fontSize="20" fontFamily="Arial,sans-serif" fontWeight="900" fill="white">tw</text>
    </svg>
  )
}

/* ── Card ── */
function ReviewCard({ review, visible }: { review: Review; visible: boolean }) {
  const [expanded, setExpanded] = useState(false)
  const expandable = needsExpand(review.text)

  const paragraphs = review.text.split('\n\n').map((p, pi) => (
    <p key={pi} dangerouslySetInnerHTML={{ __html: p.replace(/\n/g, '<br/>') }} />
  ))

  return (
    <div
      className={`review-card ${!visible ? 'hidden' : ''}`}
      style={visible ? { animation: `reviewFadeInUp 0.35s ease 0ms both` } : undefined}
    >
      {/* Decorative quote */}
      <span className="card-quote">&ldquo;</span>

      {/* Top row */}
      <div className="card-top">
        <div className="avatar-initial" style={{ background: review.color }}>{review.initials}</div>
        <div className="reviewer-info">
          <div className="reviewer-name">{review.name}</div>
          <div className="reviewer-meta">{review.date}</div>
        </div>
        <span className={`card-source ${review.source}`}>
          {review.source === 'google' ? <GoogleIcon /> : <TreatwellIcon />}
          {review.source === 'google' ? 'Google' : 'Treatwell'}
        </span>
      </div>

      {/* Stars */}
      <div className="card-stars">
        <div className="stars">{Array.from({ length: review.stars }, (_, i) => <span key={i} className="star">★</span>)}</div>
        {review.verified && <span className="verified">✓ Geverifieerd</span>}
      </div>

      {/* Text */}
      <div>
        <div className={`review-text ${expandable && !expanded ? 'collapsed' : ''}`}>
          {paragraphs}
        </div>
        {expandable && (
          <button className="toggle-btn" onClick={() => setExpanded(!expanded)}>
            {expanded ? 'Minder tonen ▲' : 'Meer tonen ▼'}
          </button>
        )}
      </div>

      {review.photoFilename && (
        <div className="photo-note">📷 <strong>{review.photoFilename}</strong></div>
      )}
    </div>
  )
}

/* ── Main ── */
export default function ReviewsSection() {
  const [shown, setShown] = useState(BATCH)
  const allLoaded = shown >= REVIEWS.length
  const gridRef = useRef<HTMLDivElement>(null)

  const loadMore = () => {
    setShown(prev => Math.min(prev + BATCH, REVIEWS.length))
  }

  useEffect(() => {
    if (allLoaded && gridRef.current) {
      gridRef.current.classList.add('all-loaded')
    }
  }, [allLoaded])

  return (
    <section className="reviews-section">
      {/* Header */}
      <div className="section-header">
        <span className="eyebrow">Wat klanten zeggen</span>
        <h2>
          Lashes die <em>spreken</em><br />voor zichzelf
        </h2>

        <div className="source-pills">
          <div className="source-pill">
            <GoogleIcon />
            <span>Google</span>
            <span className="pill-stars">★★★★★</span>
            <span className="pill-count">20 reviews</span>
          </div>
          <div className="source-pill">
            <TreatwellIcon />
            <span>Treatwell</span>
            <span className="pill-stars">★★★★★</span>
            <span className="pill-count">13 reviews</span>
          </div>
        </div>

        <div className="rating-row">
          <span className="rating-num">5.0</span>
          <div className="rating-detail">
            <div className="rating-stars">
              <span className="s">★</span><span className="s">★</span><span className="s">★</span><span className="s">★</span><span className="s">★</span>
            </div>
            <span className="rating-label">33 beoordelingen totaal</span>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className={`grid-outer${allLoaded ? ' all-loaded' : ''}`} ref={gridRef}>
        <div className="reviews-grid">
          {REVIEWS.map((r, i) => (
            <ReviewCard key={i} review={r} visible={i < shown} />
          ))}
        </div>
      </div>

      {/* Load more */}
      <div className={`load-more-cta${allLoaded ? ' all-loaded' : ''}`}>
        <button className="load-more-btn" onClick={loadMore}>
          Meer reviews laden <span style={{ fontSize: 10, opacity: 0.7 }}>▼</span>
        </button>
      </div>
    </section>
  )
}
