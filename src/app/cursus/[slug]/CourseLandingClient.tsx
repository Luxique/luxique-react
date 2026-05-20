'use client'

import { useEffect, useState } from 'react'

interface Course {
  id: string
  title: string
  slug: string
  description?: string
  hero_badge_text?: string
  hero_title?: string
  hero_title_accent?: string
  hero_tagline?: string
  hero_cta_text?: string
  hero_social_proof?: string
  hero_rating?: number
  hero_image_url?: string
  hero_mux_playback_id?: string
  show_payment_icons?: boolean
  trust_microcopy?: string
  differentiators_eyebrow?: string
  differentiators_title?: string
  differentiators_lead?: string
  differentiators?: Array<{ icon: string; title: string; body: string }>
  landing_blocks?: Array<LandingBlock>
  show_curriculum?: boolean
  curriculum_eyebrow?: string
  curriculum_title?: string
  curriculum_intro?: string
  final_cta_eyebrow?: string
  final_cta_title?: string
  final_cta_title_accent?: string
  final_cta_lead?: string
  final_cta_button_text?: string
  final_cta_includes?: string[]
  final_cta_fine_print?: string
  price_cents?: number
  level?: string
}

interface Lesson {
  id: string
  title: string
  sort_order: number
  is_free: boolean
  duration_seconds: number
}

interface LandingBlock {
  id: string
  type: string
  order: number
  data: Record<string, unknown>
}

export default function CourseLandingClient({ course, lessons }: { course: Course; lessons: Lesson[] }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > window.innerHeight * 0.8)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const heroTitle = course.hero_title || course.title || ''
  const heroAccent = course.hero_title_accent || ''
  const heroTitleParts = heroAccent ? heroTitle.split(heroAccent) : [heroTitle]

  const priceEuros = course.price_cents ? `€ ${Math.floor(course.price_cents / 100)}` : ''

  return (
    <div className="course-landing" style={{ background: 'var(--cl-dark)', color: 'var(--cl-cream)', fontFamily: "'Outfit', sans-serif", fontWeight: 300, lineHeight: 1.6 }}>
      {/* Nav */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, padding: '22px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(12,10,7,0.6)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--cl-border)' }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, letterSpacing: '0.32em', color: 'var(--cl-cream)' }}>LUXIQUE</div>
        <button style={{ background: 'var(--cl-gold)', color: 'var(--cl-dark)', padding: '10px 22px', borderRadius: 999, fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer', letterSpacing: '0.04em' }}>
          {course.hero_cta_text || 'Schrijf je in'}
        </button>
      </nav>

      {/* Hero */}
      <section style={{ padding: '160px 0 100px', position: 'relative', overflow: 'hidden', textAlign: 'center' }}>
        <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%,-50%)', width: 800, height: 800, background: 'radial-gradient(circle, var(--cl-gold-glow) 0%, transparent 60%)', filter: 'blur(80px)', zIndex: 0, pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1180, margin: '0 auto', padding: '0 32px' }}>
          {course.hero_badge_text && (
            <span style={{ display: 'inline-block', padding: '8px 18px', border: '1px solid var(--cl-border)', borderRadius: 999, background: 'var(--cl-gold-soft)', color: 'var(--cl-gold)', fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 32 }}>
              {course.hero_badge_text}
            </span>
          )}
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(48px, 7vw, 88px)', color: 'var(--cl-cream)', marginBottom: 24, fontStyle: 'italic', fontWeight: 300, letterSpacing: '-0.01em', lineHeight: 1.1 }}>
            {heroTitleParts[0]}
            {heroAccent && <span style={{ color: 'var(--cl-gold)' }}>{heroAccent}</span>}
            {heroTitleParts[1]}
          </h1>
          {course.hero_tagline && (
            <p style={{ fontSize: 19, color: 'var(--cl-cream-dim)', maxWidth: 620, margin: '0 auto 44px', lineHeight: 1.6 }}>
              {course.hero_tagline}
            </p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, marginBottom: 18 }}>
            <button style={{ background: 'var(--cl-gold)', color: 'var(--cl-dark)', padding: '18px 38px', borderRadius: 999, border: 'none', fontFamily: "'Outfit', sans-serif", fontSize: 15, fontWeight: 500, letterSpacing: '0.04em', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 12 }}>
              {course.hero_cta_text || 'Schrijf je in'} →
            </button>
            {course.hero_social_proof && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 14, color: 'var(--cl-cream-dim)', fontSize: 13, marginTop: 8 }}>
                <span style={{ color: 'var(--cl-gold)', letterSpacing: 1 }}>★★★★★</span>
                <span>{course.hero_social_proof}</span>
                {course.hero_rating && (
                  <>
                    <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--cl-cream-mute)' }} />
                    <span>Gemiddeld {course.hero_rating}/5</span>
                  </>
                )}
              </div>
            )}
          </div>
          {course.show_payment_icons && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, marginTop: 32, color: 'var(--cl-cream-mute)', fontSize: 11, letterSpacing: '0.1em' }}>
              <span>VEILIG BETALEN VIA</span>
              <div style={{ display: 'flex', gap: 10 }}>
                {['VISA', 'MC', 'iDEAL', 'APPLE', 'KLARNA'].map(p => (
                  <span key={p} style={{ background: 'var(--cl-dark-3)', border: '1px solid var(--cl-border)', borderRadius: 6, padding: '6px 10px', fontSize: 10, color: 'var(--cl-cream-dim)', fontWeight: 600, letterSpacing: '0.05em' }}>{p}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Hero Video/Image */}
        {(course.hero_mux_playback_id || course.hero_image_url) && (
          <div style={{ maxWidth: 880, margin: '72px auto 0', padding: '0 32px', position: 'relative', zIndex: 2 }}>
            <div style={{ position: 'relative', aspectRatio: '16/9', borderRadius: 22, overflow: 'hidden', background: 'var(--cl-dark-2)', border: '1px solid var(--cl-border)', boxShadow: '0 0 80px var(--cl-gold-glow), 0 30px 60px rgba(0,0,0,0.5)' }}>
              {course.hero_image_url && (
                <img src={course.hero_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.65) contrast(1.1)' }} />
              )}
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 84, height: 84, borderRadius: '50%', background: 'rgba(250,248,244,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 12px 40px rgba(0,0,0,0.4)' }}>
                  <div style={{ width: 0, height: 0, borderLeft: '22px solid var(--cl-dark)', borderTop: '14px solid transparent', borderBottom: '14px solid transparent', marginLeft: 6 }} />
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Differentiators */}
      <section style={{ background: 'var(--cl-dark-2)', borderTop: '1px solid var(--cl-border)', borderBottom: '1px solid var(--cl-border)', padding: '130px 0' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 32px' }}>
          <div style={{ textAlign: 'center', marginBottom: 70 }}>
            {course.differentiators_eyebrow && <span style={{ fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--cl-gold)', fontWeight: 500, marginBottom: 16, display: 'inline-block' }}>{course.differentiators_eyebrow}</span>}
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(36px,5vw,56px)', color: 'var(--cl-cream)', marginBottom: 18, fontStyle: 'italic', fontWeight: 300, letterSpacing: '-0.01em', lineHeight: 1.1 }}>
              {(course.differentiators_title || '').split('\n').map((line, i) => <span key={i}>{i > 0 && <br />}{line}</span>)}
            </h2>
            {course.differentiators_lead && <p style={{ color: 'var(--cl-cream-dim)', fontSize: 17, maxWidth: 560, margin: '0 auto' }}>{course.differentiators_lead}</p>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {(course.differentiators || []).map((d, i) => (
              <div key={i} style={{ background: 'var(--cl-dark-3)', border: '1px solid var(--cl-border)', borderRadius: 22, padding: '44px 36px', transition: 'all 0.4s' }}>
                <div style={{ width: 56, height: 56, background: 'var(--cl-gold-soft)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28, color: 'var(--cl-gold)', fontSize: 24 }}>{d.icon}</div>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, color: 'var(--cl-cream)', marginBottom: 14, fontStyle: 'italic', fontWeight: 400 }}>{d.title}</h3>
                <p style={{ color: 'var(--cl-cream-dim)', fontSize: 15, lineHeight: 1.7 }}>{d.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Flex Blocks */}
      {(course.landing_blocks || []).sort((a, b) => a.order - b.order).map(block => (
        <FlexBlockRenderer key={block.id} block={block} />
      ))}

      {/* Curriculum */}
      {course.show_curriculum && lessons.length > 0 && (
        <section style={{ background: 'var(--cl-dark-2)', borderTop: '1px solid var(--cl-border)', borderBottom: '1px solid var(--cl-border)', padding: '130px 0' }}>
          <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 32px' }}>
            <div style={{ textAlign: 'center', marginBottom: 70 }}>
              {course.curriculum_eyebrow && <span style={{ fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--cl-gold)', fontWeight: 500, marginBottom: 16, display: 'inline-block' }}>{course.curriculum_eyebrow}</span>}
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(36px,5vw,56px)', color: 'var(--cl-cream)', marginBottom: 18, fontStyle: 'italic', fontWeight: 300, lineHeight: 1.1 }}>
                {(course.curriculum_title || '').split('\n').map((line, i) => <span key={i}>{i > 0 && <br />}{line}</span>)}
              </h2>
            </div>
            {course.curriculum_intro && <p style={{ textAlign: 'center', color: 'var(--cl-cream-dim)', fontSize: 15, maxWidth: 540, margin: '-40px auto 60px', fontStyle: 'italic', fontFamily: "'Cormorant Garamond', serif" }}>{course.curriculum_intro}</p>}
            <div style={{ maxWidth: 820, margin: '0 auto', border: '1px solid var(--cl-border)', borderRadius: 22, overflow: 'hidden', background: 'var(--cl-dark)' }}>
              {lessons.map((lesson, i) => (
                <div key={lesson.id} style={{ display: 'flex', alignItems: 'center', padding: '24px 32px', gap: 24, borderBottom: i < lessons.length - 1 ? '1px solid var(--cl-border)' : 'none' }}>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", color: 'var(--cl-gold)', fontSize: 24, fontStyle: 'italic', width: 40, flexShrink: 0 }}>
                    {String(lesson.sort_order + 1).padStart(2, '0')}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: 'var(--cl-cream)', fontSize: 16, fontWeight: 400, marginBottom: 4 }}>{lesson.title}</div>
                    <div style={{ color: 'var(--cl-cream-mute)', fontSize: 12, letterSpacing: '0.05em' }}>
                      {lesson.duration_seconds ? `${Math.round(lesson.duration_seconds / 60)} minuten` : ''}
                    </div>
                  </div>
                  {lesson.is_free ? (
                    <span style={{ background: 'var(--cl-gold-soft)', color: 'var(--cl-gold)', padding: '5px 12px', borderRadius: 999, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 500 }}>Gratis Preview</span>
                  ) : (
                    <span style={{ color: 'var(--cl-cream-mute)', fontSize: 16 }}>🔒</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Final CTA */}
      <section style={{ padding: '140px 0', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 1000, height: 600, background: 'radial-gradient(ellipse, var(--cl-gold-glow) 0%, transparent 70%)', filter: 'blur(80px)', zIndex: 0 }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1180, margin: '0 auto', padding: '0 32px' }}>
          {course.final_cta_eyebrow && <span style={{ fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--cl-gold)', fontWeight: 500, marginBottom: 16, display: 'inline-block' }}>{course.final_cta_eyebrow}</span>}
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(40px,6vw,64px)', color: 'var(--cl-cream)', marginTop: 16, marginBottom: 24, fontStyle: 'italic', fontWeight: 300, lineHeight: 1.1 }}>
            {course.final_cta_title || 'Word de '}
            {course.final_cta_title_accent && <span style={{ color: 'var(--cl-gold)' }}>{course.final_cta_title_accent}</span>}
            {!course.final_cta_title && !course.final_cta_title_accent && <>Word de <span style={{ color: 'var(--cl-gold)' }}>artist</span><br />die je wil zijn</>}
          </h2>
          {course.final_cta_lead && <p style={{ color: 'var(--cl-cream-dim)', fontSize: 18, maxWidth: 580, margin: '0 auto 44px' }}>{course.final_cta_lead}</p>}

          {(course.final_cta_includes || []).length > 0 && (
            <div style={{ maxWidth: 620, margin: '0 auto 44px', background: 'var(--cl-dark-2)', border: '1px solid var(--cl-border)', borderRadius: 22, padding: 32 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, textAlign: 'left' }}>
                {course.final_cta_includes!.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', color: 'var(--cl-cream)', fontSize: 14 }}>
                    <span style={{ color: 'var(--cl-gold)', fontSize: 14 }}>✓</span> {item}
                  </div>
                ))}
              </div>
            </div>
          )}

          {priceEuros && (
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', color: 'var(--cl-gold)', fontSize: 56, marginBottom: 8, fontWeight: 300 }}>
              {priceEuros}
            </div>
          )}
          <div style={{ color: 'var(--cl-cream-mute)', fontSize: 13, marginBottom: 32 }}>
            {course.final_cta_fine_print || 'Eenmalige betaling · Direct toegang'}
          </div>

          <button style={{ background: 'var(--cl-gold)', color: 'var(--cl-dark)', padding: '22px 48px', borderRadius: 999, border: 'none', fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 500, cursor: 'pointer', letterSpacing: '0.04em' }}>
            {course.final_cta_button_text || 'Schrijf je nu in'} →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '60px 0 100px', textAlign: 'center', color: 'var(--cl-cream-mute)', fontSize: 13, borderTop: '1px solid var(--cl-border)' }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, letterSpacing: '0.32em', color: 'var(--cl-cream)', marginBottom: 16 }}>LUXIQUE</div>
        <p>Eerst begrijpen, dan doen.</p>
        <p style={{ marginTop: 16, fontSize: 11, letterSpacing: '0.1em' }}>© LUXIQUE ACADEMY · 2026</p>
      </footer>

      {/* Sticky Bottom CTA */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(20,17,12,0.92)', borderTop: '1px solid var(--cl-border)', padding: '16px 32px', display: scrolled ? 'flex' : 'none', justifyContent: 'space-between', alignItems: 'center', zIndex: 99, backdropFilter: 'blur(20px)' }}>
        <div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontStyle: 'italic', color: 'var(--cl-cream)', lineHeight: 1.2 }}>{course.title}</div>
          <div style={{ fontSize: 10, color: 'var(--cl-cream-mute)', letterSpacing: '0.12em', marginTop: 2 }}>LUXIQUE ACADEMY</div>
        </div>
        <button style={{ background: 'var(--cl-gold)', color: 'var(--cl-dark)', padding: '12px 28px', borderRadius: 999, border: 'none', fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 500, cursor: 'pointer', letterSpacing: '0.04em' }}>
          {course.hero_cta_text || 'Schrijf je in'} →
        </button>
      </div>
    </div>
  )
}

/* Flex Block Renderer */
function FlexBlockRenderer({ block }: { block: LandingBlock }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = block.data as Record<string, any>

  switch (block.type) {
    case 'what_you_learn': {
      const items: string[] = (d.items || [])
      return (
        <section style={{ padding: '130px 0' }}>
          <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 32px' }}>
            <SectionHeader eyebrow={d.eyebrow} title={d.title} lead={d.lead} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
              {items.map((item, i) => (
                <div key={i} style={{ background: 'var(--cl-dark-2)', border: '1px solid var(--cl-border)', borderRadius: 14, padding: '28px 30px', display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                  <div style={{ flexShrink: 0, width: 32, height: 32, background: 'var(--cl-gold-soft)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cl-gold)', fontSize: 14 }}>✓</div>
                  <div>
                    <div style={{ color: 'var(--cl-cream)', fontSize: 16, fontWeight: 500, marginBottom: 6 }}>{item}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )
    }

    case 'rich_text': {
      return (
        <section style={{ padding: '130px 0' }}>
          <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 32px' }}>
            {(!!d.eyebrow || !!d.title) && <SectionHeader eyebrow={d.eyebrow} title={d.title} />}
            {d.body_html && (
              <div style={{ color: 'var(--cl-cream-dim)', fontSize: 16, lineHeight: 1.8 }} dangerouslySetInnerHTML={{ __html: d.body_html }} />
            )}
          </div>
        </section>
      )
    }

    case 'founder_story': {
      return (
        <section style={{ padding: '130px 0' }}>
          <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 32px', display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 80, alignItems: 'center' }}>
            <div style={{ aspectRatio: '4/5', borderRadius: 22, background: d.photo_url ? `url(${d.photo_url}) center/cover` : 'var(--cl-dark-3)', border: '1px solid var(--cl-border)', filter: 'grayscale(0.15) contrast(1.05)' }} />
            <div>
              {d.eyebrow && <span style={{ fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--cl-gold)', fontWeight: 500, marginBottom: 18, display: 'block' }}>{d.eyebrow}</span>}
              {d.title && <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(34px,4vw,48px)', color: 'var(--cl-cream)', marginBottom: 28, fontStyle: 'italic', fontWeight: 300, lineHeight: 1.1 }}>{d.title}</h2>}
              {d.body_html && <div style={{ color: 'var(--cl-cream-dim)', fontSize: 16, lineHeight: 1.8 }} dangerouslySetInnerHTML={{ __html: d.body_html }} />}
              {d.quote && (
                <div style={{ marginTop: 36, paddingLeft: 24, borderLeft: '2px solid var(--cl-gold)', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 22, color: 'var(--cl-cream)', lineHeight: 1.4 }}>
                  <span style={{ color: 'var(--cl-gold)' }}>&ldquo;</span>{d.quote}<span style={{ color: 'var(--cl-gold)' }}>&rdquo;</span>
                </div>
              )}
            </div>
          </div>
        </section>
      )
    }

    case 'pain_points': {
      const points: string[] = (d.points || [])
      return (
        <section style={{ background: 'var(--cl-dark-2)', borderTop: '1px solid var(--cl-border)', borderBottom: '1px solid var(--cl-border)', padding: '130px 0' }}>
          <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 32px' }}>
            <SectionHeader eyebrow={d.eyebrow} title={d.title} />
            <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {points.map((point, i) => (
                <div key={i} style={{ background: 'var(--cl-dark-3)', border: '1px solid var(--cl-border)', borderRadius: 999, padding: '22px 36px', color: 'var(--cl-cream)', fontSize: 16, textAlign: 'center' }}>
                  {point}
                </div>
              ))}
            </div>
          </div>
        </section>
      )
    }

    case 'faq': {
      const items = (d.items as Array<{ q: string; a: string }>) || []
      return (
        <section style={{ padding: '130px 0' }}>
          <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 32px' }}>
            <SectionHeader eyebrow={d.eyebrow} title={d.title} />
            <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {items.map((item, i) => (
                <FaqItem key={i} question={item.q} answer={item.a} />
              ))}
            </div>
          </div>
        </section>
      )
    }

    case 'testimonials': {
      const items = (d.items as Array<{ quote: string; name: string; role: string }>) || []
      return (
        <section style={{ background: 'var(--cl-dark-2)', borderTop: '1px solid var(--cl-border)', borderBottom: '1px solid var(--cl-border)', padding: '130px 0' }}>
          <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 32px' }}>
            <SectionHeader eyebrow={d.eyebrow} title={d.title} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, maxWidth: 980, margin: '0 auto' }}>
              {items.map((t, i) => (
                <div key={i} style={{ background: 'var(--cl-dark-3)', border: '1px solid var(--cl-border)', borderRadius: 22, padding: 36 }}>
                  <div style={{ color: 'var(--cl-gold)', letterSpacing: 2, marginBottom: 16 }}>★★★★★</div>
                  <blockquote style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 19, color: 'var(--cl-cream)', lineHeight: 1.5, marginBottom: 24 }}>
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, var(--cl-gold), var(--cl-dark-3))', flexShrink: 0 }} />
                    <div>
                      <div style={{ color: 'var(--cl-cream)', fontSize: 14, fontWeight: 500 }}>{t.name}</div>
                      <div style={{ color: 'var(--cl-cream-mute)', fontSize: 12 }}>{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )
    }

    case 'quote': {
      return (
        <section style={{ padding: '100px 0' }}>
          <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 32px', textAlign: 'center' }}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 28, color: 'var(--cl-cream)', lineHeight: 1.4 }}>
              <span style={{ color: 'var(--cl-gold)', fontSize: 40 }}>&ldquo;</span>
              {d.quote}
            </div>
            {d.attribution && <div style={{ color: 'var(--cl-cream-mute)', fontSize: 14, marginTop: 20 }}>— {d.attribution}</div>}
          </div>
        </section>
      )
    }

    case 'image_text': {
      return (
        <section style={{ padding: '130px 0' }}>
          <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 32px', display: 'grid', gridTemplateColumns: d.image_side === 'right' ? '1.1fr 1fr' : '1fr 1.1fr', gap: 80, alignItems: 'center' }}>
            {d.image_side !== 'right' && (
              <div style={{ aspectRatio: '4/5', borderRadius: 22, background: d.image_url ? `url(${d.image_url}) center/cover` : 'var(--cl-dark-3)', border: '1px solid var(--cl-border)' }} />
            )}
            <div>
              {d.eyebrow && <span style={{ fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--cl-gold)', fontWeight: 500, marginBottom: 18, display: 'block' }}>{d.eyebrow}</span>}
              {d.title && <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(34px,4vw,48px)', color: 'var(--cl-cream)', marginBottom: 28, fontStyle: 'italic', fontWeight: 300, lineHeight: 1.1 }}>{d.title}</h2>}
              {d.body_html && <div style={{ color: 'var(--cl-cream-dim)', fontSize: 16, lineHeight: 1.8 }} dangerouslySetInnerHTML={{ __html: d.body_html }} />}
            </div>
            {d.image_side === 'right' && (
              <div style={{ aspectRatio: '4/5', borderRadius: 22, background: d.image_url ? `url(${d.image_url}) center/cover` : 'var(--cl-dark-3)', border: '1px solid var(--cl-border)' }} />
            )}
          </div>
        </section>
      )
    }

    default:
      return null
  }
}

function SectionHeader({ eyebrow, title, lead }: { eyebrow?: string; title?: string; lead?: string }) {
  return (
    <div style={{ textAlign: 'center', marginBottom: 70 }}>
      {eyebrow && <span style={{ fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--cl-gold)', fontWeight: 500, marginBottom: 16, display: 'inline-block' }}>{eyebrow}</span>}
      {title && (
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(36px,5vw,56px)', color: 'var(--cl-cream)', marginBottom: 18, fontStyle: 'italic', fontWeight: 300, letterSpacing: '-0.01em', lineHeight: 1.1 }}>
          {title.split('\n').map((line, i) => <span key={i}>{i > 0 && <br />}{line}</span>)}
        </h2>
      )}
      {lead && <p style={{ color: 'var(--cl-cream-dim)', fontSize: 17, maxWidth: 560, margin: '0 auto' }}>{lead}</p>}
    </div>
  )
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ background: 'var(--cl-dark-2)', border: '1px solid var(--cl-border)', borderRadius: 14, overflow: 'hidden' }}>
      <div onClick={() => setOpen(!open)} style={{ padding: '24px 28px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--cl-cream)', fontSize: 16, userSelect: 'none' }}>
        <span>{question}</span>
        <span style={{ color: 'var(--cl-gold)', fontSize: 22, fontWeight: 300, transform: open ? 'rotate(45deg)' : 'none', transition: 'transform 0.3s' }}>+</span>
      </div>
      {open && (
        <div style={{ color: 'var(--cl-cream-dim)', fontSize: 15, lineHeight: 1.7, padding: '0 28px 24px' }}>
          {answer}
        </div>
      )}
    </div>
  )
}
