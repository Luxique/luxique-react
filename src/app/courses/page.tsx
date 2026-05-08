'use client'

import AcademySection from '@/components/AcademySection'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function CoursesPage() {
  return (
    <>
      <Navbar />
      <main className="pt-[76px]">
        <AcademySection />
      </main>
      <Footer />
    </>
  )
}
