'use client'

interface AmbientGlowProps {
  color?: 'gold' | 'green' | 'both'
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center'
  intensity?: 'subtle' | 'medium' | 'strong'
  grain?: boolean
  className?: string
}

export default function AmbientGlow({
  color = 'gold',
  position = 'top-left',
  intensity = 'medium',
  grain = false,
  className = '',
}: AmbientGlowProps) {
  const posClass = `glow-${position}`
  const colorClass = `glow-${color}`
  const intClass = `glow-${intensity}`

  return (
    <div
      className={`ambient-glow ${posClass} ${colorClass} ${intClass} ${className}`}
      aria-hidden="true"
    >
      {grain && (
        <svg className="grain-layer" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <filter id={`grain-${position}-${color}`}>
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter={`url(#grain-${position}-${color})`} opacity="0.4" />
        </svg>
      )}
    </div>
  )
}
