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

export default function Home() {
  return (
    <div className="bg-[#F3EEE6] min-h-screen">
    <EmailConfirmHandler />
    <>
      <div id="hero" data-theme-color="#FAF8F4" data-theme-dark="false" className="relative w-full h-screen max-h-screen bg-[#F3EEE6] overflow-hidden">
        <Hero />
      </div>
      <div id="verschil" data-theme-color="#FAF8F4" data-theme-dark="false"><TechVsArtist /></div>
      <div id="meet-chiva" data-theme-color="#FFFFFF" data-theme-dark="false" className="mt-[14px]"><MeetChiva /></div>
      <div id="missie" data-theme-color="#FFFFFF" data-theme-dark="false" className="px-[14px] pb-[14px] max-[860px]:px-[10px] max-[860px]:pb-[10px]"><Missie /></div>
      <div id="oogvormen" data-theme-color="#FFFFFF" data-theme-dark="false"><EyeShapes /></div>
      <div id="behandelingen" data-theme-color="#FAFAFA" data-theme-dark="false" className="px-[14px] pt-[14px] max-[860px]:px-[10px] max-[860px]:pt-[10px]"><BeforeAfter /></div>
      <div id="reels" data-theme-color="#FAF8F4" data-theme-dark="false"><ReelsSection /></div>
      <div id="academy" data-theme-color="#FAFAFA" data-theme-dark="false"><ComparisonTable /><AcademyHomeSection /></div>
      <div id="reviews" data-theme-color="#FAFAFA" data-theme-dark="false"><ReviewsSection /></div>
      <div id="faq" data-theme-color="#FAFAFA" data-theme-dark="false"><FAQ /></div>
    </>
    </div>
  )
}
