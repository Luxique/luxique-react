import { Metadata } from 'next'
import BehandelingenContent from './BehandelingenContent'

export const metadata: Metadata = {
  title: 'Behandelingen — Luxique',
  description: 'Premium lash extensions in Amsterdam. Afgestemd op jouw oogvorm, met aandacht.',
}

export default function BehandelingenPage() {
  return (
    <div className="bg-[#F3EEE6] pt-[90px] max-md:pt-[82px]">
      <BehandelingenContent />
    </div>
  )
}
