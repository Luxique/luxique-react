'use client'

import { useState, useEffect } from 'react'
import MuxPlayer from '@mux/mux-player-react'

interface LuxiqueMuxPlayerProps {
  playbackId: string
  variant?: 'hero' | 'lesson'
  title?: string
  style?: React.CSSProperties
  className?: string
  /** If true, fetch a signed playback token before playing */
  signed?: boolean
  /** Required for signed playback: user_id for enrollment check */
  userId?: string
  /** Required for signed playback: course_id for enrollment check */
  courseId?: string
  /** If true, this is free content — skip signed token request */
  isFree?: boolean
}

export default function LuxiqueMuxPlayer({ 
  playbackId, 
  variant = 'lesson', 
  title,
  style,
  className,
  signed = false,
  userId,
  courseId,
  isFree = false,
}: LuxiqueMuxPlayerProps) {
  const variantClass = variant === 'hero' ? 'hero-mux-player' : 'lesson-mux-player'
  const [token, setToken] = useState<string | undefined>()
  const [tokenError, setTokenError] = useState(false)

  useEffect(() => {
    if (!signed || isFree || !playbackId) return

    const params = new URLSearchParams({ playback_id: playbackId })
    if (userId) params.set('user_id', userId)
    if (courseId) params.set('course_id', courseId)
    if (isFree) params.set('is_free', 'true')

    fetch(`/api/mux/playback-token?${params}`)
      .then(r => r.json())
      .then(data => {
        if (data.token) setToken(data.token)
        else if (data.error) setTokenError(true)
      })
      .catch(() => setTokenError(true))
  }, [playbackId, signed, isFree, userId, courseId])

  // If signed token required but failed, show locked state
  if (signed && !isFree && tokenError) {
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
  if (signed && !isFree && !token && !tokenError) {
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
