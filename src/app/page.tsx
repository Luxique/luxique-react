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
      <Hero />
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
