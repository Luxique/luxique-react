export const metadata = {
  title: 'Mijn cursus — Luxique Academy',
}

export default function AcademyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div style={{ colorScheme: 'light' }}>
      {children}
    </div>
  )
}
