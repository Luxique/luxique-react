'use client'

import './academy-redesign.css'

/* ═══════════════════════════════════════════════════════
   AcademySection — Redesigned portrait card grid
   Tokens 1:1 from CJ's mockup (luxique-courses-redesign.html)
   ═══════════════════════════════════════════════════════ */

interface Course {
  id: string
  title: string
  subtitle: string | null
  slug: string
  level: string | null
  price: number | null
  price_cents: number | null
  status: string
  is_first_lesson_free: boolean | null
  intro_video_mux_id: string | null
  hero_mux_playback_id: string | null
  thumbnail_time: number | null
  thumbnail_url: string | null
  duration_text: string | null
  short_description: string | null
  description: string | null
  what_you_learn: string[] | null
  access_duration_text: string | null
}

interface Props {
  courses: Course[]
  loading?: boolean
}

const CDN_IMG = 'https://osldoolmbpqayxhgmbum.supabase.co/storage/v1/object/public/images'

function formatPrice(cents: number | null): string {
  if (!cents) return '€ 0'
  const euros = cents / 100
  return `€ ${euros.toLocaleString('nl-NL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export default function AcademySection({ courses, loading }: Props) {
  return (
    <div style={{ width: '100%', minHeight: '100vh', background: '#0c100d' }}>
      <div className="lxq-courses-wrap">

        {/* ══ HERO ══ */}
        <header className="lxq-hero">
          <div className="lxq-hero-main">
            <div className="lxq-eyebrow">LXQ Academy</div>
            <h1 className="lxq-h1">
              Leer denken als<br />een <em>lash artist.</em>
            </h1>
            <p className="lxq-hero-p">
              Eerst begrijpen, dan doen. Online opleidingen van Chiva — opgebouwd uit theorie, techniek en persoonlijke feedback.
            </p>
            <div className="lxq-hero-cta">
              <a href="#cursussen" className="lxq-btn-ghost">
                Bekijk de opleidingen ↓
              </a>
            </div>
          </div>
          <aside className="lxq-teacher">
            <div className="lxq-teacher-avatar">
              <img src={`${CDN_IMG}/chiva-portrait-v2.webp`} alt="Chiva" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} />
            </div>
            <div className="lxq-teacher-label">Lessen gegeven door</div>
            <h3 className="lxq-teacher-name">Chiva</h3>
            <div className="lxq-teacher-role">Lash Artist & Educator</div>
            <a href="/about" className="lxq-teacher-link">Lees haar verhaal →</a>
          </aside>
        </header>

        {/* ══ CURSUSSEN ══ */}
        <main id="cursussen">
          <div className="lxq-section-head">
            <div>
              <div className="lxq-eyebrow">Cursussen</div>
              <h2 className="lxq-section-h2">Onze <em>opleidingen</em></h2>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(242,236,221,0.4)', fontSize: 14 }}>
              Cursussen laden...
            </div>
          ) : (
            <div className="lxq-course-grid">

              {/* Dynamic course cards */}
              {courses.map((course) => {
                const thumbUrl = course.thumbnail_url
                  || (course.hero_mux_playback_id
                    ? `https://image.mux.com/${course.hero_mux_playback_id}/thumbnail.png?width=1200&time=1`
                    : course.intro_video_mux_id
                      ? `https://image.mux.com/${course.intro_video_mux_id}/thumbnail.png?time=${course.thumbnail_time ?? 0}&width=600`
                      : null)
                const usps = course.what_you_learn && course.what_you_learn.length > 0
                  ? course.what_you_learn
                  : ['Online lessen · video, theorie & quizzen', 'Persoonlijke feedback van Chiva', `${course.access_duration_text || '12 maanden'} toegang & updates`, 'Certificaat bij afronding']

                return (
                  <article key={course.id} className="lxq-course-card">
                    <div className="lxq-course-thumb">
                      {course.level && (
                        <span className="lxq-pill">{course.level.charAt(0).toUpperCase() + course.level.slice(1)}</span>
                      )}
                      {thumbUrl ? (
                        <img src={thumbUrl} alt={course.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div className="lxq-thumb-placeholder">
                          <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#f2ecdd" strokeWidth="1"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="M3 17l5-4 4 3 5-5 4 4"/></svg>
                          Thumbnail
                        </div>
                      )}
                      <span className="lxq-lock">
                        <svg width="10" height="12" viewBox="0 0 11 13" fill="none" stroke="#c9a86a" strokeWidth="1.3"><rect x="1" y="5.5" width="9" height="6.5" rx="1.6"/><path d="M3 5.5V4a2.5 2.5 0 015 0v1.5"/></svg>
                        Toegang na inschrijving
                      </span>
                    </div>
                    <div className="lxq-course-body">
                      <h3>{course.title}</h3>
                      <p className="lxq-course-sub">{course.subtitle || course.short_description}</p>
                      <ul className="lxq-usps">
                        {usps.map((usp, i) => <li key={i}>{usp}</li>)}
                      </ul>
                      <div className="lxq-course-foot">
                        <div className="lxq-price-row">
                          <span className="lxq-price">
                            <span className="lxq-amount">{formatPrice(course.price_cents)}</span>
                          </span>
                          <span className="lxq-price-terms">Eenmalig · incl. btw</span>
                        </div>
                        <a href={`/cursus/${course.slug}`} className="lxq-btn-primary lxq-btn-full">Join the Academy →</a>
                        <span className="lxq-micro">Eerste les gratis met een account</span>
                      </div>
                    </div>
                  </article>
                )
              })}

              {/* Persoonlijk Traject — always last card */}
              <article className="lxq-course-card lxq-card-exclusive">
                <div className="lxq-course-thumb lxq-thumb-exclusive">
                  <span className="lxq-pill" style={{ borderColor: 'rgba(245,239,227,0.08)', color: 'rgba(242,236,221,0.62)' }}>Exclusief</span>
                  <img src="https://osldoolmbpqayxhgmbum.supabase.co/storage/v1/object/public/images/persoonlijk-traject-card.webp" alt="Persoonlijk Traject" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div className="lxq-course-body">
                  <h3>Persoonlijk Traject<br /><em style={{ fontStyle: 'italic', color: '#c9a86a', fontWeight: 400 }}>met Chiva.</em></h3>
                  <p className="lxq-course-sub">Intensieve 1:1 begeleiding over meerdere dagen — volledig op maat, beperkte beschikbaarheid.</p>
                  <ul className="lxq-usps">
                    <li>Meerdere dagen 1:1</li>
                    <li>Volledig op maat</li>
                    <li>Beperkte beschikbaarheid</li>
                  </ul>
                  <div className="lxq-course-foot">
                    <div className="lxq-price-row">
                      <span className="lxq-op-aanvraag">op aanvraag</span>
                    </div>
                    <a href="/persoonlijk-traject" className="lxq-btn-outline">Meer informatie →</a>
                  </div>
                </div>
              </article>

            </div>
          )}

          {/* ══ GRATIS START BANNER ══ */}
          <section className="lxq-free-banner">
            <div>
              <h4>Gratis starten met <em>de eerste les.</em></h4>
              <p>Maak een account en bekijk direct de preview les van elke cursus. Geen creditcard, geen verplichtingen.</p>
              <div className="lxq-banner-login">Al een account? <a href="/login">Inloggen</a></div>
            </div>
            <a href="/register" className="lxq-btn-primary">Maak gratis account</a>
          </section>
        </main>
      </div>
    </div>
  )
}
