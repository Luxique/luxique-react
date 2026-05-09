'use client'

import AcademySection from '@/components/AcademySection'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function CoursesPage() {
  return (
    <>
      <Navbar />
      <main className="pt-[76px] px-[14px] max-[860px]:px-[10px] pb-[14px] max-[860px]:pb-[10px]">
        <AcademySection />
      </main>
      <Footer />
    </>
  )
}
