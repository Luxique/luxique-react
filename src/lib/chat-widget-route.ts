export function shouldHideChatWidget(pathname: string | null): boolean {
  return Boolean(
    pathname?.startsWith('/admin')
    || pathname?.startsWith('/dashboard')
    || pathname?.match(/^\/[a-z]{2}\/dashboard(?:\/|$)/)
    || pathname?.match(/^\/[a-z]{2}\/academy\/[^/]+\/[^/]+(?:\/|$)/)
    || pathname?.startsWith('/academy')
    || pathname?.startsWith('/cursus')
  )
}
