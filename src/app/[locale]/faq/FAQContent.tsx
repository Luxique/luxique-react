'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

export default function FAQContent() {
  const t = useTranslations('FaqPage')
  const [open, setOpen] = useState<number | null>(null)

  const faqs = [
    { q: t('q1'), a: t('a1') },
    { q: t('q2'), a: t('a2') },
    { q: t('q3'), a: t('a3') },
    { q: t('q4'), a: t('a4') },
    { q: t('q5'), a: t('a5') },
    { q: t('q6'), a: t('a6') },
    { q: t('q7'), a: t('a7') },
    { q: t('q8'), a: t('a8') },
    { q: t('q9'), a: t('a9') },
    { q: t('q10'), a: t('a10') },
    { q: t('q11'), a: t('a11') },
    { q: t('q12'), a: t('a12') },
    { q: t('q13'), a: t('a13') },
    { q: t('q14'), a: t('a14') },
    { q: t('q15'), a: t('a15') },
    { q: t('q16'), a: t('a16') },
    { q: t('q17'), a: t('a17') },
    { q: t('q18'), a: t('a18') },
    { q: t('q19'), a: t('a19') },
    { q: t('q20'), a: t('a20') },
    { q: t('q21'), a: t('a21') },
  ]

  return (
    <div className="min-h-screen bg-[#FAFAFA] pt-24">

      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="font-['Cormorant_Garamond'] text-[clamp(32px,6vw,48px)] text-[#1a1a1a] mb-4">
          {t('title')}
        </h1>
        <div className="w-20 h-0.5 bg-[#D4AF37] mb-10" />

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-[#FBF8F2] rounded-2xl border border-[#eee] overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full text-left px-6 py-5 flex items-center justify-between"
              >
                <span className="text-[14px] font-medium text-[#1a1a1a] pr-4">{faq.q}</span>
                <span className={`text-[#D4AF37] transition-transform ${open === i ? 'rotate-180' : ''}`}>▾</span>
              </button>
              {open === i && (
                <div className="px-6 pb-5">
                  <p className="text-[14px] text-[#888] leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 bg-[#f9f8f6] rounded-2xl p-8 border border-[#eee] text-center">
          <p className="text-[14px] text-[#888] mb-4">{t('notFound')}</p>
          <div className="flex items-center justify-center gap-4">
            <a href="/contact" className="px-6 py-2.5 rounded-full border border-[#D4AF37] text-[#D4AF37] font-semibold text-[13px] hover:bg-[#D4AF37] hover:text-white transition">
              {t('contactCta')}
            </a>
            <p className="text-[13px] text-[#aaa]">{t('chatbotCta')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
