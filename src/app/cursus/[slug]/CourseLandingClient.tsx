'use client'

import { useState, useEffect } from 'react'
import { REVIEWS } from '@/lib/reviews'
import './course-landing-v3.css'

interface Course {
  id: string
  title: string
  slug: string
  description?: string
  hero_badge_text?: string
  hero_title?: string
  hero_title_accent?: string
  hero_title_suffix?: string
  hero_tagline?: string
  hero_cta_text?: string
  hero_social_proof?: string
  hero_chips?: Array<{ icon: string; text: string }>
  hero_rating?: number
  hero_image_url?: string
  hero_mux_playback_id?: string
  differentiators_eyebrow?: string
  differentiators_title?: string
  differentiators?: Array<{ icon: string; title: string; body: string }>
  landing_blocks?: Array<LandingBlock>
  curriculum_eyebrow?: string
  curriculum_title?: string
  curriculum_intro?: string
  reviews_eyebrow?: string
  reviews_title?: string
  price_cents?: number
  access_duration_text?: string
  pricing_includes?: string[]
  final_cta_eyebrow?: string
  final_cta_title?: string
  final_cta_title_accent?: string
  final_cta_lead?: string
  final_cta_button_text?: string
}

interface Lesson {
  id: string
  title: string
  sort_order: number
  is_free: boolean
  duration_seconds: number
  what_you_learn_text?: string
}

interface LandingBlock {
  id: string
  type: string
  order: number
  data: Record<string, unknown>
}

export default function CourseLandingClient({ course, lessons }: { course: Course; lessons: Lesson[] }) {
  const [openLessonIndex, setOpenLessonIndex] = useState(0)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > window.innerHeight * 0.8)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Sort lessons by sort_order
  const sortedLessons = [...lessons].sort((a, b) => a.sort_order - b.sort_order)

  return (
    <div className="course-landing-v3 relative">
      {/* Moving gradient background */}
      <div className="fixed inset-0 -z-10">
        <div 
          className="absolute inset-0 animate-drift"
          style={{
            background: 'radial-gradient(circle at 20% 50%, rgba(196,162,101,0.3), transparent 50%), radial-gradient(circle at 80% 80%, rgba(250,248,244,0.15), transparent 50%), radial-gradient(circle at 40% 20%, rgba(196,162,101,0.2), transparent 50%)',
            filter: 'blur(40px)'
          }}
        />
        <div className="absolute inset-0 bg-[#0A0807]" />
      </div>
      
      
      {/* Hero Section */}
      <HeroSection course={course} />
      
      {/* Social Proof Logos */}
      <SocialProofLogos />
      
      {/* Differentiators */}
      <DifferentiatorsSection course={course} />
      
      {/* Flex Blocks */}
      {(course.landing_blocks || [])
        .filter(block => !['what_you_learn', 'testimonials'].includes(block.type))
        .sort((a, b) => a.order - b.order)
        .map(block => (
          <FlexBlockRenderer key={block.id} block={block} />
        ))}
      
      {/* Curriculum */}
      <CurriculumSection 
        course={course} 
        lessons={sortedLessons}
        openLessonIndex={openLessonIndex}
        setOpenLessonIndex={setOpenLessonIndex}
      />
      
      {/* Reviews */}
      <ReviewsSection course={course} />
      
      {/* Pricing */}
      <PricingSection course={course} />
      
      {/* FAQ */}
      <FAQSection />
      
      {/* Final CTA */}
      <FinalCTASection course={course} />
      
      {/* Sticky CTA */}
      <StickyCTA course={course} scrolled={scrolled} />
      
      {/* Footer */}
      <Footer />

      {/* Moving gradient animation */}
      <style jsx>{`
        @keyframes drift {
          0% {
            transform: translate(0, 0) rotate(0deg);
          }
          33% {
            transform: translate(-30px, -30px) rotate(120deg);
          }
          66% {
            transform: translate(20px, -60px) rotate(240deg);
          }
          100% {
            transform: translate(0, 0) rotate(360deg);
          }
        }
        .animate-drift {
          animation: drift 20s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

// Site Navigation Component
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function SiteNav({ _course }: { _course: Course }) {
  return (
    <nav className="fixed top-6 left-6 right-6 z-50 flex justify-between items-center">
      <div className="bg-[rgba(26,22,18,0.92)] backdrop-blur-[12px] border border-[rgba(250,248,244,0.08)] rounded-full px-4 py-3 text-[12px] text-[#FAF8F4]">
        ☰
      </div>
      <div className="bg-[rgba(26,22,18,0.92)] backdrop-blur-[12px] border border-[rgba(250,248,244,0.08)] rounded-full px-6 py-3 text-[14px] font-medium text-[#FAF8F4]">
        LUXIQUE
      </div>
      <div className="bg-[rgba(26,22,18,0.92)] backdrop-blur-[12px] border border-[rgba(250,248,244,0.08)] rounded-full px-4 py-3 text-[12px] text-[#FAF8F4]">
        👤
      </div>
    </nav>
  )
}

// Hero Section Component
function HeroSection({ course }: { course: Course }) {
  const heroTitle = course.hero_title || course.title || ''
  const heroAccent = course.hero_title_accent || ''
  const heroSuffix = course.hero_title_suffix || ''
  const heroChips = course.hero_chips || []

  // Split title by accent
  const titleParts = heroAccent ? heroTitle.split(heroAccent) : [heroTitle]

  return (
    <section className="min-h-screen flex items-center justify-center py-[120px]">
      <div className="max-w-[1240px] mx-auto px-6 w-full">
        <div className="relative">
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 rounded-[32px] overflow-hidden">
            <div 
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage: 'linear-gradient(rgba(196,162,101,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(196,162,101,0.04) 1px, transparent 1px)',
                backgroundSize: '60px 60px'
              }}
            />
            <div 
              className="absolute inset-0 rounded-[32px]"
              style={{
                background: 'linear-gradient(to bottom, rgba(10,8,7,0.1), rgba(10,8,7,0.4))'
              }}
            />
          </div>
          
          <div className="relative bg-[rgba(26,22,18,0.82)] backdrop-blur-[8px] rounded-[32px] border border-[rgba(250,248,244,0.08)] p-12 md:p-16">
            {course.hero_badge_text && (
              <div className="inline-flex items-center gap-2 bg-[rgba(196,162,101,0.10)] border border-[rgba(196,162,101,0.18)] rounded-full px-4 py-2 text-[12px] text-[#C4A265] mb-8">
                <span className="w-2 h-2 bg-[#C4A265] rounded-full"></span>
                {course.hero_badge_text}
              </div>
            )}
            
            <h1 className="text-[56px] md:text-[72px] leading-[1.1] mb-6">
              {titleParts[0]}
              {heroAccent && (
                <span 
                  className="font-['Cormorant_Garamond'] italic"
                  style={{
                    background: 'linear-gradient(180deg, #FAF8F4 0%, rgba(250,248,244,0.75) 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  {heroAccent}
                </span>
              )}
              {titleParts[1]}
              {heroSuffix && (
                <span 
                  className="font-['Cormorant_Garamond'] italic"
                  style={{
                    background: 'linear-gradient(180deg, #FAF8F4 0%, rgba(250,248,244,0.75) 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  {heroSuffix}
                </span>
              )}
            </h1>
            
            {course.hero_tagline && (
              <p className="text-[24px] text-[rgba(250,248,244,0.7)] mb-12">
                {course.hero_tagline}
              </p>
            )}
            
            {/* Hero Media */}
            <HeroMedia _course={course} />
            
            {/* Floating Chips */}
            {heroChips.length > 0 && (
              <div className="hidden md:block">
                {heroChips.slice(0, 4).map((chip, index) => (
                  <div 
                    key={index} 
                    className={`absolute bg-[rgba(26,22,18,0.92)] backdrop-blur-[12px] border border-[rgba(250,248,244,0.08)] rounded-full px-4 py-2 text-[12px] text-[#FAF8F4] ${
                      index === 0 ? '-top-4 -left-4' :
                      index === 1 ? '-top-4 -right-4' :
                      index === 2 ? '-bottom-4 -left-4' :
                      '-bottom-4 -right-4'
                    }`}
                  >
                    <span className="mr-2">{chip.icon}</span>
                    <span>{chip.text}</span>
                  </div>
                ))}
              </div>
            )}
            
            {/* Mobile chips */}
            {heroChips.length > 0 && (
              <div className="md:hidden flex flex-wrap gap-2 mb-8">
                {heroChips.slice(0, 4).map((chip, index) => (
                  <div 
                    key={index} 
                    className="bg-[rgba(26,22,18,0.92)] backdrop-blur-[12px] border border-[rgba(250,248,244,0.08)] rounded-full px-4 py-2 text-[12px] text-[#FAF8F4]"
                  >
                    <span className="mr-2">{chip.icon}</span>
                    <span>{chip.text}</span>
                  </div>
                ))}
              </div>
            )}
            
            {/* CTA Row */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <a href="#pricing" className="bg-[#C4A265] text-[#0A0807] px-8 py-3.5 rounded-full font-medium text-[14px] tracking-[0.02em] hover:bg-[#D4B57A] transition-all text-center">
                {course.hero_cta_text || 'Schrijf je in'} →
              </a>
              <a href="#curriculum" className="bg-[rgba(250,248,244,0.04)] text-[#FAF8F4] px-8 py-3.5 rounded-full border border-[rgba(250,248,244,0.08)] backdrop-blur-[10px] hover:border-[#C4A265] hover:text-[#C4A265] transition-all text-center">
                Bekijk programma
              </a>
            </div>
            
            {/* Social Proof */}
            {course.hero_social_proof && (
              <div className="flex items-center gap-4 text-[14px] text-[rgba(250,248,244,0.7)]">
                {course.hero_rating && <span>★★★★★ {course.hero_rating}/5</span>}
                <span>·</span>
                <span>{course.hero_social_proof}</span>
                <span>·</span>
                <span>Direct toegang</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

// Hero Media Component
function HeroMedia({ _course }: { _course: Course }) {
  return (
    <div className="relative my-12">
      <div className="aspect-video bg-[rgba(26,22,18,0.4)] border border-[rgba(250,248,244,0.08)] rounded-[22px] overflow-hidden">
        {(_course.hero_mux_playback_id || _course.hero_image_url) ? (
          <>
            {_course.hero_image_url && (
              <img 
                src={_course.hero_image_url} 
                alt="" 
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 bg-[#C4A265] rounded-full flex items-center justify-center text-[#0A0807] text-2xl">
                ▶
              </div>
            </div>
          </>
        ) : (
          <div className="w-full h-full bg-[rgba(196,162,101,0.1)] flex items-center justify-center text-[rgba(250,248,244,0.5)]">
            Video preview
          </div>
        )}
      </div>
    </div>
  )
}

// Social Proof Logos Component
function SocialProofLogos() {
  return (
    <section className="py-[120px]">
      <div className="max-w-[1240px] mx-auto px-6">
        <div className="text-center mb-8">
          <div className="text-[11px] tracking-[0.26em] uppercase text-[#C4A265] font-medium">
            — Vertrouwd door artists in heel Nederland —
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-4">
          <span className="bg-[rgba(250,248,244,0.06)] border border-[rgba(250,248,244,0.08)] rounded-[6px] px-4 py-2 text-[14px] text-[rgba(250,248,244,0.7)]">Bella Lashes</span>
          <span className="bg-[rgba(250,248,244,0.06)] border border-[rgba(250,248,244,0.08)] rounded-[6px] px-4 py-2 text-[14px] text-[rgba(250,248,244,0.7)]">Studio Vink</span>
          <span className="bg-[rgba(250,248,244,0.06)] border border-[rgba(250,248,244,0.08)] rounded-[6px] px-4 py-2 text-[14px] text-[rgba(250,248,244,0.7)]">Lash Atelier</span>
          <span className="bg-[rgba(250,248,244,0.06)] border border-[rgba(250,248,244,0.08)] rounded-[6px] px-4 py-2 text-[14px] text-[rgba(250,248,244,0.7)]">M. Beauty</span>
          <span className="bg-[rgba(250,248,244,0.06)] border border-[rgba(250,248,244,0.08)] rounded-[6px] px-4 py-2 text-[14px] text-[rgba(250,248,244,0.7)]">Eye Couture</span>
        </div>
      </div>
    </section>
  )
}

// Differentiators Section Component
function DifferentiatorsSection({ course }: { course: Course }) {
  if (!course.differentiators || course.differentiators.length === 0) {
    return null
  }

  return (
    <section className="py-[120px]">
      <div className="max-w-[1240px] mx-auto px-6">
        <div className="text-center mb-16">
          {course.differentiators_eyebrow && (
            <div className="text-[11px] tracking-[0.26em] uppercase text-[#C4A265] font-medium mb-4">
              — {course.differentiators_eyebrow} —
            </div>
          )}
          <h2 className="text-[42px] md:text-[48px] leading-[1.2] mb-4">
            {course.differentiators_title || 'Waarom Luxique'}
            <br />
            <span className="font-['Cormorant_Garamond'] italic text-[#C4A265]">anders is</span>
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {course.differentiators.map((item, index) => (
            <div key={index} className="bg-[rgba(26,22,18,0.55)] backdrop-blur-[8px] border border-[rgba(250,248,244,0.08)] rounded-[22px] p-8">
              <div className="h-[140px] rounded-[14px] bg-[radial-gradient(circle,rgba(196,162,101,0.25),transparent)] flex items-center justify-center mb-6">
                <div className="text-[48px] text-[#C4A265]">{item.icon}</div>
              </div>
              <h3 className="text-[24px] font-semibold text-[#FAF8F4] mb-4">{item.title}</h3>
              <p className="text-[16px] text-[rgba(250,248,244,0.7)] leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Curriculum Section Component
function CurriculumSection({ 
  course, 
  lessons, 
  openLessonIndex, 
  setOpenLessonIndex 
}: { 
  course: Course
  lessons: Lesson[]
  openLessonIndex: number
  setOpenLessonIndex: (index: number) => void
}) {
  if (lessons.length === 0) {
    return null
  }

  return (
    <section className="py-[120px]" id="curriculum">
      <div className="max-w-[1240px] mx-auto px-6">
        <div className="text-center mb-16">
          {course.curriculum_eyebrow && (
            <div className="text-[11px] tracking-[0.26em] uppercase text-[#C4A265] font-medium mb-4">
              — {course.curriculum_eyebrow} —
            </div>
          )}
          <h2 className="text-[42px] md:text-[48px] leading-[1.2] mb-4">
            Wat ga je <span className="font-['Cormorant_Garamond'] italic text-[#C4A265]">leren</span>
          </h2>
          {course.curriculum_intro && (
            <p className="text-[18px] text-[rgba(250,248,244,0.7)] max-w-2xl mx-auto">
              {course.curriculum_intro}
            </p>
          )}
        </div>
        
        <div className="bg-[rgba(26,22,18,0.6)] backdrop-blur-[8px] border border-[rgba(250,248,244,0.08)] rounded-[22px] overflow-hidden">
          {lessons.map((lesson, index) => (
            <div 
              key={lesson.id}
              className={`border-b border-[rgba(250,248,244,0.08)] last:border-b-0 ${
                index === openLessonIndex ? 'bg-[rgba(196,162,101,0.05)]' : ''
              }`}
            >
              <div 
                className="flex items-center gap-5 p-5 cursor-pointer"
                onClick={() => setOpenLessonIndex(index === openLessonIndex ? -1 : index)}
              >
                <div className="font-['Cormorant_Garamond'] italic text-[#C4A265] text-[22px]">
                  {String(lesson.sort_order + 1).padStart(2, '0')}
                </div>
                <div className="flex-1">
                  <h4 className="text-[18px] font-medium text-[#FAF8F4]">{lesson.title}</h4>
                  <div className="flex items-center gap-2 text-[14px] text-[rgba(250,248,244,0.5)]">
                    {lesson.duration_seconds && (
                      <span>{Math.round(lesson.duration_seconds / 60)} minuten</span>
                    )}
                    {lesson.duration_seconds && <span>·</span>}
                    <span>Video</span>
                  </div>
                </div>
                {lesson.is_free ? (
                  <span className="bg-[rgba(196,162,101,0.14)] text-[#C4A265] px-3 py-1 rounded-full text-[10px] tracking-[0.16em] uppercase border border-[rgba(196,162,101,0.18)]">
                    Gratis Preview
                  </span>
                ) : (
                  <span className="text-[20px]">🔒</span>
                )}
                <span className="text-[24px] text-[rgba(250,248,244,0.5)]">
                  {index === openLessonIndex ? '−' : '+'}
                </span>
              </div>
              
              {lesson.what_you_learn_text && index === openLessonIndex && (
                <div className="px-5 pb-5">
                  <p className="text-[14px] text-[rgba(250,248,244,0.6)]">
                    {lesson.what_you_learn_text}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Reviews Section Component
function ReviewsSection({ course }: { course: Course }) {
  // Get 6 newest reviews (sorted by date logic - using first 6 for now)
  const displayReviews = REVIEWS.slice(0, 6)

  return (
    <section className="py-[120px]">
      <div className="max-w-[1240px] mx-auto px-6">
        <div className="text-center mb-16">
          {course.reviews_eyebrow && (
            <div className="text-[11px] tracking-[0.26em] uppercase text-[#C4A265] font-medium mb-4">
              — {course.reviews_eyebrow} —
            </div>
          )}
          <h2 className="text-[42px] md:text-[48px] leading-[1.2] mb-4">
            Verhalen van<br />onze <span className="font-['Cormorant_Garamond'] italic text-[#C4A265]">artists</span>
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayReviews.map((review, index) => (
            <div key={index} className="bg-[rgba(26,22,18,0.55)] backdrop-blur-[8px] border border-[rgba(250,248,244,0.08)] rounded-[22px] p-8">
              <div className="text-[#C4A265] mb-4">
                {'★'.repeat(review.stars)}
              </div>
              <blockquote className="text-[16px] text-[rgba(250,248,244,0.9)] leading-relaxed mb-6">
                {review.text.length > 150 
                  ? `${review.text.substring(0, 150)}...` 
                  : review.text
                }
              </blockquote>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-[#FAF8F4] font-medium" style={{ background: review.color }}>
                  {review.initials}
                </div>
                <div>
                  <div className="text-[16px] font-medium text-[#FAF8F4]">{review.name}</div>
                  <div className="text-[14px] text-[rgba(250,248,244,0.6)]">Lash Artist</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Pricing Section Component
function PricingSection({ course }: { course: Course }) {
  if (!course.price_cents) {
    return null
  }

  const priceEuros = course.price_cents / 100

  const includesList = course.pricing_includes || [
    '8 modules · 4 uur video',
    'Persoonlijke feedback van Chiva',
    '12 maanden toegang & updates',
    'Certificaat bij afronding',
    'Eindtoets en quizzen',
    '14 dagen niet-goed-geld-terug'
  ]

  return (
    <section className="py-[120px]" id="pricing">
      <div className="max-w-[1240px] mx-auto px-6">
        <div className="text-center mb-16">
          <div className="text-[11px] tracking-[0.26em] uppercase text-[#C4A265] font-medium mb-4">
            — Investering —
          </div>
          <h2 className="text-[42px] md:text-[48px] leading-[1.2] mb-4">
            Eén <span className="font-['Cormorant_Garamond'] italic text-[#C4A265]">prijs</span><br />
            volledige toegang
          </h2>
          <p className="text-[18px] text-[rgba(250,248,244,0.7)] max-w-2xl mx-auto">
            Geen abonnement. Geen verborgen kosten. Direct beginnen.
          </p>
        </div>
        
        <div className="max-w-md mx-auto">
          <div className="bg-[rgba(26,22,18,0.65)] backdrop-blur-[10px] border border-[rgba(196,162,101,0.18)] rounded-[32px] p-12 text-center">
            <div className="text-[11px] tracking-[0.26em] uppercase text-[#C4A265] font-medium mb-4">
              Medusa Lash Basics
            </div>
            <h3 className="text-[24px] font-medium text-[#FAF8F4] mb-8">Word een echte lash artist</h3>
            
            <div className="font-['Cormorant_Garamond'] italic text-[72px] text-[#C4A265] mb-4">
              <span className="text-[38px] align-super">€</span>
              {Math.floor(priceEuros)}
            </div>
            
            <div className="text-[14px] text-[rgba(250,248,244,0.7)] mb-8">
              Eenmalige betaling · {course.access_duration_text || '12 maanden toegang'}
            </div>
            
            <div className="text-left mb-8">
              {includesList.map((item, index) => (
                <div key={index} className="flex items-center gap-3 mb-3">
                  <span className="text-[#C4A265]">✓</span>
                  <span className="text-[16px] text-[rgba(250,248,244,0.8)]">{item}</span>
                </div>
              ))}
            </div>
            
            <a href="#" className="bg-[#C4A265] text-[#0A0807] px-8 py-3.5 rounded-full font-medium text-[14px] tracking-[0.02em] hover:bg-[#D4B57A] transition-all inline-block w-full">
              Schrijf je nu in →
            </a>
            
            <div className="flex justify-center gap-3 mt-8 mb-4">
              <span className="bg-[rgba(250,248,244,0.06)] border border-[rgba(250,248,244,0.08)] rounded-[6px] px-3 py-1 text-[10px] text-[rgba(250,248,244,0.7)]">VISA</span>
              <span className="bg-[rgba(250,248,244,0.06)] border border-[rgba(250,248,244,0.08)] rounded-[6px] px-3 py-1 text-[10px] text-[rgba(250,248,244,0.7)]">Mastercard</span>
              <span className="bg-[rgba(250,248,244,0.06)] border border-[rgba(250,248,244,0.08)] rounded-[6px] px-3 py-1 text-[10px] text-[rgba(250,248,244,0.7)]">iDEAL</span>
              <span className="bg-[rgba(250,248,244,0.06)] border border-[rgba(250,248,244,0.08)] rounded-[6px] px-3 py-1 text-[10px] text-[rgba(250,248,244,0.7)]">Apple Pay</span>
              <span className="bg-[rgba(250,248,244,0.06)] border border-[rgba(250,248,244,0.08)] rounded-[6px] px-3 py-1 text-[10px] text-[rgba(250,248,244,0.7)]">Klarna</span>
            </div>
            
            <div className="text-[12px] text-[rgba(250,248,244,0.5)]">
              Veilig betalen via Stripe
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// FAQ Section Component
function FAQSection() {
  const faqItems = [
    {
      question: 'Hoe lang heb ik toegang tot de cursus?',
      answer: 'Levenslang. Zodra je je inschrijft heb je permanent toegang tot alle modules, inclusief toekomstige updates.'
    },
    {
      question: 'Krijg ik persoonlijke feedback van Chiva?',
      answer: 'Ja. Je kan je werk uploaden voor review en Chiva kijkt het persoonlijk na. Dit is geen anonieme cursus.'
    },
    {
      question: 'Heb ik al ervaring nodig om te starten?',
      answer: 'Nee. Medusa Lash Basics start bij de absolute basis. Motivatie en geduld zijn wel handig.'
    },
    {
      question: 'Kan ik in termijnen betalen?',
      answer: 'Ja. Via Klarna kan je in 3 termijnen betalen zonder extra kosten. Direct toegang na eerste betaling.'
    },
    {
      question: 'Krijg ik een certificaat?',
      answer: 'Ja. Na het succesvol afronden van de eindtoets ontvang je een Luxique Academy certificaat.'
    }
  ]

  const [openIndex, setOpenIndex] = useState(0)

  return (
    <section className="py-[120px]">
      <div className="max-w-[1240px] mx-auto px-6">
        <div className="text-center mb-16">
          <div className="text-[11px] tracking-[0.26em] uppercase text-[#C4A265] font-medium mb-4">
            — Veelgestelde vragen —
          </div>
          <h2 className="text-[42px] md:text-[48px] leading-[1.2]">
            Goed om <span className="font-['Cormorant_Garamond'] italic text-[#C4A265]">te weten</span>
          </h2>
        </div>
        
        <div className="max-w-2xl mx-auto">
          {faqItems.map((item, index) => (
            <div 
              key={index}
              className={`bg-[rgba(26,22,18,0.55)] backdrop-blur-[8px] border border-[rgba(250,248,244,0.08)] rounded-[22px] mb-4 overflow-hidden ${
                index === openIndex ? 'ring-1 ring-[rgba(196,162,101,0.3)]' : ''
              }`}
            >
              <div 
                className="flex justify-between items-center p-6 cursor-pointer"
                onClick={() => setOpenIndex(index === openIndex ? -1 : index)}
              >
                <span className="text-[16px] font-medium text-[#FAF8F4]">{item.question}</span>
                <span className="text-[24px] text-[rgba(250,248,244,0.5)]">
                  {index === openIndex ? '−' : '+'}
                </span>
              </div>
              {index === openIndex && (
                <div className="px-6 pb-6">
                  <p className="text-[16px] text-[rgba(250,248,244,0.7)] leading-relaxed">
                    {item.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Final CTA Section Component
function FinalCTASection({ course }: { course: Course }) {
  return (
    <section className="py-[120px]">
      <div className="max-w-[1240px] mx-auto px-6">
        <div className="relative">
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 rounded-[32px] overflow-hidden">
            <div 
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage: 'linear-gradient(rgba(196,162,101,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(196,162,101,0.04) 1px, transparent 1px)',
                backgroundSize: '60px 60px'
              }}
            />
            <div 
              className="absolute inset-0 rounded-[32px]"
              style={{
                background: 'linear-gradient(to bottom, rgba(10,8,7,0.1), rgba(10,8,7,0.4))'
              }}
            />
          </div>
          
          <div className="relative bg-[rgba(26,22,18,0.82)] backdrop-blur-[8px] rounded-[32px] border border-[rgba(250,248,244,0.08)] p-16 text-center">
            {course.final_cta_eyebrow && (
              <div className="text-[11px] tracking-[0.26em] uppercase text-[#C4A265] font-medium mb-4">
                — {course.final_cta_eyebrow} —
              </div>
            )}
            <h2 className="text-[42px] md:text-[48px] leading-[1.2] mb-6">
              {course.final_cta_title || 'Begin vandaag aan je'}
              <br />
              <span 
                className="font-['Cormorant_Garamond'] italic"
                style={{
                  background: 'linear-gradient(180deg, #FAF8F4 0%, rgba(250,248,244,0.75) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                {course.final_cta_title_accent || 'reis als artist'}
              </span>
            </h2>
            {course.final_cta_lead && (
              <p className="text-[18px] text-[rgba(250,248,244,0.7)] mb-8 max-w-2xl mx-auto">
                {course.final_cta_lead}
              </p>
            )}
            <a href="#pricing" className="bg-[#C4A265] text-[#0A0807] px-8 py-4 rounded-full font-medium text-[16px] tracking-[0.02em] hover:bg-[#D4B57A] transition-all inline-block">
              {course.final_cta_button_text || 'Schrijf je nu in'} →
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

// Sticky CTA Component
function StickyCTA({ course, scrolled }: { course: Course; scrolled: boolean }) {
  if (!scrolled) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0A0807]/95 backdrop-blur-xl border-t border-[rgba(196,162,101,0.18)] px-6 py-4">
      <div className="max-w-[1240px] mx-auto flex items-center justify-between">
        <div>
          <div className="text-[18px] font-medium text-[#FAF8F4]">{course.title}</div>
          <div className="text-[12px] text-[rgba(250,248,244,0.7)]">LUXIQUE ACADEMY</div>
        </div>
        <a href="#pricing" className="bg-[#C4A265] text-[#0A0807] px-8 py-3.5 rounded-full font-medium text-[14px] tracking-[0.02em] hover:bg-[#D4B57A] transition-all">
          {course.hero_cta_text || 'Schrijf je in'} →
        </a>
      </div>
    </div>
  )
}

// Footer Component
function Footer() {
  return (
    <footer className="py-[120px]">
      <div className="max-w-[1240px] mx-auto px-6 text-center">
        <div className="text-[24px] font-medium text-[#FAF8F4] mb-4">LUXIQUE</div>
        <p className="text-[16px] text-[rgba(250,248,244,0.7)] mb-4">Eerst begrijpen, dan doen.</p>
        <p className="text-[11px] text-[rgba(250,248,244,0.5)] tracking-[0.1em]">
          © LUXIQUE ACADEMY · 2026
        </p>
      </div>
    </footer>
  )
}

// Flex Block Renderer
function FlexBlockRenderer({ block }: { block: LandingBlock }) {
  const d = block.data as Record<string, unknown>

  switch (block.type) {
    case 'founder_story':
      return <FounderStoryBlock data={d} />
    
    case 'pain_points':
      return <PainPointsBlock data={d} />
    
    case 'quote':
      return <QuoteBlock data={d} />
    
    case 'rich_text':
      return <RichTextBlock data={d} />
    
    case 'image_text':
      return <ImageTextBlock data={d} />
    
    case 'video_caption':
      return <VideoCaptionBlock data={d} />
    
    default:
      return null
  }
}

// Founder Story Block
function FounderStoryBlock({ data }: { data: Record<string, unknown> }) {
  const photo_url = data.photo_url as string | undefined
  const eyebrow = data.eyebrow as string | undefined
  const title = data.title as string | undefined
  const body_html = data.body_html as string | undefined
  const quote = data.quote as string | undefined
  
  return (
    <section className="py-[120px]">
      <div className="max-w-[1240px] mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {photo_url && (
            <div 
              className="aspect-[4/3] bg-[rgba(26,22,18,0.4)] border border-[rgba(250,248,244,0.08)] rounded-[22px] overflow-hidden"
              style={{ backgroundImage: `url(${photo_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
            />
          )}
          <div className={photo_url ? '' : 'lg:col-span-2'}>
            {eyebrow && (
              <div className="text-[11px] tracking-[0.26em] uppercase text-[#C4A265] font-medium mb-4">
                — {eyebrow} —
              </div>
            )}
            {title && (
              <h2 className="text-[36px] md:text-[42px] leading-[1.2] mb-6 text-[#FAF8F4]">
                {title}
              </h2>
            )}
            {body_html && (
              <div 
                className="text-[16px] text-[rgba(250,248,244,0.7)] leading-relaxed mb-6 prose prose-invert"
                dangerouslySetInnerHTML={{ __html: body_html }} 
              />
            )}
            {quote && (
              <blockquote className="text-[20px] font-['Cormorant_Garamond'] italic text-[#C4A265] border-l-2 border-[#C4A265] pl-4">
                &ldquo;{quote}&rdquo;
              </blockquote>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

// Pain Points Block
function PainPointsBlock({ data }: { data: Record<string, unknown> }) {
  const points = (data.points as string[]) || []
  const eyebrow = data.eyebrow as string | undefined
  const title = data.title as string | undefined

  return (
    <section className="py-[120px]">
      <div className="max-w-[1240px] mx-auto px-6">
        <div className="text-center mb-16">
          {eyebrow && (
            <div className="text-[11px] tracking-[0.26em] uppercase text-[#C4A265] font-medium mb-4">
              — {eyebrow} —
            </div>
          )}
          {title && (
            <h2 className="text-[36px] md:text-[42px] leading-[1.2] mb-4 text-[#FAF8F4]">
              {title}
            </h2>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {points.map((point: string, index: number) => (
            <div key={index} className="bg-[rgba(26,22,18,0.55)] backdrop-blur-[8px] border border-[rgba(250,248,244,0.08)] rounded-[22px] p-6 text-[16px] text-[#FAF8F4]">
              {point}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Quote Block
function QuoteBlock({ data }: { data: Record<string, unknown> }) {
  const quote = data.quote as string | undefined
  const attribution = data.attribution as string | undefined
  
  return (
    <section className="py-[120px]">
      <div className="max-w-[1240px] mx-auto px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-[11px] tracking-[0.26em] uppercase text-[#C4A265] font-medium mb-8">
            — Inspiratie —
          </div>
          <blockquote className="text-[32px] md:text-[42px] leading-[1.2] font-['Cormorant_Garamond'] italic text-[#FAF8F4] mb-8">
            &ldquo;{quote}&rdquo;
          </blockquote>
          {attribution && (
            <div className="text-[18px] text-[rgba(250,248,244,0.7)">— {attribution}</div>
          )}
        </div>
      </div>
    </section>
  )
}

// Rich Text Block
function RichTextBlock({ data }: { data: Record<string, unknown> }) {
  const eyebrow = data.eyebrow as string | undefined
  const title = data.title as string | undefined
  const body_html = data.body_html as string | undefined
  
  return (
    <section className="py-[120px]">
      <div className="max-w-[1240px] mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            {eyebrow && (
              <div className="text-[11px] tracking-[0.26em] uppercase text-[#C4A265] font-medium mb-4">
                — {eyebrow} —
              </div>
            )}
            {title && (
              <h2 className="text-[36px] md:text-[42px] leading-[1.2] mb-4 text-[#FAF8F4]">
                {title}
              </h2>
            )}
          </div>
          
          <div className="text-[16px] text-[rgba(250,248,244,0.7)] leading-relaxed prose prose-invert max-w-none">
            {body_html && (
              <div dangerouslySetInnerHTML={{ __html: body_html }} />
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

// Image Text Block
function ImageTextBlock({ data }: { data: Record<string, unknown> }) {
  const imageSide = (data.image_side as string) === 'right' ? 'reverse' : ''
  const image_url = data.image_url as string | undefined
  const eyebrow = data.eyebrow as string | undefined
  const title = data.title as string | undefined
  const body_html = data.body_html as string | undefined

  return (
    <section className="py-[120px]">
      <div className="max-w-[1240px] mx-auto px-6">
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${
          imageSide === 'reverse' ? 'lg:flex-row-reverse' : ''
        }`}>
          {image_url && (
            <div 
              className="aspect-[4/3] bg-[rgba(26,22,18,0.4)] border border-[rgba(250,248,244,0.08)] rounded-[22px] overflow-hidden"
              style={{ backgroundImage: `url(${image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
            />
          )}
          <div className={image_url ? '' : 'lg:col-span-2'}>
            {eyebrow && (
              <div className="text-[11px] tracking-[0.26em] uppercase text-[#C4A265] font-medium mb-4">
                — {eyebrow} —
              </div>
            )}
            {title && (
              <h2 className="text-[36px] md:text-[42px] leading-[1.2] mb-6 text-[#FAF8F4]">
                {title}
              </h2>
            )}
            {body_html && (
              <div 
                className="text-[16px] text-[rgba(250,248,244,0.7)] leading-relaxed prose prose-invert"
                dangerouslySetInnerHTML={{ __html: body_html }} />
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

// Video Caption Block
function VideoCaptionBlock({ data }: { data: Record<string, unknown> }) {
  const video_url = data.video_url as string | undefined
  const thumbnail_url = data.thumbnail_url as string | undefined
  const caption = data.caption as string | undefined
  
  return (
    <section className="py-[120px]">
      <div className="max-w-[1240px] mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          {video_url && (
            <div className="aspect-video bg-[rgba(26,22,18,0.4)] border border-[rgba(250,248,244,0.08)] rounded-[22px] overflow-hidden mb-6">
              <video controls poster={thumbnail_url} className="w-full h-full">
                <source src={video_url} type="video/mp4" />
              </video>
            </div>
          )}
          {caption && (
            <div className="text-[14px] text-[rgba(250,248,244,0.6)] text-center">
              {caption}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}