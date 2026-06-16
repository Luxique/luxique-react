import { Metadata } from 'next'
import BehandelingenContent from './BehandelingenContent'

export const metadata: Metadata = {
  title: 'Behandelingen — Luxique',
  description: 'Premium lash extensions in Arnhem. Afgestemd op jouw oogvorm, met aandacht.',
}

export default function BehandelingenPage() {
  return (
    <div className="bg-[#F3EFE7]" style={{ paddingTop: 'var(--content-pad-top)' }}>
      <BehandelingenContent />
    </div>
  )
}
