import Hero from '@/components/Hero'
import TechVsArtist from '@/components/TechVsArtist'
import EyeShapes from '@/components/EyeShapes'
import WhatIStandFor from '@/components/WhatIStandFor'
import BeforeAfter from '@/components/BeforeAfter'
import ComparisonTable from '@/components/ComparisonTable'
import MeetChiva from '@/components/MeetChiva'
import ReelsSection from '@/components/ReelsSection'
import AcademySection from '@/components/AcademySection'
import BookingSection from '@/components/BookingSection'
import ReviewsSection from '@/components/ReviewsSection'
import FAQ from '@/components/FAQ'
import Contact from '@/components/Contact'

export default function Home() {
  return (
    <>
      {/* 01 — Hero */}
      <Hero />

      {/* 02 — Lash Tech vs Lash Artist */}
      <TechVsArtist />

      {/* 03 — Eye Shapes */}
      <EyeShapes />

      {/* 04 — Waar ik voor sta */}
      <WhatIStandFor />

      {/* 05 — Before & After */}
      <BeforeAfter />

      {/* 06 — Meet Chiva */}
      <MeetChiva />

      {/* 07 — Reels & TikTok */}
      <ReelsSection />

      {/* 08 — Vergelijkingstabel */}
      <ComparisonTable />

      {/* 09 — Online + IRL */}
      <AcademySection />

      {/* 10 — Booking */}
      <BookingSection />

      {/* 11 — Reviews */}
      <ReviewsSection />

      {/* 12 — FAQ */}
      <FAQ />

      {/* 13 — Contact */}
      <Contact />
    </>
  )
}
