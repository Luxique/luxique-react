'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase-client'
import {
  AdminDashboardMobileNav,
  AdminDashboardSidebar,
} from '@/components/AdminDashboardNav'

export default function LuxKnowledgePage() {
  const { user, loading, role } = useAuth()
  const router = useRouter()
  const [content, setContent] = useState('')
  const [updatedAt, setUpdatedAt] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [toast, setToast] = useState<{ msg: string; visible: boolean }>({
    msg: '',
    visible: false,
  })
  const [prevContent, setPrevContent] = useState<string | null>(null)
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
      setToast({
        msg: '✓ Opgeslagen! Lux gebruikt de nieuwe kennis binnen 60 seconden.',
        visible: true,
      })
      setTimeout(() => setToast((t) => ({ ...t, visible: false })), 4000)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(`Onverwachte fout bij opslaan: ${err}`)
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F4] flex items-center justify-center pt-[50px]">
        <div className="w-8 h-8 border-2 border-[#C4A265] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#F5F5F4] flex items-center justify-center flex-col gap-4 pt-[50px]">
        <div className="text-[#888] text-[14px]">Geen toegang.</div>
        <a href="/dashboard" className="text-[13px] text-[#C4A265]">
          ← Terug
        </a>
      </div>
    )
  }

  return (
    <>
      <style jsx global>{`
        html,
        body {
          font-family: 'Outfit', sans-serif;
          -webkit-font-smoothing: antialiased;
        }
      `}</style>

      {/* Toast notification */}
      <div
        style={{
          position: 'fixed',
          top: 'calc(env(safe-area-inset-top) + 70px)',
          right: 24,
          zIndex: 9999,
          background: '#0C0A07',
          color: '#fff',
          padding: '14px 22px',
          borderRadius: 14,
          border: '1px solid rgba(196,162,101,.35)',
          boxShadow: '0 16px 40px -12px rgba(12,10,7,.35)',
          fontSize: '.92rem',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          opacity: toast.visible ? 1 : 0,
          transform: toast.visible ? 'translateX(0)' : 'translateX(120%)',
          transition:
            'opacity .4s cubic-bezier(.16,1,.3,1), transform .4s cubic-bezier(.16,1,.3,1)',
          pointerEvents: toast.visible ? 'auto' : 'none',
          maxWidth: 380,
        }}
      >
        <span style={{ fontSize: '1.3rem' }}>✓</span>
        <span>{toast.msg}</span>
      </div>
      <div className="min-h-screen bg-[#F5F5F4] pt-[50px]">
        <AdminDashboardMobileNav active="knowledge" />
        <div className="mx-auto flex w-full max-w-none flex-col gap-4 px-4 py-6 sm:px-6 sm:py-8 xl:flex-row xl:gap-6">
          <AdminDashboardSidebar active="knowledge" />
          <div className="min-w-0 flex-1">
            <div className="mx-auto w-full max-w-[900px] space-y-5">
              <div className="bg-white rounded-2xl border border-[#eee] p-5 sm:p-6">
                <h1 className="font-['Cormorant_Garamond',serif] text-[32px] sm:text-[38px] font-light leading-none tracking-[-0.02em] text-[#1a1a1a]">
                  Lux Kennisbank
                </h1>
                <p className="mt-3 text-[13px] sm:text-[14px] leading-relaxed text-[#888]">
                  Beheer de kennis die Lux (de AI-chatbot) gebruikt om bezoekers
                  te helpen. Wijzigingen zijn binnen 60 seconden actief.
                </p>
                {updatedAt && (
                  <p className="mt-2 text-[11px] text-[#aaa]">
                    Laatst bijgewerkt:{' '}
                    {new Date(updatedAt).toLocaleString('nl-NL', {
                      dateStyle: 'long',
                      timeStyle: 'short',
                    })}
                  </p>
                )}
              </div>

              {loadingData ? (
                <div className="bg-white rounded-2xl border border-[#eee] px-5 py-16 text-center">
                  <div className="w-8 h-8 border-2 border-[#C4A265] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="mt-4 text-[13px] text-[#888]">
                    Kennis laden...
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-[#eee] p-4 sm:p-6">
                  {error && (
                    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
                      ⚠️ {error}
                    </div>
                  )}

                  {saved && null}

                  <div className="mx-auto w-full max-w-[820px]">
                    <textarea
                      id="lux-knowledge-textarea"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="min-h-[500px] w-full resize-y rounded-xl border border-[#ddd] bg-white px-4 py-4 font-mono text-[13px] leading-relaxed text-[#1a1a1a] outline-none transition focus:border-[#C4A265] sm:px-5"
                      placeholder="Voer hier de kennisbank tekst in die Lux gebruikt..."
                    />

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <div className="flex flex-wrap gap-2 sm:mr-auto">
                        <button
                          onClick={() => {
                            const ta = document.getElementById(
                              'lux-knowledge-textarea',
                            ) as HTMLTextAreaElement
                            if (!ta) return
                            ta.focus()
                            ta.select()
                            document.execCommand('selectAll')
                          }}
                          className="rounded-full border border-[#eee] px-3.5 py-2 text-[11.5px] font-medium text-[#888] transition hover:border-[rgba(30,26,20,0.18)] hover:text-[#1a1a1a]"
                        >
                          📋 Alles selecteren
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(content)
                              setToast({
                                msg: '📋 Kennisbank gekopieerd naar klembord!',
                                visible: true,
                              })
                              setTimeout(
                                () =>
                                  setToast((t) => ({ ...t, visible: false })),
                                3000,
                              )
                            } catch {
                              // Fallback for older browsers
                              const ta = document.getElementById(
                                'lux-knowledge-textarea',
                              ) as HTMLTextAreaElement
                              if (ta) {
                                ta.select()
                                document.execCommand('copy')
                              }
                              setToast({
                                msg: '📋 Kennisbank gekopieerd!',
                                visible: true,
                              })
                              setTimeout(
                                () =>
                                  setToast((t) => ({ ...t, visible: false })),
                                3000,
                              )
                            }
                          }}
                          disabled={!content.trim()}
                          className="rounded-full border border-[#eee] px-3.5 py-2 text-[11.5px] font-medium text-[#888] transition hover:border-[rgba(30,26,20,0.18)] hover:text-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          📄 Kopiëren
                        </button>
                        <button
                          onClick={() => {
                            if (!content.trim()) return
                            setPrevContent(content)
                            setContent('')
                            setToast({
                              msg: '🗑 Tekst gewist. Klik ↩️ Ongedaan maken om terug te halen.',
                              visible: true,
                            })
                            setTimeout(
                              () => setToast((t) => ({ ...t, visible: false })),
                              5000,
                            )
                          }}
                          disabled={!content.trim()}
                          className="rounded-full border border-red-200 px-3.5 py-2 text-[11.5px] font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          🗑 Wissen
                        </button>
                        {prevContent !== null && (
                          <button
                            onClick={() => {
                              setContent(prevContent)
                              setPrevContent(null)
                              setToast({
                                msg: '↩️ Tekst hersteld!',
                                visible: true,
                              })
                              setTimeout(
                                () =>
                                  setToast((t) => ({ ...t, visible: false })),
                                3000,
                              )
                            }}
                            className="rounded-full border border-green-200 bg-green-50 px-3.5 py-2 text-[11.5px] font-medium text-green-700 transition hover:bg-green-100"
                          >
                            ↩️ Ongedaan maken
                          </button>
                        )}
                      </div>
                      <button
                        onClick={fetchKnowledge}
                        className="rounded-xl border border-[#ddd] bg-white px-5 py-2.5 text-[12px] font-semibold text-[#888] transition hover:border-[#C4A265] hover:text-[#1a1a1a]"
                      >
                        Annuleren
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving || !content.trim()}
                        className="rounded-xl bg-[#C4A265] px-6 py-2.5 text-[12px] font-bold text-[#0C0A07] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {saving ? 'Opslaan...' : 'Opslaan'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
