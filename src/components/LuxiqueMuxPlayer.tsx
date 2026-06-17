'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase-client'
import MuxPlayer from '@mux/mux-player-react'

interface LuxiqueMuxPlayerProps {
  playbackId: string
  variant?: 'hero' | 'lesson'
  title?: string
  style?: React.CSSProperties
  className?: string
  /** If true, fetch a signed playback token before playing */
  signed?: boolean
  /** Required for signed playback: course_id for enrollment check */
  courseId?: string
  /** If true, this is free content — skip enrollment check (still requires login) */
  isFree?: boolean
  /** Called when video playback progresses (0-100 percentage) */
  onProgress?: (pct: number) => void
  /** Called when video ends */
  onEnded?: () => void
}

export default function LuxiqueMuxPlayer({
  playbackId,
  variant = 'lesson',
  title,
  style,
  className,
  signed = false,
  courseId,
  isFree = false,
  onProgress,
  onEnded,
}: LuxiqueMuxPlayerProps) {
  const variantClass = variant === 'hero' ? 'hero-mux-player' : 'lesson-mux-player'
  const [token, setToken] = useState<string | undefined>()
  const [tokenError, setTokenError] = useState(false)

  useEffect(() => {
    if (!signed || !playbackId) return

    let cancelled = false

    async function fetchToken() {
      try {
        // Get the current session token from Supabase
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.access_token) {
          if (!cancelled) setTokenError(true)
          return
        }

        const params = new URLSearchParams({ playback_id: playbackId })
        if (courseId) params.set('course_id', courseId)
        if (isFree) params.set('is_free', 'true')

        const res = await fetch(`/api/mux/playback-token?${params}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        })
        const data = await res.json()
        if (cancelled) return

        if (data.token) {
          setToken(data.token)
        } else {
          setTokenError(true)
        }
      } catch {
        if (!cancelled) setTokenError(true)
      }
    }

    fetchToken()
    return () => { cancelled = true }
  }, [playbackId, signed, isFree, courseId])

  // If signed token required but failed, show locked state
  if (signed && tokenError) {
    return (
      <div style={{
        width: '100%',
        aspectRatio: '16/9',
        borderRadius: '8px',
        background: '#1a1a1a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#666',
        ...style,
      }} className={`${variantClass} ${className || ''}`}>
        🔒 Je hebt geen toegang tot deze les
      </div>
    )
  }

  // If waiting for signed token, show loading
  if (signed && !token && !tokenError) {
    return (
      <div style={{
        width: '100%',
        aspectRatio: '16/9',
        borderRadius: '8px',
        background: '#1a1a1a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#666',
        ...style,
      }} className={`${variantClass} ${className || ''}`}>
        Laden...
      </div>
    )
  }

  return (
    <MuxPlayer
      playbackId={playbackId}
      streamType="on-demand"
      playbackRates={[1, 1.5, 2]}
      volume={1}
      tokens={token ? { playback: token } : undefined}
      metadata={{ video_title: title || 'Luxique' }}
      onTimeUpdate={(e: Event) => {
        const el = e.target as HTMLVideoElement
        if (!el.duration || el.duration === 0) return
        const pct = (el.currentTime / el.duration) * 100
        onProgress?.(pct)
      }}
      onEnded={() => onEnded?.()}
      style={{
        width: '100%',
        aspectRatio: '16/9',
        borderRadius: '8px',
        outline: 'none',
        ...style,
      }}
      className={`${variantClass} ${className || ''}`}
    />
  )
}
