'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase-client'
import Navbar from '@/components/Navbar'

export default function LuxKnowledgePage() {
  const { user, loading, role } = useAuth()
  const router = useRouter()
  const [content, setContent] = useState('')
  const [updatedAt, setUpdatedAt] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [loadingData, setLoadingData] = useState(true)

  // EXACT same pattern as working admin/page.tsx:
  // Only redirect to login if !loading && !user (not logged in).
  // Don't check role in the redirect — handle non-admin with a message.
  useEffect(() => {
    if (!loading && !user) router.push('/login?redirect=/admin/lux-knowledge')
  }, [user, loading, router])

  useEffect(() => {
    if (!user || role !== 'admin') return
    fetchKnowledge()
  }, [user, role])

  const fetchKnowledge = async () => {
    setLoadingData(true)
    setError('')
    try {
      const { data, error: fetchError } = await supabase
        .from('lux_knowledge')
        .select('content, updated_at')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        setError(`Fout bij laden: ${fetchError.message}`)
      } else if (data?.content) {
        setContent(data.content)
        setUpdatedAt(data.updated_at)
      }
    } catch (err) {
      setError(`Onverwachte fout: ${err}`)
    }
    setLoadingData(false)
  }

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    setError('')

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session?.access_token) {
        setError('Sessie verlopen. Log opnieuw in.')
        setSaving(false)
        return
      }

      // Delete existing rows and insert new one
      const { error: deleteError } = await supabase
        .from('lux_knowledge')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')

      if (deleteError) {
        setError(`Opslaan mislukt: ${deleteError.message}`)
        setSaving(false)
        return
      }

      const { data: insertData, error: insertError } = await supabase
        .from('lux_knowledge')
        .insert({
          content,
          updated_by: user?.id,
        })
        .select('updated_at')
        .single()

      if (insertError) {
        setError(`Opslaan mislukt: ${insertError.message}`)
        setSaving(false)
        return
      }

      if (insertData?.updated_at) {
        setUpdatedAt(insertData.updated_at)
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(`Onverwachte fout bij opslaan: ${err}`)
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-[#F3EFE7] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#B08D4F] border-t-transparent rounded-full animate-spin" />
        </div>
      </>
    )
  }

  if (role !== 'admin') {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-[#F3EFE7] flex items-center justify-center flex-col gap-4">
          <div className="text-[#888] text-[14px]">Geen toegang.</div>
          <a href="/dashboard" className="text-[13px] text-[#D4AF37]">← Terug</a>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#F3EFE7]" style={{ paddingTop: 'var(--content-pad-top)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
          <div style={{ marginBottom: 32 }}>
            <h1 className="font-['Cormorant_Garamond']" style={{ fontWeight: 600, fontSize: 'clamp(2rem, 4vw, 2.8rem)', color: '#1C1814', marginBottom: 8 }}>
              Lux Kennisbank
            </h1>
            <p style={{ color: '#888', fontSize: '.95rem' }}>
              Beheer de kennis die Lux (de AI-chatbot) gebruikt om bezoekers te helpen.
              Wijzigingen zijn binnen 60 seconden actief.
            </p>
            {updatedAt && (
              <p style={{ color: '#888', fontSize: '.82rem', marginTop: 8 }}>
                Laatst bijgewerkt: {new Date(updatedAt).toLocaleString('nl-NL', { dateStyle: 'long', timeStyle: 'short' })}
              </p>
            )}
          </div>

          {loadingData ? (
            <div style={{ textAlign: 'center', padding: 48 }}>
              <div className="w-8 h-8 border-2 border-[#B08D4F] border-t-transparent rounded-full animate-spin mx-auto" />
              <p style={{ color: '#888', marginTop: 16, fontSize: '.9rem' }}>Kennis laden...</p>
            </div>
          ) : (
            <>
              {error && (
                <div style={{
                  background: 'rgba(229,85,85,.08)',
                  border: '1px solid rgba(229,85,85,.3)',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 20,
                  color: '#c44',
                  fontSize: '.9rem',
                }}>
                  ⚠️ {error}
                </div>
              )}

              {saved && (
                <div style={{
                  background: 'rgba(34,139,34,.08)',
                  border: '1px solid rgba(34,139,34,.3)',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 20,
                  color: '#2a8c2a',
                  fontSize: '.9rem',
                }}>
                  ✓ Opgeslagen! Lux gebruikt de nieuwe kennis binnen 60 seconden.
                </div>
              )}

              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                style={{
                  width: '100%',
                  minHeight: 500,
                  padding: 20,
                  borderRadius: 16,
                  border: '1px solid rgba(28,24,20,.13)',
                  background: '#FBF8F2',
                  color: '#1C1814',
                  fontSize: '.9rem',
                  fontFamily: 'monospace',
                  lineHeight: 1.6,
                  outline: 'none',
                  resize: 'vertical',
                }}
                placeholder="Voer hier de kennisbank tekst in die Lux gebruikt..."
              />

              <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'flex-end' }}>
                <button
                  onClick={fetchKnowledge}
                  style={{
                    padding: '12px 24px',
                    borderRadius: 100,
                    border: '1px solid rgba(28,24,20,.13)',
                    color: '#888',
                    fontWeight: 500,
                    fontSize: '.9rem',
                    background: 'transparent',
                    cursor: 'pointer',
                  }}
                >
                  Annuleren
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !content.trim()}
                  style={{
                    padding: '12px 32px',
                    borderRadius: 100,
                    background: '#B08D4F',
                    color: '#fff',
                    fontWeight: 500,
                    fontSize: '.9rem',
                    border: 'none',
                    cursor: 'pointer',
                    opacity: (saving || !content.trim()) ? .4 : 1,
                  }}
                >
                  {saving ? 'Opslaan...' : 'Opslaan'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
