'use client'

import { useEffect, useState } from 'react'
import { getQuizImageAspectRatio, type CourseQuizOption } from '@/lib/course-block-content'

export type QuizImageOption = CourseQuizOption

interface QuizImageOptionsProps {
  options: QuizImageOption[]
  getBorder?: (option: QuizImageOption) => string
  onSelect?: (option: QuizImageOption) => void
  disabled?: boolean
}

export default function QuizImageOptions({ options, getBorder, onSelect, disabled = false }: QuizImageOptionsProps) {
  const [lightboxImage, setLightboxImage] = useState<{ url: string; alt: string } | null>(null)

  useEffect(() => {
    if (!lightboxImage) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLightboxImage(null)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [lightboxImage])

  return (
    <>
      <div className="shared-quiz-image-grid">
        {options.map(option => (
          <div
            key={option.id}
            className="shared-quiz-image-option"
            data-crop-aspect={option.image_crop_aspect || 'legacy'}
            onClick={() => !disabled && onSelect?.(option)}
            style={{
              border: getBorder?.(option) || '1.5px solid rgba(44,42,37,0.12)',
              cursor: disabled || !onSelect ? 'default' : 'pointer',
            }}
          >
            <div className="shared-quiz-image-media" data-quiz-option-frame style={{ aspectRatio: getQuizImageAspectRatio(option) }}>
              {option.image_url ? (
                <img src={option.image_url} alt={option.text || ''} />
              ) : (
                <span className="shared-quiz-image-placeholder">⛶</span>
              )}
              {option.image_url && (
                <button
                  type="button"
                  className="shared-quiz-image-zoom"
                  aria-label={option.text ? `Vergroot foto: ${option.text}` : 'Vergroot antwoordfoto'}
                  onClick={event => {
                    event.stopPropagation()
                    setLightboxImage({ url: option.image_url!, alt: option.text || '' })
                  }}
                >
                  ⌕
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {lightboxImage && (
        <div className="shared-quiz-lightbox" role="dialog" aria-modal="true" aria-label="Vergrote foto" onClick={() => setLightboxImage(null)}>
          <button className="shared-quiz-lightbox-close" type="button" onClick={() => setLightboxImage(null)} aria-label="Sluiten">✕</button>
          <img src={lightboxImage.url} alt={lightboxImage.alt} onClick={event => event.stopPropagation()} />
        </div>
      )}

      <style jsx>{`
        .shared-quiz-image-grid { display: grid; grid-template-columns: repeat(2,minmax(0,280px)); justify-content: center; align-items: start; gap: 18px; max-width: 590px; margin: 0 auto; }
        .shared-quiz-image-option { position: relative; border-radius: 14px; overflow: hidden; background: var(--paper, #fff); transition: border-color .2s, transform .2s, box-shadow .2s; }
        .shared-quiz-image-option:hover { transform: translateY(-2px); box-shadow: 0 12px 28px rgba(30,26,20,.10); }
        .shared-quiz-image-media { position: relative; background: var(--cream-2, #ebe6dd); display: flex; align-items: center; justify-content: center; }
        .shared-quiz-image-media img { display: block; width: 100%; height: 100%; object-fit: cover; }
        .shared-quiz-image-placeholder { font-size: 28px; color: var(--muted, #8c8579); }
        .shared-quiz-image-zoom { position: absolute; top: 10px; right: 10px; width: 38px; height: 38px; display: grid; place-items: center; border: 1px solid rgba(255,255,255,.65); border-radius: 50%; background: rgba(12,10,7,.62); color: #fff; font-size: 23px; line-height: 1; cursor: zoom-in; box-shadow: 0 4px 16px rgba(0,0,0,.2); }
        .shared-quiz-image-zoom:hover { background: rgba(12,10,7,.82); }
        .shared-quiz-lightbox { position: fixed; inset: 0; z-index: 1200; display: flex; align-items: center; justify-content: center; padding: 24px; background: rgba(0,0,0,.88); cursor: zoom-out; }
        .shared-quiz-lightbox img { max-width: min(94vw, 1500px); max-height: 90vh; object-fit: contain; border-radius: 10px; box-shadow: 0 20px 80px rgba(0,0,0,.45); }
        .shared-quiz-lightbox-close { position: fixed; top: 18px; right: 22px; width: 42px; height: 42px; border: 1px solid rgba(255,255,255,.35); border-radius: 50%; background: rgba(0,0,0,.35); color: white; font-size: 18px; cursor: pointer; }
        @media (max-width: 680px) {
          .shared-quiz-image-grid { grid-template-columns: minmax(0,1fr); gap: 14px; max-width: 440px; }
          .shared-quiz-lightbox { padding: 12px; }
        }
      `}</style>
    </>
  )
}
