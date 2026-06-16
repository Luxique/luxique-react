import { Metadata } from 'next'
import BehandelingenContent from './BehandelingenContent'

export const metadata: Metadata = {
  title: 'Behandelingen — Luxique',
  description: 'Premium lash extensions in Amsterdam. Afgestemd op jouw oogvorm, met aandacht.',
}

export default function BehandelingenPage() {
  return (
    <div className="bg-[#F3EFE6] px-[14px] max-[860px]:px-[10px]" style={{ paddingTop: 'var(--content-pad-top)' }}>
      <BehandelingenContent />
    </div>
  )
}
