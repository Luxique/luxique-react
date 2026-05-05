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
      {/* Full-viewport hero — negative margin pulls it behind the sticky navbar */}
      <div className="relative w-full h-screen max-h-screen bg-[#0C0A07] overflow-hidden -mt-[80px] max-md:-mt-[72px] pt-[80px] max-md:pt-[72px]">
        <Hero />
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
