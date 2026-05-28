import { Metadata } from 'next'
import BehandelingenContent from './BehandelingenContent'

export const metadata: Metadata = {
  title: 'Behandelingen — Luxique',
  description: 'Premium lash extensions in Amsterdam. Afgestemd op jouw oogvorm, met aandacht.',
}

export default function BehandelingenPage() {
  return (
    <div data-theme-color="#FAF8F4" data-theme-dark="false" className="bg-[#FAF8F4] pt-[90px]">
      <div className="max-w-[1280px] mx-auto px-[14px] max-[860px]:px-[10px] pb-[14px]">
        <BehandelingenContent />
      </div>
    </div>
  )
}
