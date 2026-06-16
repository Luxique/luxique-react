import { Metadata } from 'next'
import BehandelingenContent from './BehandelingenContent'

export const metadata: Metadata = {
  title: 'Behandelingen — Luxique',
  description: 'Premium lash extensions in Amsterdam. Afgestemd op jouw oogvorm, met aandacht.',
}

export default function BehandelingenPage() {
  return (
    <div className="bg-[#F3EEE6] pt-[calc(env(safe-area-inset-top)+90px)] max-md:pt-[calc(env(safe-area-inset-top)+82px)] px-[14px] max-[860px]:px-[10px]">
      <BehandelingenContent />
    </div>
  )
}
