'use client'

import { useState } from 'react'

export default function ContactPage() {
  const [sent, setSent] = useState(false)

  return (
    <div className="min-h-screen bg-[#FAFAFA] pt-24">

      <div className="max-w-5xl mx-auto px-6 py-16">
        <h1 className="font-['Cormorant_Garamond'] text-[clamp(32px,6vw,48px)] text-[#1a1a1a] mb-4">
          Contact
        </h1>
        <div className="w-20 h-0.5 bg-[#D4AF37] mb-10" />

        <div className="grid md:grid-cols-2 gap-12">
          {/* Form */}
          <div className="bg-[#FBF8F2] rounded-2xl p-8 border border-[#eee]">
            {sent ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">✨</div>
                <h3 className="font-['Cormorant_Garamond'] text-[24px] mb-2">Bedankt!</h3>
                <p className="text-[14px] text-[#888]">We nemen zo snel mogelijk contact met je op.</p>
              </div>
            ) : (
              <form onSubmit={e => { e.preventDefault(); setSent(true) }} className="space-y-5">
                <div>
                  <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888] mb-1.5 block">Naam</label>
                  <input type="text" required className="w-full px-4 py-3 rounded-xl border border-[#ddd] bg-white text-[14px] focus:outline-none focus:border-[#D4AF37] transition" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888] mb-1.5 block">E-mailadres</label>
                  <input type="email" required className="w-full px-4 py-3 rounded-xl border border-[#ddd] bg-white text-[14px] focus:outline-none focus:border-[#D4AF37] transition" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888] mb-1.5 block">Bericht</label>
                  <textarea rows={5} required className="w-full px-4 py-3 rounded-xl border border-[#ddd] bg-white text-[14px] focus:outline-none focus:border-[#D4AF37] transition resize-none" />
                </div>
                <button type="submit" className="w-full py-3 rounded-full bg-[#D4AF37] text-white font-semibold text-[14px] hover:bg-[#C5A028] transition">
                  Verstuur
                </button>
              </form>
            )}
          </div>

          {/* Info */}
          <div className="space-y-8">
            <div>
              <h3 className="font-semibold text-[16px] mb-2">LXQ Academy</h3>
              <p className="text-[14px] text-[#888] leading-relaxed">
                Arnhem, Nederland<br />
                <a href="mailto:info@luxique.nl" className="text-[#D4AF37] hover:underline">info@luxique.nl</a>
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-[16px] mb-2">Socials</h3>
              <a href="https://instagram.com/lashedbychiva" target="_blank" className="text-[14px] text-[#D4AF37] hover:underline">
                @lashedbychiva
              </a>
            </div>
            {/* Chatbot placeholder */}
            <div className="bg-[#f9f8f6] rounded-2xl p-6 border border-[#eee]">
              <p className="text-[13px] text-[#888]">💬 Chat met ons — onderaan rechts vind je onze chatbot.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
