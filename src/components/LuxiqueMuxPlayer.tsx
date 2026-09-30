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
  const [thumbnailToken, setThumbnailToken] = useState<string | undefined>()
  const [tokenError, setTokenError] = useState(false)
  const [posterState, setPosterState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [hasStarted, setHasStarted] = useState(false)

  useEffect(() => {
    setHasStarted(false)
  }, [playbackId])

  useEffect(() => {
    // Reset token state when signed changes to false
    if (!signed) {
      setToken(undefined)
      setThumbnailToken(undefined)
      setTokenError(false)
      return
    }

    if (!playbackId) return

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
          setThumbnailToken(data.thumbnailToken)
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

  const poster = signed
    ? (thumbnailToken
      ? `https://image.mux.com/${playbackId}/thumbnail.jpg?token=${encodeURIComponent(thumbnailToken)}`
      : undefined)
    : `https://image.mux.com/${playbackId}/thumbnail.jpg?time=3&width=1600`

  // Preload the poster so a failed image never exposes the player's black
  // background. This is safe for existing videos too: posters are generated
  // on demand from every ready Mux asset, with no migration required.
  useEffect(() => {
    if (!poster) {
      setPosterState('loading')
      return
    }

    let cancelled = false
    setPosterState('loading')
    const image = new Image()
    image.onload = () => { if (!cancelled) setPosterState('ready') }
    image.onerror = () => { if (!cancelled) setPosterState('error') }
    image.src = poster

    return () => { cancelled = true }
  }, [poster])

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
    <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: '8px', overflow: 'hidden', ...style }}>
      <MuxPlayer
        playbackId={playbackId}
        streamType="on-demand"
        playbackRates={[1, 1.5, 2]}
        volume={1}
        poster={posterState === 'ready' ? poster : undefined}
        tokens={token ? { playback: token, thumbnail: thumbnailToken } : undefined}
        metadata={{ video_title: title || 'Luxique' }}
        onPlay={() => setHasStarted(true)}
        onTimeUpdate={(e: Event) => {
          const el = e.target as HTMLVideoElement
          if (!el.duration || el.duration === 0) return
          const pct = (el.currentTime / el.duration) * 100
          onProgress?.(pct)
        }}
        onEnded={() => onEnded?.()}
        style={{
          width: '100%',
          height: '100%',
          aspectRatio: '16/9',
          borderRadius: '8px',
          outline: 'none',
        }}
        className={`${variantClass} ${className || ''}`}
      />
      {!hasStarted && posterState !== 'ready' && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #F4F0E8 0%, #E8DFD0 100%)',
          }}
        >
          <div style={{
            width: 58,
            height: 58,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#C4A265',
            background: 'rgba(255,255,255,0.82)',
            boxShadow: '0 8px 28px rgba(30,26,20,0.12)',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 3 }}>
              <path d="M8 5.5v13l10-6.5z" />
            </svg>
          </div>
        </div>
      )}
    </div>
  )
}
