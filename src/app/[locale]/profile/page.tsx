'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'

export default function ProfilePage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    first_name: '', last_name: '', phone: '', address: '', city: '', postal_code: '', instagram: '', tiktok: '', company_name: '', vat_number: '', kvk_number: ''
  })

  useEffect(() => {
    if (!loading && !user) router.push('/login?redirect=/profile')
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => {
      if (data) {
        setForm({
          first_name: data.first_name || user.user_metadata?.first_name || '',
          last_name: data.last_name || user.user_metadata?.last_name || '',
          phone: data.phone || '',
          address: data.address || '',
          city: data.city || '',
          postal_code: data.postal_code || '',
          instagram: data.instagram || '',
          tiktok: data.tiktok || '',
          company_name: data.company_name || '',
          vat_number: data.vat_number || '',
          kvk_number: data.kvk_number || '',
        })
      }
    })
  }, [user])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    setSaved(false)

    await supabase.from('profiles').upsert({
      id: user.id,
      ...form,
      email: user.email,
      updated_at: new Date().toISOString(),
    })

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading || !user) {
    return <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center"><div className="text-[#888] text-[14px]">Laden...</div></div>
  }

  const inputClass = "w-full px-4 py-3 rounded-xl border border-[#ddd] bg-white text-[14px] focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/20 transition"
  const labelClass = "text-[11px] font-semibold tracking-[0.1em] uppercase text-[#888] mb-1.5 block"

  return (
    <div className="min-h-screen bg-[#FAFAFA] pt-24">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <h1 className="font-['Cormorant_Garamond'] text-[36px] text-[#1a1a1a] mb-2">Profiel</h1>
        <p className="text-[14px] text-[#888] mb-8">Beheer je persoonlijke gegevens</p>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Personal */}
          <div className="bg-white rounded-2xl p-6 border border-[#eee]">
            <h3 className="text-[13px] font-semibold text-[#1a1a1a] mb-4 tracking-wide">PERSOONLIJK</h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className={labelClass}>Voornaam</label>
                <input value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Achternaam</label>
                <input value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} className={inputClass} />
              </div>
            </div>
            <div>
              <label className={labelClass}>E-mail</label>
              <input value={user.email || ''} disabled className={inputClass + ' bg-[#f9f9f9] text-[#888]'} />
            </div>
            <div className="mt-3">
              <label className={labelClass}>Telefoonnummer</label>
              <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={inputClass} placeholder="+31 6 ..." />
            </div>
          </div>

          {/* Address */}
          <div className="bg-white rounded-2xl p-6 border border-[#eee]">
            <h3 className="text-[13px] font-semibold text-[#1a1a1a] mb-4 tracking-wide">ADRES</h3>
            <div className="space-y-3">
              <div>
                <label className={labelClass}>Straat en huisnummer</label>
                <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className={inputClass} placeholder="Voorbeeldstraat 12" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>Postcode</label>
                  <input value={form.postal_code} onChange={e => setForm({ ...form, postal_code: e.target.value })} className={inputClass} placeholder="1234 AB" />
                </div>
                <div className="col-span-2">
                  <label className={labelClass}>Plaats</label>
                  <input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className={inputClass} placeholder="Arnhem" />
                </div>
              </div>
            </div>
          </div>

          {/* Socials */}
          <div className="bg-white rounded-2xl p-6 border border-[#eee]">
            <h3 className="text-[13px] font-semibold text-[#1a1a1a] mb-4 tracking-wide">SOCIAL MEDIA</h3>
            <div className="space-y-3">
              <div>
                <label className={labelClass}>Instagram</label>
                <input value={form.instagram} onChange={e => setForm({ ...form, instagram: e.target.value })} className={inputClass} placeholder="@gebruikersnaam" />
              </div>
              <div>
                <label className={labelClass}>TikTok</label>
                <input value={form.tiktok} onChange={e => setForm({ ...form, tiktok: e.target.value })} className={inputClass} placeholder="@gebruikersnaam" />
              </div>
            </div>
          </div>

          {/* Business / Invoice */}
          <div className="bg-white rounded-2xl p-6 border border-[#eee]">
            <h3 className="text-[13px] font-semibold text-[#1a1a1a] mb-4 tracking-wide">BEDRIJFSGEGEVENS <span className="text-[#aaa] font-normal">(voor facturen)</span></h3>
            <div className="space-y-3">
              <div>
                <label className={labelClass}>Bedrijfsnaam</label>
                <input value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} className={inputClass} placeholder="Optioneel" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>BTW-nummer</label>
                  <input value={form.vat_number} onChange={e => setForm({ ...form, vat_number: e.target.value })} className={inputClass} placeholder="NL000000000B00" />
                </div>
                <div>
                  <label className={labelClass}>KVK-nummer</label>
                  <input value={form.kvk_number} onChange={e => setForm({ ...form, kvk_number: e.target.value })} className={inputClass} placeholder="12345678" />
                </div>
              </div>
            </div>
          </div>

          <button type="submit" disabled={saving} className="w-full py-3 rounded-full bg-[#D4AF37] text-white font-semibold text-[14px] hover:bg-[#C5A028] transition disabled:opacity-50">
            {saving ? 'Opslaan...' : saved ? '✓ Opgeslagen!' : 'Opslaan'}
          </button>
        </form>

        <button onClick={signOut} className="w-full mt-4 py-3 rounded-full border border-[#eee] text-[#aaa] text-[13px] hover:border-[#ddd] hover:text-[#888] transition">
          Uitloggen
        </button>
      </div>
    </div>
  )
}
