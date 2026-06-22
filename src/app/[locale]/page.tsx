import Hero from '@/components/Hero'
import TechVsArtist from '@/components/TechVsArtist'
import EyeShapes from '@/components/EyeShapes'
import Missie from '@/components/Missie'
import NietKopieren from '@/components/NietKopieren'
import Onderscheid from '@/components/Onderscheid'
import OnderscheidMobile from '@/components/OnderscheidMobile'
import BeforeAfter from '@/components/BeforeAfter'
import MeetChiva from '@/components/MeetChiva'
import ReelsSection from '@/components/ReelsSection'
import ComparisonTable from '@/components/ComparisonTable'
import AcademyHomeSection from '@/components/AcademyHomeSection'
import ReviewsSection from '@/components/ReviewsSection'
import FAQ from '@/components/FAQ'
import EmailConfirmHandler from '@/components/EmailConfirmHandler'
import Reveal from '@/components/Reveal'
export default function Home() {
  return (
    <div className="bg-[#F3EEE6] min-h-screen">
    <EmailConfirmHandler />
    <>
      <div id="hero" data-theme-color="#FAF8F4" data-theme-dark="false" className="relative w-full h-screen max-h-screen bg-[#F3EEE6] overflow-hidden pt-[72px] max-md:pt-[42px]">
        <Hero />
      </div>
      <div id="verschil" data-theme-color="#FAF8F4" data-theme-dark="false" className="my-[28px]"><TechVsArtist /></div>
      <Reveal><div id="meet-chiva" data-theme-color="#FFFFFF" data-theme-dark="false" className="my-[28px]"><MeetChiva /></div></Reveal>
      <Reveal><div id="creëren" data-theme-color="#F3EFE7" data-theme-dark="false" className="my-[28px]"><NietKopieren /></div></Reveal>
      <Reveal><div id="missie" data-theme-color="#FFFFFF" data-theme-dark="false" className="my-[28px]"><Missie /></div></Reveal>
      <Reveal><div className="my-[28px] ond-desktop-only"><Onderscheid /></div></Reveal>
      <OnderscheidMobile />
      <div className="ond-mob-overlay-target"><div id="oogvormen" data-theme-color="#FFFFFF" data-theme-dark="false" className="my-[28px] max-[860px]:my-0"><EyeShapes /></div></div>
      <Reveal><div id="behandelingen" data-theme-color="#FAFAFA" data-theme-dark="false" className="px-[14px] py-[28px] max-[860px]:px-[10px] max-[860px]:pt-0"><BeforeAfter /></div></Reveal>
      <Reveal><div id="reels" data-theme-color="#0e0b09" data-theme-dark="true" className="mt-[28px] mb-0 max-[860px]:my-0"><ReelsSection /></div></Reveal>
      <Reveal><div id="academy" data-theme-color="#0e0b09" data-theme-dark="true" style={{ background: 'radial-gradient(110% 70% at 50% -8%, rgba(176,141,79,.12), transparent 60%), linear-gradient(180deg, #0e0b09, #0e0b09 75%)', padding: 'clamp(20px,3vw,28px) 0' }}><div className="max-w-[1180px] mx-auto px-[28px]"><ComparisonTable theme="dark" /><AcademyHomeSection /></div></div></Reveal>
      <Reveal><div id="reviews" data-theme-color="#141210" data-theme-dark="true"><ReviewsSection /></div></Reveal>
      <Reveal><div id="faq" data-theme-color="#0b0908" data-theme-dark="true"><FAQ /></div></Reveal>
    </>
    </div>
  )
}
