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
      {/* Full-viewport hero — dark bg bleeds behind navbar */}
      <div className="relative w-full h-screen bg-[#0C0A07] overflow-hidden">
        <div className="absolute inset-0 pt-[76px] px-[14px] max-md:px-[10px] pb-[14px] max-md:pb-[10px] -mt-[76px] flex flex-col gap-[14px] max-md:gap-[10px]">
          <Hero />
        </div>
      </div>
      <TechVsArtist />
      <EyeShapes />
      <WhatIStandFor />
      <BeforeAfter />
      <MeetChiva />
      <ReelsSection />
      <ComparisonTable />
      <AcademySection />
      <ReviewsSection />
      <FAQ />
    </>
  )
}
