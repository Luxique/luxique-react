'use client'

import { useState } from 'react'
import type { Review } from '@/lib/reviews'
import LuxiqueMuxPlayer from '@/components/LuxiqueMuxPlayer'
import AmbientGlow from '@/components/AmbientGlow'
// CRITICAL: do not remove — course landing styles. If missing = unstyled page.
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

export default function CourseLandingClient({ 
  course, 
  lessons, 
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  reviews = [],
  previewMode = false 
}: { 
  course: Course; 
  lessons: Lesson[];
  reviews?: Review[];
  previewMode?: boolean;
}) {
  const [openLessonIndex, setOpenLessonIndex] = useState(0)


  // Sort lessons by sort_order
  const sortedLessons = [...lessons].sort((a, b) => a.sort_order - b.sort_order)

  return (
    <div className="course-landing-v3">
      {/* Moving gradient blobs */}
      {!previewMode && <div className="gradient-bg" />}
      {!previewMode && <div className="gradient-bg-2" />}
      {!previewMode && <div className="gradient-bg-3" />}
      
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
      <ReviewsSection course={course} reviews={reviews} />
      
      {/* Pricing */}
      <PricingSection course={course} />
      
      {/* FAQ */}
      <FAQSection />
      
      {/* Final CTA */}
      <FinalCTASection course={course} />
    </div>
  )
}

// Site Navigation Component
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function SiteNav({ _course }: { _course: Course }) {
  return (
    <nav className="site-nav">
      <div className="nav-pill menu">☰</div>
      <div className="nav-pill logo">LUXIQUE</div>
      <div className="nav-pill user">👤</div>
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
    <section className="hero-box section-glow-wrap">
      <AmbientGlow color="gold" position="top-left" intensity="medium" />
      <AmbientGlow color="green" position="bottom-right" intensity="subtle" />
      <div className="hero-content">
        {course.hero_badge_text && (
          <span className="badge-top">
            <span className="dot" />
            {course.hero_badge_text}
          </span>
        )}
        
        <h1>
          {titleParts[0]}
          {heroAccent && <span className="serif-accent">{heroAccent}</span>}
          {titleParts[1]}
          {heroSuffix && <span className="serif-accent">{heroSuffix}</span>}
        </h1>
        
        {course.hero_tagline && (
          <p className="tagline">{course.hero_tagline}</p>
        )}
        
        {/* Hero Media */}
        <HeroMedia _course={course} />
        
        {/* Floating Chips */}
        {heroChips.length > 0 && (
          <div className="float-chip-wrap">
            {heroChips.slice(0, 4).map((chip, index) => (
              <div 
                key={index} 
                className={`float-chip ${['tl', 'tr', 'bl', 'br'][index]}`}
              >
                <span className="chip-icon">{chip.icon}</span>
                <span>{chip.text}</span>
              </div>
            ))}
          </div>
        )}
        
        {/* CTA Row */}
        <div className="cta-row">
          <a href="#pricing" className="btn-primary">
            <span className="flow" />
            <span>{course.hero_cta_text || 'Schrijf je in'} →</span>
          </a>
          <a href="#curriculum" className="btn-outline">
            Bekijk programma
          </a>
        </div>
        
        {/* Social Proof */}
        {course.hero_social_proof && (
          <div className="price-meta">
            {course.hero_rating && <span>★★★★★ {course.hero_rating}/5</span>}
            <span>·</span>
            <span>{course.hero_social_proof}</span>
            <span>·</span>
            <span>Direct toegang</span>
          </div>
        )}
      </div>
    </section>
  )
}

// Hero Media Component
function HeroMedia({ _course }: { _course: Course }) {
  return (
    <div className="hero-media-wrap">
      <div className="hero-media">
        {_course.hero_mux_playback_id ? (
          <LuxiqueMuxPlayer
            playbackId={_course.hero_mux_playback_id}
            variant="hero"
            title={_course.title || 'Hero video'}
            style={{ width: '100%', height: '100%', borderRadius: '12px' }}
          />
        ) : _course.hero_image_url ? (
          <>
            <img 
              src={_course.hero_image_url} 
              alt="" 
              className="hero-image"
            />
            <div className="play-btn" />
          </>
        ) : (
          <div className="hero-placeholder" />
        )}
      </div>
    </div>
  )
}

// Social Proof Logos Component
function SocialProofLogos() {
  return (
    <section className="logos-bar">
      <div className="container">
        <div className="logos-label">— Vertrouwd door artists in heel Nederland —</div>
        <div className="logos-inner">
          <span className="logo-pill">Bella Lashes</span>
          <span className="logo-pill">Studio Vink</span>
          <span className="logo-pill">Lash Atelier</span>
          <span className="logo-pill">M. Beauty</span>
          <span className="logo-pill">Eye Couture</span>
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
    <section className="section section-glow-wrap">
      <AmbientGlow color="green" position="top-right" intensity="subtle" grain />
      <AmbientGlow color="gold" position="bottom-left" intensity="subtle" />
      <div className="container">
        <div className="sec-head">
          {course.differentiators_eyebrow && (
            <span className="eyebrow">— {course.differentiators_eyebrow} —</span>
          )}
          <h2>
            {course.differentiators_title || 'Waarom Luxique'}
            <br />
            <span className="serif-accent">anders is</span>
          </h2>
        </div>
        
        <div className="feat-grid">
          {course.differentiators.map((item, index) => (
            <div key={index} className={`diff-tile ${index === 1 ? 'green' : ''}`}>
              <div className="feat-visual">
                <div className="icon-big">{item.icon}</div>
              </div>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
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
    <section className="section" id="curriculum">
      <div className="container">
        <div className="sec-head">
          {course.curriculum_eyebrow && (
            <span className="eyebrow">— {course.curriculum_eyebrow} —</span>
          )}
          <h2>
            Wat ga je <span className="serif-accent">leren</span>
          </h2>
          {course.curriculum_intro && (
            <p>{course.curriculum_intro}</p>
          )}
        </div>
        
        <div className="curriculum-wrap">
          {lessons.map((lesson, index) => (
            <div 
              key={lesson.id}
              className={`lesson-acc ${index === openLessonIndex ? 'open' : ''}`}
              onClick={() => setOpenLessonIndex(index === openLessonIndex ? -1 : index)}
            >
              <div className="lesson-acc-head">
                <div className="lesson-num">
                  {String(lesson.sort_order + 1).padStart(2, '0')}
                </div>
                <div className="lesson-info">
                  <h4>{lesson.title}</h4>
                  <div className="meta">
                    {lesson.duration_seconds && `${Math.round(lesson.duration_seconds / 60)} minuten`}
                    {lesson.duration_seconds && ' · '}
                    Video
                  </div>
                </div>
                {lesson.is_free ? (
                  <span className="lesson-badge">Gratis Preview</span>
                ) : (
                  <span className="lesson-lock">🔒</span>
                )}
                <span className="acc-plus">+</span>
              </div>
              
              {lesson.what_you_learn_text && (
                <div className="lesson-acc-body">
                  <p>{lesson.what_you_learn_text}</p>
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
function ReviewsSection({ course, reviews = [] }: { course: Course; reviews?: Review[] }) {
  // Get 6 newest reviews (sorted by date logic - using first 6 for now)
  const displayReviews = reviews.slice(0, 6)

  return (
    <section className="section">
      <div className="container">
        <div className="sec-head">
          {course.reviews_eyebrow && (
            <span className="eyebrow">— {course.reviews_eyebrow} —</span>
          )}
          <h2>
            Verhalen van<br />onze <span className="serif-accent">artists</span>
          </h2>
        </div>
        
        <div className="test-grid">
          {displayReviews.map((review, index) => (
            <div key={index} className="test-card">
              <div className="test-stars">
                {'★'.repeat(review.stars)}
              </div>
              <blockquote>
                {review.text.length > 150 
                  ? `${review.text.substring(0, 150)}...` 
                  : review.text
                }
              </blockquote>
              <div className="test-author">
                <div className="test-avatar" style={{ background: review.color }}>
                  {review.initials}
                </div>
                <div>
                  <div className="name">{review.name}</div>
                  <div className="role">Lash Artist</div>
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
    <section className="section" id="pricing">
      <div className="container">
        <div className="sec-head">
          <span className="eyebrow">— Investering —</span>
          <h2>
            Eén <span className="serif-accent">prijs</span><br />
            volledige toegang
          </h2>
          <p>Geen abonnement. Geen verborgen kosten. Direct beginnen.</p>
        </div>
        
        <div className="pricing-wrap">
          <div className="pricing-stage">
            <div className="pricing-card">
              <div className="inner">
              <span className="eyebrow">Medusa Lash Basics</span>
              <h3>Word een echte lash artist</h3>
              
              <div className="price-big">
                <span className="euro">€</span>
                {Math.floor(priceEuros)}
              </div>
              
              <div className="price-sub">
                Eenmalige betaling · {course.access_duration_text || '12 maanden toegang'}
              </div>
              
              <div className="includes">
                {includesList.map((item, index) => (
                  <div key={index} className="includes-item">
                    <span className="check">✓</span>
                    {item}
                  </div>
                ))}
              </div>
              
              <a href="#" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                <span className="flow" />
                <span>Schrijf je nu in →</span>
              </a>
              
              <div className="payment-logos">
                <span className="pay-logo">VISA</span>
                <span className="pay-logo">Mastercard</span>
                <span className="pay-logo">iDEAL</span>
                <span className="pay-logo">Apple Pay</span>
                <span className="pay-logo">Klarna</span>
              </div>
              
              <div className="fine">Veilig betalen via Stripe</div>
            </div>
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
    <section className="section">
      <div className="container">
        <div className="sec-head">
          <span className="eyebrow">— Veelgestelde vragen —</span>
          <h2>Goed om <span className="serif-accent">te weten</span></h2>
        </div>
        
        <div className="faq-wrap">
          {faqItems.map((item, index) => (
            <div 
              key={index}
              className={`faq-item ${index === openIndex ? 'open' : ''}`}
              onClick={() => setOpenIndex(index === openIndex ? -1 : index)}
            >
              <div className="faq-q">
                <span>{item.question}</span>
                <span className="plus">+</span>
              </div>
              <div className="faq-a">{item.answer}</div>
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
    <section className="final-cta">
      <div className="final-cta-content">
        {course.final_cta_eyebrow && (
          <span className="eyebrow">— {course.final_cta_eyebrow} —</span>
        )}
        <h2>
          {course.final_cta_title || 'Begin vandaag aan je'}
          <br />
          <span className="serif-accent">
            {course.final_cta_title_accent || 'reis als artist'}
          </span>
        </h2>
        {course.final_cta_lead && (
          <p>{course.final_cta_lead}</p>
        )}
        <a href="#pricing" className="btn-primary" style={{ fontSize: 16, padding: '20px 44px' }}>
          <span className="flow" />
          <span>{course.final_cta_button_text || 'Schrijf je nu in'} →</span>
        </a>
      </div>
    </section>
  )
}

// Sticky CTA Component

// Footer Component

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
    <section className="section">
      <div className="container">
        <div className="about-grid">
          {photo_url && (
            <div 
              className="about-photo"
              style={{ backgroundImage: `url(${photo_url})` }}
            />
          )}
          <div className="about-text">
            {eyebrow && <span className="eyebrow">— {eyebrow} —</span>}
            {title && <h2>{title}</h2>}
            {body_html && (
              <div 
                className="about-body"
                dangerouslySetInnerHTML={{ __html: body_html }} 
              />
            )}
            {quote && (
              <div className="about-quote">
                &ldquo;{quote}&rdquo;
              </div>
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
    <section className="section">
      <div className="container">
        <div className="sec-head">
          {eyebrow && <span className="eyebrow">— {eyebrow} —</span>}
          {title && <h2>{title}</h2>}
        </div>
        
        <div className="pain-points-wrap">
          {points.map((point: string, index: number) => (
            <div key={index} className="pain-point">
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
    <section className="section">
      <div className="container">
        <div className="quote-wrap">
          <div className="quote-text">
            <span className="quote-mark">&ldquo;</span>
            {quote}
          </div>
          {attribution && (
            <div className="quote-attribution">— {attribution}</div>
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
    <section className="section">
      <div className="container">
        <div className="sec-head">
          {eyebrow && <span className="eyebrow">— {eyebrow} —</span>}
          {title && <h2>{title}</h2>}
        </div>
        
        <div className="rich-text-content">
          {body_html && (
            <div dangerouslySetInnerHTML={{ __html: body_html }} />
          )}
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
    <section className="section">
      <div className="container">
        <div className={`image-text-grid ${imageSide}`}>
          {image_url && (
            <div 
              className="image-text-photo"
              style={{ backgroundImage: `url(${image_url})` }}
            />
          )}
          <div className="image-text-content">
            {eyebrow && <span className="eyebrow">— {eyebrow} —</span>}
            {title && <h2>{title}</h2>}
            {body_html && (
              <div dangerouslySetInnerHTML={{ __html: body_html }} />
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
    <section className="section">
      <div className="container">
        <div className="video-caption-wrap">
          {video_url && (
            <div className="video-container">
              <video controls poster={thumbnail_url}>
                <source src={video_url} type="video/mp4" />
              </video>
            </div>
          )}
          {caption && (
            <div className="video-caption">
              {caption}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}