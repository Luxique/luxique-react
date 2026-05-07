import Hero from '@/components/Hero'
import TechVsArtist from '@/components/TechVsArtist'
import EyeShapes from '@/components/EyeShapes'
import Missie from '@/components/Missie'
import BeforeAfter from '@/components/BeforeAfter'
import ComparisonTable from '@/components/ComparisonTable'
import MeetChiva from '@/components/MeetChiva'
import ReelsSection from '@/components/ReelsSection'
import AcademySection from '@/components/AcademySection'
import ReviewsSection from '@/components/ReviewsSection'
import FAQ from '@/components/FAQ'

export default function Home() {
  return (
    <>
      <div id="hero" data-theme-color="#0C0A07" data-theme-dark="true" className="relative w-full h-screen max-h-screen bg-[#0C0A07] overflow-hidden">
        <Hero />
      </div>
      <div id="verschil" data-theme-color="#FAF8F4" data-theme-dark="false"><TechVsArtist /></div>
      <div id="meet-chiva" data-theme-color="#FFFFFF" data-theme-dark="false" className="mt-[14px]"><MeetChiva /></div>
      <div id="oogvormen" data-theme-color="#FFFFFF" data-theme-dark="false"><EyeShapes /></div>
      <div id="missie" data-theme-color="#FFFFFF" data-theme-dark="false"><Missie /></div>
      <div id="behandelingen" data-theme-color="#FAFAFA" data-theme-dark="false"><BeforeAfter /></div>
      <div id="reels" data-theme-color="#1C1812" data-theme-dark="true"><ReelsSection /></div>
      <div id="academy" data-theme-color="#FAFAFA" data-theme-dark="false"><ComparisonTable /><AcademySection /></div>
      <div id="reviews" data-theme-color="#FAFAFA" data-theme-dark="false"><ReviewsSection /></div>
      <div id="faq" data-theme-color="#FAFAFA" data-theme-dark="false"><FAQ /></div>
    </>
  )
}
