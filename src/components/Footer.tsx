'use client'

import { useTranslations } from 'next-intl'
import LanguageSwitcher from './LanguageSwitcher'

export default function Footer() {
  // Safe translation: returns key as fallback if context is missing (admin routes)
  let t: (k: string) => string
  try {
    t = useTranslations('Footer')
  } catch {
    t = (k: string) => k
  }

  return (
    <footer className="bg-[var(--dark)] text-white py-16 border-t border-white/5">
      <div className="max-w-[900px] mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div>
            <img src="https://osldoolmbpqayxhgmbum.supabase.co/storage/v1/render/image/public/images/lxq-logo-07.webp?width=400&quality=80" alt="LUXIQUE Academy" className="h-[80px] w-auto mb-3" />
            <p className="text-[12px] text-white/40 leading-relaxed">
              {t('tagline')}
            </p>
          </div>

          {/* Behandelingen */}
          <div>
            <h5 className="text-[13px] font-semibold mb-4 text-white/60">{t('behandelingenTitle')}</h5>
            <a href="/behandelingen" className="block text-[12px] text-white/40 hover:text-[var(--rose)] transition mb-2">{t('behandelingen1')}</a>
            <a href="/behandelingen" className="block text-[12px] text-white/40 hover:text-[var(--rose)] transition mb-2">{t('behandelingen2')}</a>
            <a href="/behandelingen" className="block text-[12px] text-white/40 hover:text-[var(--rose)] transition">{t('behandelingen3')}</a>
          </div>

          {/* Academy */}
          <div>
            <h5 className="text-[13px] font-semibold mb-4 text-white/60">{t('academyTitle')}</h5>
            <a href="/courses" className="block text-[12px] text-white/40 hover:text-[var(--rose)] transition mb-2">{t('academy1')}</a>
            <a href="/persoonlijk-traject" className="block text-[12px] text-white/40 hover:text-[var(--rose)] transition">{t('academy2')}</a>
          </div>

          {/* Info */}
          <div>
            <h5 className="text-[13px] font-semibold mb-4 text-white/60">{t('infoTitle')}</h5>
            <a href="/about" className="block text-[12px] text-white/40 hover:text-[var(--rose)] transition mb-2">{t('info1')}</a>
            <a href="/faq" className="block text-[12px] text-white/40 hover:text-[var(--rose)] transition mb-2">{t('info2')}</a>
            <a href="/contact" className="block text-[12px] text-white/40 hover:text-[var(--rose)] transition mb-2">{t('info3')}</a>
            <a href="https://www.google.nl/search?q=Lashed+by+Chiva&si=AL3DRZEsmMGCryMMFSHJ3StBhOdZ2-6yYkXd_doETEE1OR-qOXnNn9cjqmnpbyGwwilPiiFoL9NRN9JMEJIRkgOBDP-1dimnJRkrkciqpSFldaZS9zcFoZM%3D" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[12px] text-white/40 hover:text-[var(--rose)] transition mb-2">
              <svg width="14" height="14" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              {t('leaveReview')}
            </a>
            <a href="https://instagram.com/lashedbychiva" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[12px] text-white/40 hover:text-[var(--rose)] transition">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              {t('instagram')}
            </a>
          </div>
        </div>

        {/* Juridisch — full width row */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 mb-8">
          <a href="/voorwaarden#voorwaarden" className="text-[11px] text-white/30 hover:text-[var(--rose)] transition">{t('algemeneVoorwaarden')}</a>
          <a href="/voorwaarden#privacy" className="text-[11px] text-white/30 hover:text-[var(--rose)] transition">{t('privacy')}</a>
          <a href="/voorwaarden#cookies" className="text-[11px] text-white/30 hover:text-[var(--rose)] transition">{t('cookie')}</a>
          <a href="/voorwaarden#annulering" className="text-[11px] text-white/30 hover:text-[var(--rose)] transition">{t('annulering')}</a>
          <button onClick={() => typeof window !== 'undefined' && window.dispatchEvent(new Event('open-cookie-prefs'))} className="text-[11px] text-white/30 hover:text-[var(--rose)] transition cursor-pointer">{t('cookievoorkeuren')}</button>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[11px] text-white/30">{t('copyright')}</p>
          <div className="[&>button]:!bg-white/10 [&>button]:!border-white/20 [&>button:hover]:!border-white/40">
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </footer>
  )
}
