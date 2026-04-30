import Hero from '@/components/Hero'
import TechVsArtist from '@/components/TechVsArtist'
import WhatIStandFor from '@/components/WhatIStandFor'
import ComparisonTable from '@/components/ComparisonTable'
import BookingSection from '@/components/BookingSection'
import AcademySection from '@/components/AcademySection'
import ReviewsSection from '@/components/ReviewsSection'

export default function Home() {
  return (
    <>
      {/* 02 — Hero */}
      <Hero />

      {/* 03 — Lash Tech vs Lash Artist */}
      <TechVsArtist />

      {/* 04 — Waar ik voor sta */}
      <WhatIStandFor />

      {/* 05 — Vergelijkingstabel */}
      <ComparisonTable />

      {/* Booking */}
      <BookingSection />

      {/* Academy */}
      <AcademySection />

      {/* Reviews */}
      <ReviewsSection />
    </>
  )
}
