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
      {/* Full-viewport hero — dark bg with padding top for navbar space */}
      <div className="relative w-full h-screen max-h-screen bg-[#0C0A07] overflow-hidden">
        <div className="absolute inset-0 pt-[76px] max-md:pt-[72px] p-[20px_14px_14px_14px] max-md:p-[16px_10px_10px_10px] flex flex-col gap-[14px] max-md:gap-[10px]">
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
