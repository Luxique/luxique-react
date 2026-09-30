import React from 'react'

export type TextAlignment = 'left' | 'center' | 'right'

const OPTIONS: Array<{ value: TextAlignment; label: string }> = [
  { value: 'left', label: 'Links uitlijnen' },
  { value: 'center', label: 'Centreren' },
  { value: 'right', label: 'Rechts uitlijnen' },
]

const AlignIcon = ({ alignment }: { alignment: TextAlignment }) => (
  <span className={`flex w-3 flex-col gap-[2px] ${alignment === 'center' ? 'items-center' : alignment === 'right' ? 'items-end' : 'items-start'}`} aria-hidden="true">
    <span className="h-px w-3 bg-current" />
    <span className="h-px w-2 bg-current" />
    <span className="h-px w-3 bg-current" />
  </span>
)

export default function TextAlignmentControl({ value = 'left', onChange, label = 'Tekstuitlijning' }: {
  value?: TextAlignment
  onChange: (value: TextAlignment) => void
  label?: string
}) {
  return (
    <div className="flex items-center gap-0.5" role="group" aria-label={label}>
      {OPTIONS.map(option => (
        <button
          key={option.value}
          type="button"
          title={option.label}
          aria-label={option.label}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={`flex h-7 w-7 items-center justify-center rounded text-[14px] leading-none transition ${value === option.value ? 'bg-[rgba(196,162,101,0.15)] text-[#C4A265]' : 'text-[#7A7268] hover:bg-[rgba(30,26,20,0.05)]'}`}
        >
          <AlignIcon alignment={option.value} />
        </button>
      ))}
    </div>
  )
}
