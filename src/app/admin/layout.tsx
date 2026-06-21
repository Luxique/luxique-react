import { AuthProvider } from '@/lib/auth-context'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ChatWidget from '@/components/ChatWidget'
import CookieBanner from '@/components/CookieBanner'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Navbar />
      <main>{children}</main>
      <Footer />
      <ChatWidget />
      <CookieBanner />
    </AuthProvider>
  )
}
