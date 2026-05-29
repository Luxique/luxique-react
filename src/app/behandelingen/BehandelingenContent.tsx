/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useState } from 'react'

const _C = {
  cream: '#FAF8F4',
  cream2: '#F3EEE6',
  ivory: '#FDFCFA',
  box: '#FFFFFF',
  boxWarm: '#F7F2EA',
  ink: '#1A1815',
  inkSoft: '#5C564C',
  inkMute: '#8A8378',
  gold: '#C4A265',
  goldDeep: '#A8884A',
  border: 'rgba(26,24,21,0.08)',
  borderStrong: 'rgba(26,24,21,0.14)',
  radius: '22px',
  radiusLg: '28px',
  radiusSm: '14px',
  gap: '14px',
}

const SerifAccent = ({ children }: { children: React.ReactNode }) => (
  <span className="font-['Cormorant_Garamond'] italic font-normal">{children}</span>
)

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <span className="block text-[11px] tracking-[0.26em] uppercase text-[#8A8378] font-medium mb-[14px]">{children}</span>
)

/* ─── INTRO ─── */
function IntroSection() {
  return (
    <section className="bg-white rounded-[28px] text-center px-[60px] py-[110px] max-[860px]:px-[28px] max-[860px]:py-[70px]">
      <Eyebrow>— Behandelingen —</Eyebrow>
      <h1 className="font-['Outfit'] font-medium tracking-[-0.02em] leading-[1.02] text-[clamp(44px,6.5vw,88px)] text-[#1A1815] mb-[24px] max-w-[900px] mx-auto">
        Lashes afgestemd<br />op <SerifAccent>jouw blik</SerifAccent>
      </h1>
      <p className="text-[#5C564C] text-[18px] max-w-[560px] mx-auto mb-[36px] leading-[1.6]">
        Geen standaard set, maar lashes die passen bij jouw oogvorm, levensstijl en wensen. Ontdek wat een behandeling bij Luxique anders maakt.
      </p>
      <div className="flex gap-[12px] justify-center flex-wrap">
        <a href="#boek" className="bg-[#1A1815] text-[#FAF8F4] px-[26px] py-[12px] rounded-full text-[13px] font-medium tracking-[0.02em] no-underline inline-flex items-center gap-[10px] hover:bg-[#A8884A] hover:-translate-y-[2px] transition-all">
          Boek je afspraak →
        </a>
        <a href="#verhaal" className="bg-transparent text-[#1A1815] px-[26px] py-[12px] rounded-full border border-[rgba(26,24,21,0.14)] text-[13px] no-underline inline-flex items-center gap-[10px] hover:border-[#1A1815] hover:bg-[#F7F2EA] transition-all">
          Lees meer
        </a>
      </div>
    </section>
  )
}

/* ─── STORY ROW ─── */
interface StoryRowProps {
  eyebrow: string
  title: string
  titleAccent: string
  paragraphs: string[]
  imageLabel: string
  imageUrl: string
  imageSide: 'left' | 'right'
  details?: Array<{ num: string; label: string }>
}

function StoryRow({ eyebrow, title, titleAccent, paragraphs, imageLabel, imageUrl, imageSide, details }: StoryRowProps) {
  const cols = imageSide === 'right' ? 'grid-cols-[1.2fr_1fr]' : 'grid-cols-[1fr_1.2fr]'
  const contentOrder = imageSide === 'right' ? 'order-1' : 'order-2'
  const imageOrder = imageSide === 'right' ? 'order-2' : 'order-1'

  return (
    <div className={`grid ${cols} max-[860px]:grid-cols-1 gap-[14px] mb-[14px]`}>
      <div className={`bg-white rounded-[28px] px-[60px] py-[60px] flex flex-col justify-center max-[860px]:px-[28px] max-[860px]:py-[40px] ${contentOrder}`}>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 className="font-['Outfit'] font-medium text-[clamp(32px,3.6vw,52px)] tracking-[-0.02em] leading-[1.05] text-[#1A1815] mb-[22px]">
          {title}<br /><SerifAccent>{titleAccent}</SerifAccent>
        </h2>
        {paragraphs.map((p, i) => (
          <p key={i} className="text-[#5C564C] text-[16px] leading-[1.75] mb-[16px] last:mb-0">{p}</p>
        ))}
        {details && (
          <div className="mt-[28px] pt-[28px] border-t border-[rgba(26,24,21,0.08)] flex gap-[40px] max-[860px]:flex-col max-[860px]:gap-[16px]">
            {details.map((d, i) => (
              <div key={i}>
                <div className="font-['Cormorant_Garamond'] italic text-[30px] text-[#1A1815] leading-none font-medium">{d.num}</div>
                <div className="text-[11px] text-[#8A8378] tracking-[0.14em] uppercase mt-[6px]">{d.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className={`${imageOrder} rounded-[28px] bg-cover bg-center min-h-[480px] max-[860px]:min-h-[380px] relative overflow-hidden`}
        style={{ backgroundImage: `url(${imageUrl})` }}>
        <span className="absolute top-[24px] left-[24px] bg-[rgba(253,252,250,0.95)] backdrop-blur-[8px] px-[16px] py-[8px] rounded-full text-[11px] tracking-[0.18em] uppercase text-[#1A1815] font-medium">
          {imageLabel}
        </span>
      </div>
    </div>
  )
}

/* ─── PRIJZEN ─── */
function PrijzenSection() {
  return (
    <section id="prijzen" className="bg-[#F7F2EA] rounded-[28px] px-[60px] py-[90px] max-[860px]:px-[28px] max-[860px]:py-[60px]">
      <div className="text-center mb-[48px]">
        <Eyebrow>— Tarieven —</Eyebrow>
        <h2 className="font-['Outfit'] font-medium text-[clamp(32px,4vw,52px)] tracking-[-0.02em] text-[#1A1815] mb-[14px]">
          Heldere <SerifAccent>prijzen</SerifAccent>
        </h2>
        
      </div>
      <div className="grid grid-cols-2 max-[860px]:grid-cols-1 gap-[14px] max-w-[880px] mx-auto">
        <div className="bg-[#F7F2EA] hover:bg-[#FDFCFA] rounded-[22px] px-[36px] py-[44px] text-center transition-all hover:-translate-y-[4px] hover:shadow-[0_20px_50px_rgba(26,24,21,0.06)]">
          <span className="block text-[11px] tracking-[0.26em] uppercase text-[#8A8378] font-medium mb-[18px]">Nieuwe Set</span>
          <h3 className="font-['Outfit'] font-medium text-[22px] text-[#1A1815] mb-[18px]">Volledige set naar keuze</h3>
          <div className="font-['Cormorant_Garamond'] italic text-[60px] text-[#1A1815] leading-none mb-[6px] font-medium">
            <span className="text-[32px] align-super text-[#A8884A]">€</span>129
          </div>
          <div className="text-[#8A8378] text-[13px] mb-[24px]">± 2 uur</div>
          <p className="text-[#5C564C] text-[14px] leading-[1.7] mb-[28px] min-h-[50px]">
            Een volledig nieuwe set, afgestemd op jouw oogvorm en wensen. Kies uit verschillende stijlen.
          </p>
          <a href="#boek" className="block w-full bg-[#1A1815] text-[#FAF8F4] py-[12px] rounded-full text-[13px] font-medium tracking-[0.02em] text-center no-underline hover:bg-[#A8884A] transition-all">
            Boek nieuwe set
          </a>
        </div>
        <div className="bg-[#F7F2EA] hover:bg-[#FDFCFA] rounded-[22px] px-[36px] py-[44px] text-center transition-all hover:-translate-y-[4px] hover:shadow-[0_20px_50px_rgba(26,24,21,0.06)]">
          <span className="block text-[11px] tracking-[0.26em] uppercase text-[#8A8378] font-medium mb-[18px]">Refill</span>
          <h3 className="font-['Outfit'] font-medium text-[22px] text-[#1A1815] mb-[18px]">Opvullen bestaande set</h3>
          <div className="font-['Cormorant_Garamond'] italic text-[60px] text-[#1A1815] leading-none mb-[6px] font-medium">
            <span className="text-[32px] align-super text-[#A8884A]">€</span>89
          </div>
          <div className="text-[#8A8378] text-[13px] mb-[24px]">± 1 uur</div>
          <p className="text-[#5C564C] text-[14px] leading-[1.7] mb-[28px] min-h-[50px]">
            Houd je set vol en mooi. Aanbevolen elke 2 tot 3 weken voor het beste resultaat.
          </p>
          <a href="#boek" className="block w-full bg-transparent text-[#1A1815] py-[12px] rounded-full text-[13px] border border-[rgba(26,24,21,0.14)] text-center no-underline hover:border-[#1A1815] hover:bg-[#F7F2EA] transition-all">
            Boek refill
          </a>
        </div>
      </div>
    </section>
  )
}

/* ─── GALLERY ─── */
function GallerySection() {
  return (
    <section className="bg-white rounded-[28px] px-[60px] py-[90px] max-[860px]:px-[28px] max-[860px]:py-[60px]">
      <div className="text-center mb-[48px]">
        <Eyebrow>— Het Werk —</Eyebrow>
        <h2 className="font-['Outfit'] font-medium text-[clamp(32px,4vw,52px)] tracking-[-0.02em] text-[#1A1815] mb-[14px]">
          Resultaten die <SerifAccent>spreken</SerifAccent>
        </h2>
        <p className="text-[#5C564C] text-[16px] max-w-[540px] mx-auto">Een selectie van recent werk uit de studio.</p>
      </div>
      <div className="grid grid-cols-4 max-[860px]:grid-cols-2 max-[560px]:grid-cols-1 gap-[14px]"
        style={{ gridTemplateRows: 'repeat(2, 240px)' }}>
        <div className="col-span-2 row-span-2 max-[560px]:col-span-1 max-[560px]:row-span-1 rounded-[22px] bg-cover bg-center relative overflow-hidden hover:scale-[1.02] transition-transform cursor-pointer"
          style={{ backgroundImage: "url('/images/chiva-portrait.jpg')" }} />
        <div className="rounded-[22px] bg-cover bg-center overflow-hidden hover:scale-[1.02] transition-transform cursor-pointer"
          style={{ backgroundImage: "url('/images/chiva-portrait.jpg')" }} />
        <div className="rounded-[22px] bg-cover bg-center overflow-hidden hover:scale-[1.02] transition-transform cursor-pointer"
          style={{ backgroundImage: "url('/images/hero-bg.jpg')" }} />
        <div className="rounded-[22px] bg-[#1A1815] flex items-center justify-center cursor-pointer hover:scale-[1.02] transition-transform relative">
          <div className="w-[64px] h-[64px] rounded-full bg-[#FAF8F4] flex items-center justify-center relative">
            <div className="w-0 h-0 border-l-[18px] border-l-[#1A1815] border-t-[11px] border-t-transparent border-b-[11px] border-b-transparent ml-[6px]" />
          </div>
        </div>
        <div className="rounded-[22px] bg-cover bg-center overflow-hidden hover:scale-[1.02] transition-transform cursor-pointer"
          style={{ backgroundImage: "url('/images/chiva-portrait.jpg')" }} />
      </div>
    </section>
  )
}

/* ─── FAQ ─── */
const faqData = [
  { q: 'Hoe lang duurt een behandeling?', a: 'Een nieuwe set duurt ongeveer 2 uur. Een refill is sneller — reken op ongeveer een uur, afhankelijk van hoeveel lashes er bijgevuld moeten worden.' },
  { q: 'Hoe vaak moet ik komen voor een refill?', a: 'Voor een vol resultaat raad ik aan om elke 2 tot 3 weken langs te komen. Je natuurlijke wimpers vallen uit en groeien aan, dus een regelmatige refill houdt je set er op zijn best uit.' },
  { q: 'Doet het pijn?', a: 'Nee. De behandeling is volledig pijnloos. Je ligt comfortabel met gesloten ogen — veel klanten vinden het zo ontspannend dat ze in slaap vallen.' },
  { q: 'Hoe verzorg ik mijn lashes thuis?', a: 'Je krijgt na de behandeling persoonlijk nazorgadvies. Kort gezegd: de eerste 24 uur niet nat maken, voorzichtig reinigen, en niet wrijven. Ik leg je alles uit tijdens je afspraak.' },
  { q: 'Welke stijl past bij mij?', a: 'Dat bepalen we samen tijdens de consultatie. Op basis van je oogvorm, natuurlijke wimpers en wensen kies ik de styling die jouw blik het mooist versterkt.' },
]

function FAQSection() {
  const [openIndex, setOpenIndex] = useState(0)
  return (
    <section id="faq" className="bg-[#F7F2EA] rounded-[28px] px-[60px] py-[90px] max-[860px]:px-[28px] max-[860px]:py-[60px]">
      <div className="text-center mb-[48px]">
        <Eyebrow>— Veelgestelde Vragen —</Eyebrow>
        <h2 className="font-['Outfit'] font-medium text-[clamp(32px,4vw,52px)] tracking-[-0.02em] text-[#1A1815]">
          Goed om <SerifAccent>te weten</SerifAccent>
        </h2>
      </div>
      <div className="max-w-[760px] mx-auto flex flex-col gap-[10px]">
        {faqData.map((item, i) => (
          <div key={i}
            className={`bg-[#FDFCFA] border rounded-[14px] overflow-hidden transition-colors ${openIndex === i ? 'border-[rgba(26,24,21,0.14)]' : 'border-[rgba(26,24,21,0.08)] hover:border-[rgba(26,24,21,0.14)]'}`}>
            <div className="px-[26px] py-[22px] cursor-pointer flex justify-between items-center select-none"
              onClick={() => setOpenIndex(openIndex === i ? -1 : i)}>
              <span className="text-[#1A1815] text-[16px] font-medium">{item.q}</span>
              <span className={`text-[#1A1815] text-[22px] font-light transition-transform ${openIndex === i ? 'rotate-45' : ''}`}>+</span>
            </div>
            <div className={`overflow-hidden transition-all ${openIndex === i ? 'max-h-[240px] opacity-100' : 'max-h-0 opacity-0'}`}>
              <p className="px-[26px] pb-[22px] text-[#5C564C] text-[15px] leading-[1.7]">{item.a}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ─── BOOKING ─── */
function BookingSection() {
  return (
    <section id="boek" className="bg-[#1A1815] text-[#FAF8F4] rounded-[28px] px-[60px] py-[80px] text-center relative overflow-hidden max-[860px]:px-[28px] max-[860px]:py-[60px]">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-[radial-gradient(ellipse,rgba(196,162,101,0.18)_0%,transparent_70%)] z-0" />
      <div className="relative z-[1]">
        <Eyebrow>— Plan je afspraak —</Eyebrow>
        <h2 className="font-['Outfit'] font-medium text-[clamp(38px,5vw,68px)] text-[#FAF8F4] mb-[18px] tracking-[-0.02em]">
          Boek jouw <span className="font-['Cormorant_Garamond'] italic text-[#C4A265]">moment</span>
        </h2>
        <p className="text-[rgba(250,248,244,0.7)] text-[17px] max-w-[480px] mx-auto mb-[40px]">
          Kies een datum en tijd die jou uitkomt. Ik kijk ernaar uit je te ontmoeten.
        </p>
        <div className="max-w-[880px] mx-auto bg-[#FAF8F4] rounded-[22px] min-h-[460px] flex items-center justify-center flex-col gap-[14px] text-[#5C564C] px-[32px] py-[60px]">
          <div className="text-[38px] text-[#A8884A]">📅</div>
          <div className="font-['Cormorant_Garamond'] italic text-[24px] text-[#1A1815] font-medium">Cal.com agenda</div>
          <div className="text-[13px] tracking-[0.04em] max-w-[360px] text-center text-[#8A8378]">
            Hier komt de live Cal.com booking widget — klanten kiezen direct een beschikbaar tijdslot en boeken hun behandeling.
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── MAIN CONTENT ─── */
export default function BehandelingenContent() {
  return (
    <div className="flex flex-col gap-[14px]">
      <IntroSection />

      <div id="verhaal">
        <StoryRow
          eyebrow="— Stap 01 · De Consultatie —"
          title="Eerst luisteren,"
          titleAccent="dan kijken"
          paragraphs={[
            'Elke afspraak begint met een consultatiegesprek. Onder het genot van een kopje thee bespreken we jouw wensen en wat je van je lashes verwacht.',
            'We gaan eerst begrijpen wat je wilt uitstralen en welke stijl bij je past, voordat er ook maar één lash wordt geplaatst.',
          ]}
          imageLabel="01 · Welkom"
          imageUrl="/images/hero-bg.jpg"
          imageSide="right"
          details={[
            { num: '10 min', label: 'Consultatie' },
            { num: 'Gratis', label: 'Inbegrepen' },
          ]}
        />

        <StoryRow
          eyebrow="— Stap 02 · De Styling —"
          title="Afgestemd op"
          titleAccent="jouw oogvorm"
          paragraphs={[
            'Op basis van je oogvorm, natuurlijke wimpers en wensen bepalen we de styling die jouw blik het mooist versterkt. Van een natuurlijke look tot vol.',
            'De juiste krul, lengte en dikte maken het verschil tussen \u2018gewoon mooi\u2019 en \u2018perfect voor jou\u2019.',
          ]}
          imageLabel="02 · Ontwerp"
          imageUrl="/images/chiva-portrait.jpg"
          imageSide="left"
        />

        <StoryRow
          eyebrow="— Stap 03 · Het Werk —"
          title="Met precisie,"
          titleAccent="lash voor lash"
          paragraphs={[
            'Je ligt comfortabel met gesloten ogen terwijl elke lash met precisie wordt opgelegd. De behandeling is geheel pijnloos, sommige klanten doezelen zelfs even weg.',
            'Er wordt uitsluitend met premium materialen gewerkt die de gezondheid en sterkte van je eigen wimpers behouden.',
          ]}
          imageLabel="03 · Plaatsing"
          imageUrl="/images/hero-bg.jpg"
          imageSide="right"
          details={[
            { num: '± 2u', label: 'Nieuwe set' },
            { num: '± 1u', label: 'Refill' },
          ]}
        />

        <StoryRow
          eyebrow="— Stap 04 · De Nazorg —"
          title="Mooi blijven,"
          titleAccent="ook thuis"
          paragraphs={[
            'Samen bewonderen we het resultaat. Je gaat naar huis met persoonlijk nazorgadvies zodat je set langer mooi blijft en je wimpers gezond houdt.',
            'Voor een vol resultaat raden we aan om elke 2 tot 3 weken langs te komen voor een refill.',
          ]}
          imageLabel="04 · Nazorg"
          imageUrl="/images/chiva-portrait.jpg"
          imageSide="left"
        />
      </div>

      <PrijzenSection />
      <GallerySection />
      <FAQSection />
      <BookingSection />
    </div>
  )
}
