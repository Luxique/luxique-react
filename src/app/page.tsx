import Hero from '@/components/Hero'
import TechVsArtist from '@/components/TechVsArtist'
import EyeShapes from '@/components/EyeShapes'
import Missie from '@/components/Missie'
import BeforeAfter from '@/components/BeforeAfter'
import MeetChiva from '@/components/MeetChiva'
import ReelsSection from '@/components/ReelsSection'
import ComparisonTable from '@/components/ComparisonTable'
import AcademyHomeSection from '@/components/AcademyHomeSection'
import ReviewsSection from '@/components/ReviewsSection'
import FAQ from '@/components/FAQ'
import EmailConfirmHandler from '@/components/EmailConfirmHandler'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="bg-[#F3EEE6] min-h-screen">
    <EmailConfirmHandler />
    <>
      <div id="hero" data-theme-color="#FAF8F4" data-theme-dark="false" className="relative w-full h-screen max-h-screen bg-[#F3EEE6] overflow-hidden pt-[66px] max-md:pt-[58px]">
        <Hero />
      </div>
      <div id="verschil" data-theme-color="#FAF8F4" data-theme-dark="false"><TechVsArtist /></div>
      <div id="meet-chiva" data-theme-color="#FFFFFF" data-theme-dark="false" className="mt-[14px]"><MeetChiva /></div>
      <div id="missie" data-theme-color="#F3EFE7" data-theme-dark="false"><Missie /></div>
      <div id="oogvormen" data-theme-color="#FFFFFF" data-theme-dark="false"><EyeShapes /></div>
      <div id="behandelingen" data-theme-color="#FAFAFA" data-theme-dark="false" className="px-[14px] pt-[14px] max-[860px]:px-[10px] max-[860px]:pt-[10px]"><BeforeAfter /></div>
      <div id="reels" data-theme-color="#FAF8F4" data-theme-dark="false"><ReelsSection /></div>
      <div id="academy" data-theme-color="#FAFAFA" data-theme-dark="false"><ComparisonTable /><AcademyHomeSection /></div>
      <div className="px-[14px] max-[860px]:px-[10px]">
      {/* ══ ROW 3: Dark bottom panel ══ */}
      <div className="rounded-[22px] overflow-hidden relative min-h-[340px] flex items-end">
        <div className="absolute inset-0 bg-[linear-gradient(160deg,#1e180e_0%,#120e08_40%,#0C0A07_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(12,10,7,0.92)_0%,rgba(12,10,7,0.55)_45%,rgba(12,10,7,0.1)_100%)] pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 font-['Avenir_Next'] font-[200] text-[clamp(60px,14vw,180px)] tracking-[0.18em] text-center text-[rgba(196,162,101,0.06)] leading-none pointer-events-none whitespace-nowrap uppercase overflow-hidden select-none pb-0">
          Luxique
        </div>
        <div className="relative z-[3] p-10 max-[860px]:p-8 grid grid-cols-1 min-[860px]:grid-cols-[1fr_auto] items-end gap-8 w-full">
          <div>
            <p className="text-[9.5px] font-semibold tracking-[0.24em] uppercase text-[#C4A265] mb-[10px]">Over ons</p>
            <h3 className="font-['Cormorant_Garamond'] text-[clamp(28px,3.5vw,52px)] font-normal leading-[1.08] text-[#FAF8F4] tracking-[-0.01em] mb-3">
              Van beginners tot gevorderden —<br /><span className="font-['Cormorant_Garamond'] italic font-normal text-[#C4A265]">iedereen is welkom.</span>
            </h3>
            <p className="text-[13.5px] font-light text-[rgba(250,248,244,0.45)] leading-[1.7] max-w-[500px]">
              LXQ Academy is onze manier om alles door te geven wat wij hebben geleerd. Niet alleen de techniek, maar het denken als een artist. Chiva heeft velen studenten opgeleid en haar filosofie is simpel: elke oogvorm verdient een unieke aanpak.
            </p>
          </div>
          <Link href="/about" className="font-['Outfit'] text-[13px] font-medium px-[28px] py-[13px] rounded-full bg-transparent text-[#FAF8F4] border-[1.5px] border-[rgba(250,248,244,0.22)] cursor-pointer transition-all duration-[220ms] whitespace-nowrap shrink-0 hover:border-[#C4A265] hover:text-[#C4A265] hover:bg-[rgba(196,162,101,0.06)] w-fit">
            Lees meer →
          </Link>
        </div>
      </div>
      </div>
      <div id="reviews" data-theme-color="#FAFAFA" data-theme-dark="false"><ReviewsSection /></div>
      <div id="faq" data-theme-color="#FAFAFA" data-theme-dark="false"><FAQ /></div>
    </>
    </div>
  )
}
