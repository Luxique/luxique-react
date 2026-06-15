import Hero from '@/components/Hero'
import TechVsArtist from '@/components/TechVsArtist'
import EyeShapes from '@/components/EyeShapes'
import Missie from '@/components/Missie'
import NietKopieren from '@/components/NietKopieren'
import Onderscheid from '@/components/Onderscheid'
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
      <div id="hero" data-theme-color="#FAF8F4" data-theme-dark="false" className="relative w-full h-screen max-h-screen bg-[#F3EEE6] overflow-hidden pt-[66px] max-md:pt-[58px]">
        <Hero />
      </div>
      <div id="verschil" data-theme-color="#FAF8F4" data-theme-dark="false"><TechVsArtist /></div>
      <Reveal><div id="meet-chiva" data-theme-color="#FFFFFF" data-theme-dark="false" className="mt-[14px]"><MeetChiva /></div></Reveal>
      <Reveal><div id="creëren" data-theme-color="#F3EFE7" data-theme-dark="false"><NietKopieren /></div></Reveal>
      <Reveal><div id="missie" data-theme-color="#FFFFFF" data-theme-dark="false" className="mt-[14px]"><Missie /></div></Reveal>
      <Reveal><Onderscheid /></Reveal>
      <Reveal><div id="oogvormen" data-theme-color="#FFFFFF" data-theme-dark="false"><EyeShapes /></div></Reveal>
      <Reveal><div id="behandelingen" data-theme-color="#FAFAFA" data-theme-dark="false" className="px-[14px] pt-[14px] max-[860px]:px-[10px] max-[860px]:pt-[10px]"><BeforeAfter /></div></Reveal>
      <Reveal><div id="reels" data-theme-color="#FAF8F4" data-theme-dark="false"><ReelsSection /></div></Reveal>
      <Reveal><div id="academy" data-theme-color="#15110e" data-theme-dark="true" style={{ background: 'radial-gradient(110% 70% at 50% -8%, rgba(176,141,79,.12), transparent 60%), linear-gradient(180deg, #201b17, #0e0b09 75%)', borderRadius: '22px', padding: 'clamp(20px,3vw,28px)', marginTop: '14px' }}><ComparisonTable /><AcademyHomeSection /></div></Reveal>
      <Reveal><div id="reviews" data-theme-color="#FAFAFA" data-theme-dark="false"><ReviewsSection /></div></Reveal>
      <Reveal><div id="faq" data-theme-color="#FAFAFA" data-theme-dark="false"><FAQ /></div></Reveal>
    </>
    </div>
  )
}
