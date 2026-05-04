'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'

type Course = {
  id: string; title: string; slug: string; short_description: string; level: string; duration_text: string
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])

  useEffect(() => {
    supabase
      .from('courses')
      .select('id, title, slug, short_description, level, duration_text')
      .eq('is_published', true)
      .order('sort_order')
      .then(({ data }) => setCourses(data || []))
  }, [])

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="bg-white border-b border-[#eee]">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <a href="/" className="font-['Cormorant_Garamond'] text-[24px] tracking-[0.15em] text-[#1a1a1a]">LUXIQUE</a>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-16">
        <span className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#D4AF37] mb-4 block">LXQ Academy</span>
        <h1 className="font-['Cormorant_Garamond'] text-[clamp(32px,6vw,48px)] text-[#1a1a1a] mb-4">
          Onze cursussen
        </h1>
        <p className="text-[15px] text-[#888] max-w-[500px] mb-12">
          Leer denken als een artist. Elke cursus begint met een gratis introductieles.
        </p>

        {courses.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-6">
            {courses.map(c => (
              <a key={c.id} href={`/courses/${c.slug}`} className="block bg-white rounded-2xl p-8 border border-[#eee] hover:border-[#D4AF37]/30 hover:shadow-sm transition">
                <h3 className="font-['Cormorant_Garamond'] text-[24px] text-[#1a1a1a] mb-2">{c.title}</h3>
                {c.short_description && <p className="text-[13px] text-[#888] mb-4 leading-relaxed">{c.short_description}</p>}
                <div className="flex items-center gap-3 text-[11px] text-[#aaa] tracking-wide">
                  {c.level && <span className="bg-[#f5f5f5] px-2.5 py-1 rounded-full">{c.level}</span>}
                  {c.duration_text && <span>{c.duration_text}</span>}
                </div>
                <div className="mt-4 text-[12px] text-[#D4AF37] font-semibold">Eerste les gratis →</div>
              </a>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-12 border border-[#eee] text-center">
            <div className="text-4xl mb-4">✦</div>
            <h3 className="font-['Cormorant_Garamond'] text-[24px] mb-2">Binnenkort beschikbaar</h3>
            <p className="text-[14px] text-[#888]">Onze cursussen worden momenteel voorbereid. Schrijf je in om als eerste toegang te krijgen.</p>
            <a href="/register" className="inline-block mt-6 px-8 py-3 rounded-full bg-[#D4AF37] text-white font-semibold text-[14px] hover:bg-[#C5A028] transition">
              Account aanmaken
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
