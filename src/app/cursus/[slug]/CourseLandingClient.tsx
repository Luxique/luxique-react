'use client'

import { useState, useEffect } from 'react'
import type { Review } from '@/lib/reviews'
import LuxiqueMuxPlayer from '@/components/LuxiqueMuxPlayer'
import AmbientGlow from '@/components/AmbientGlow'
import AuthModal from '@/components/AuthModal'
import { supabase } from '@/lib/supabase-client'
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
  const [user, setUser] = useState<{ id: string; email: string } | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setUser({ id: data.session.user.id, email: data.session.user.email ?? '' })
      }
    })
  }, [])

  const handleAuthSuccess = (u: { id: string; email: string }) => {
    setUser(u)
    setShowAuthModal(false)
  }

  const handleJoinCTA = async () => {
    if (!user) {
      setShowAuthModal(true)
      return
    }
    // B4.4: proceed to checkout
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: course.id,
          user_id: user.id,
          email: user.email,
          success_url: `${window.location.origin}/cursus/${course.slug}?enrolled=1`,
          cancel_url: `${window.location.origin}/cursus/${course.slug}?canceled=1`,
        }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      alert('Er ging iets mis bij het starten van de betaling.')
    }
  }

  const handleLessonClick = (lesson: Lesson) => {
    if (!user) {
      setShowAuthModal(true)
      return
    }
    // B4.5 will handle access check
    console.log('Lesson clicked:', lesson.title)
  }

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
        onLessonClick={handleLessonClick}
      />
      
      {/* Reviews */}
      
      {/* Mini Reviews Wall */}
      <MiniReviewsWall reviews={reviews} />
      
      {/* Pricing */}
      <PricingSection course={course} onJoin={handleJoinCTA} user={user} />
      
      {/* FAQ */}
      <FAQSection />
      
      {/* Final CTA */}
      <FinalCTASection course={course} onJoin={handleJoinCTA} user={user} />

      {/* Auth Modal */}
      <AuthModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
      />
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
            <span>{course.hero_cta_text || 'Join the Academy'} →</span>
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
    <div className="hero-stage">
      <div className="hero-media-glow">
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
  setOpenLessonIndex,
  onLessonClick
}: { 
  course: Course
  lessons: Lesson[]
  openLessonIndex: number
  setOpenLessonIndex: (index: number) => void
  onLessonClick?: (lesson: Lesson) => void
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
              onClick={() => {
                setOpenLessonIndex(index === openLessonIndex ? -1 : index)
                onLessonClick?.(lesson)
              }}
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
function PricingSection({ course, onJoin, user }: { course: Course; onJoin: () => void; user: { id: string; email: string } | null }) {
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
              
              <button type="button" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={onJoin}>
                <span className="flow" />
                <span>{user ? 'Join the Academy →' : 'Join the Academy →'}</span>
              </button>
              
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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function FinalCTASection({ course, onJoin, user: _user }: { course: Course; onJoin: () => void; user: { id: string; email: string } | null }) {
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
        <button type="button" className="btn-primary" style={{ fontSize: 16, padding: '20px 44px' }} onClick={onJoin}>
          <span className="flow" />
          <span>{course.final_cta_button_text || 'Join the Academy'} →</span>
        </button>
      </div>
    </section>
  )
}

// Sticky CTA Component

// Footer Component

function MiniReviewsWall({ reviews }: { reviews: Review[] }) {
  const cols = [[], [], []] as Review[][]
  reviews.forEach((r, i) => cols[i % 3].push(r))
  
  return (
    <section className="reviews-wall-section">
      <div className="container">
        <div className="sec-head">
          <span className="eyebrow">— Wat studenten zeggen —</span>
          <h2>Verhalen van <span className="serif-accent">onze artists</span></h2>
        </div>
      </div>
      <div className="reviews-wall">
        {cols.map((col, ci) => (
          <div key={ci} className="rw-col">
            <div className="rw-col-inner">
              {[...col, ...col].map((r, ri) => (
                <div key={ri} className="rw-card">
                  <div className="rw-stars">{'★'.repeat(r.stars)}</div>
                  <p className="rw-quote">&ldquo;{r.text.length > 150 ? r.text.slice(0, 147) + '...' : r.text}&rdquo;</p>
                  <div className="rw-foot">
                    <div className="rw-who">
                      <span className="rw-avatar" style={{ background: r.color }}>{r.initials}</span>
                      <span className="rw-name">{r.name}</span>
                    </div>
                    <span className={`rw-src ${r.source}`}>
                      {r.source === 'google' ? (
                        <><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                        <span>Google</span></>
                      ) : (
                        <><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#E8612C" opacity="0.9"/><text x="12" y="16" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">t</text></svg>
                        <span>Treatwell</span></>
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="rw-glow" />
      <div className="rw-line" />
    </section>
  )
}

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