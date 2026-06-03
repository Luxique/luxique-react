import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mijn cursus — Luxique Academy',
}

export default function AcademyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        /* Force light theme for academy interior — override root dark */
        .academy-light-shell {
          background: #FAF8F4 !important;
          color: #2C2A25 !important;
          color-scheme: light;
          min-height: 100vh;
          position: relative;
          z-index: 1;
        }
        .academy-light-shell h1,
        .academy-light-shell h2,
        .academy-light-shell p,
        .academy-light-shell span,
        .academy-light-shell a,
        .academy-light-shell div {
          border-color: rgba(12,10,7,0.09);
        }
      ` }} />
      <div className="academy-light-shell">
        {children}
      </div>
    </>
  )
}
