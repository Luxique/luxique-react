'use client'

import { useState } from 'react'

/* ── course data ── */
interface Course {
  slug: string
  name: string
  meta: string
  level: 'beginner' | 'intermediate' | 'advanced'
  desc: string
  preview: boolean
}

const COURSES: Course[] = [
  { slug: 'medusa-lash-basics', name: 'Medusa Lash Basics', meta: '12 lessen · ~6 uur', level: 'beginner', desc: 'Beginnerscursus — Medusa techniek. Leer de basis van de Medusa set van scratch, inclusief fan placement, curl selectie en klantcommunicatie.', preview: true },
  { slug: 'wispy-lash-mastery', name: 'Wispy Lash Mastery', meta: '16 lessen · ~8 uur', level: 'intermediate', desc: 'Vervolgmodule — Wispy techniek. Verdiep je in de wispy stijl die Chiva bekend maakte: lichte, naturel ogende sets die perfect aansluiten op elke oogvorm.', preview: true },
  { slug: 'oogvorm-analyse', name: 'Oogvorm Analyse', meta: '10 lessen · ~4 uur', level: 'intermediate', desc: 'Leer elke oogvorm herkennen en vertalen naar de perfecte set. De basis van het Luxique gedachtegoed — kijken naar het oog, niet naar de wimper.', preview: false },
]

/* ── icons ── */
function PlayIcon({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
}
function LockIcon({ size = 11 }: { size?: number }) {
  return <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
}
function EyeIcon({ size = 12 }: { size?: number }) {
  return <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /></svg>
}
function UserPlusIcon() {
  return <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" /></svg>
}
function PlaySmallIcon() {
  return <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" /></svg>
}

export default function AcademySection() {
  const [activeCourse, setActiveCourse] = useState(0)

  return (
    <section id="academy" className="academy-section">
      <div className="academy-page">

        {/* ══ HERO BANNER ══ */}
        <div className="hero-banner fade-up">
          <div className="hero-left">
            <span className="hero-eyebrow">LXQ Academy</span>
            <h1 className="hero-title">
              Leer denken als<br />een <em>lash artist.</em>
            </h1>
            <p className="hero-sub">
              Maak een gratis account en bekijk de eerste les van elke cursus. Geen creditcard, geen verplichtingen.
            </p>
            <div className="hero-ctas">
              <a href="/register" className="btn-primary">
                <UserPlusIcon />
                Maak gratis account
              </a>
              <a href="#academy-courses" className="btn-ghost-light">Bekijk preview →</a>
            </div>
          </div>

          <div className="hero-lock-badge">
            <div className="lock-icon">
              <LockIcon size={20} />
            </div>
            <p className="lock-title">Eerste les<br />altijd gratis</p>
            <p className="lock-sub">Daarna account<br />vereist</p>
            <a href="/register" className="lock-cta">Start nu →</a>
          </div>
        </div>

        {/* ══ LAYOUT ══ */}
        <div className="academy-layout">

          {/* ── Sidebar ── */}
          <div className="sidebar">
            {/* Course nav */}
            <div className="sidebar-card fade-up">
              <div className="sidebar-header">
                <span className="sidebar-label">Cursussen</span>
                <p className="sidebar-title">Onze opleidingen</p>
              </div>
              <ul className="course-nav">
                {COURSES.map((c, i) => (
                  <li key={c.slug} className="course-nav-item">
                    <button
                      className={`course-nav-btn ${i === activeCourse ? 'active' : ''} ${c.preview ? 'preview' : ''}`}
                      onClick={() => setActiveCourse(i)}
                    >
                      <div className="course-nav-dot" />
                      <div className="course-nav-text">
                        <p className="course-nav-name">{c.name}</p>
                        <p className="course-nav-meta">{c.meta}</p>
                      </div>
                      {c.preview ? <EyeIcon /> : <LockIcon size={12} />}
                    </button>
                  </li>
                ))}
                <li className="course-nav-item">
                  <button className="course-nav-btn" onClick={() => setActiveCourse(3)}>
                    <div className="course-nav-dot" />
                    <div className="course-nav-text">
                      <p className="course-nav-name">Persoonlijk Traject</p>
                      <p className="course-nav-meta">Op aanvraag · 1:1</p>
                    </div>
                    <LockIcon size={12} />
                  </button>
                </li>
              </ul>
            </div>

            {/* Account prompt */}
            <div className="sidebar-card account-prompt fade-up">
              <h3 className="account-prompt-title">
                Gratis starten met<br /><em>de eerste les.</em>
              </h3>
              <p className="account-prompt-sub">
                Maak een account om direct toegang te krijgen tot de preview lessen van alle cursussen.
              </p>
              <a href="/register" className="btn-gold-full">Account aanmaken →</a>
              <p className="account-login">Al een account? <a href="/login">Inloggen</a></p>
            </div>
          </div>

          {/* ── Content ── */}
          <div className="content-area" id="academy-courses">

            {COURSES.map((course) => (
              <div key={course.slug} className={`course-card ${course.preview ? 'featured' : ''} fade-up`}>
                <div className="card-inner">
                  <div className={`card-thumb ${!course.preview ? 'opacity-55' : ''}`}>
                    <div className="card-thumb-placeholder">
                      <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.75}>
                        <rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="3 2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                      Course thumbnail
                    </div>
                    {course.preview ? (
                      <>
                        <span className="preview-badge">Preview beschikbaar</span>
                        <div className="play-btn"><PlayIcon /></div>
                      </>
                    ) : (
                      <span className="lock-badge"><LockIcon size={10} /> Account vereist</span>
                    )}
                  </div>

                  <div className={`card-body ${!course.preview ? 'opacity-65' : ''}`}>
                    <div className="card-top">
                      <div className="card-level-row">
                        <span className={`card-level ${course.level}`}>{course.level === 'beginner' ? 'Beginner' : 'Intermediate'}</span>
                        <span className="card-lessons-meta">{course.meta}</span>
                      </div>
                      <h2 className="card-title">{course.name}</h2>
                      <p className="card-desc">{course.desc}</p>
                    </div>
                    <div>
                      <div className="card-actions">
                        {course.preview ? (
                          <>
                            <a href={`/courses/${course.slug}`} className="btn-card-primary">
                              <PlaySmallIcon />
                              Eerste les gratis
                            </a>
                            <a href={`/courses/${course.slug}`} className="btn-card-ghost">Meer info</a>
                          </>
                        ) : (
                          <>
                            <a href="/register" className="btn-card-primary">
                              <UserPlusIcon />
                              Account aanmaken
                            </a>
                            <a href={`/courses/${course.slug}`} className="btn-card-ghost">Meer info</a>
                          </>
                        )}
                      </div>
                      {course.preview && (
                        <p className="card-lock-note">
                          <LockIcon />
                          Gratis account vereist voor verdere toegang
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Persoonlijk Traject */}
            <div className="traject-card fade-up">
              <div>
                <span className="traject-eyebrow">Exclusief</span>
                <h3 className="traject-title">
                  Persoonlijk Traject<br />met <em>Chiva.</em>
                </h3>
                <p className="traject-desc">
                  Intensief 1:1 begeleiding over meerdere dagen — voor wie het vak echt wil beheersen. Volledig op maat, beperkte beschikbaarheid.
                </p>
              </div>
              <div className="traject-right">
                <div className="traject-price">op aanvraag</div>
                <a href="/contact" className="btn-traject">Meer informatie →</a>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}
