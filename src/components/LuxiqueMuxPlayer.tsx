'use client'

import MuxPlayer from '@mux/mux-player-react'

interface LuxiqueMuxPlayerProps {
  playbackId: string
  variant?: 'hero' | 'lesson'
  title?: string
  style?: React.CSSProperties
  className?: string
}

export default function LuxiqueMuxPlayer({ 
  playbackId, 
  variant = 'lesson', 
  title,
  style,
  className 
}: LuxiqueMuxPlayerProps) {
  const variantClass = variant === 'hero' ? 'hero-mux-player' : 'lesson-mux-player'

  return (
    <MuxPlayer
      playbackId={playbackId}
      streamType="on-demand"
      playbackRates={[1, 1.5, 2]}
      volume={1}
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
