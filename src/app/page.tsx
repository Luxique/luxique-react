import Hero from '@/components/Hero'
import TechVsArtist from '@/components/TechVsArtist'
import EyeShapes from '@/components/EyeShapes'
import WhatIStandFor from '@/components/WhatIStandFor'
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
      <div id="hero" data-theme-color="#0C0A07" className="relative w-full h-screen max-h-screen bg-[#0C0A07] overflow-hidden -mt-[80px] max-md:-mt-[72px] pt-[80px] max-md:pt-[72px]">
        <Hero />
      </div>
      <div id="verschil" data-theme-color="#FFFFFF"><TechVsArtist /></div>
      <div id="oogvormen" data-theme-color="#FFFFFF"><EyeShapes /></div>
      <div id="missie" data-theme-color="#FFFFFF"><WhatIStandFor /></div>
      <div id="behandelingen" data-theme-color="#FAFAFA"><BeforeAfter /></div>
      <div id="meet-chiva" data-theme-color="#FFFFFF"><MeetChiva /></div>
      <div id="reels" data-theme-color="#1C1812"><ReelsSection /></div>
      <div id="academy" data-theme-color="#FAFAFA"><ComparisonTable /><AcademySection /></div>
      <div id="reviews" data-theme-color="#FAFAFA"><ReviewsSection /></div>
      <div id="faq" data-theme-color="#FAFAFA"><FAQ /></div>
    </>
  )
}
