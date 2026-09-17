export function isCustomerAcademyRoute(pathname: string | null): boolean {
  return Boolean(pathname?.match(/^\/(?:[a-z]{2}\/)?academy\/[^/]+(?:\/|$)/))
}

export function shouldHideChatWidget(pathname: string | null): boolean {
  return Boolean(
    pathname?.startsWith('/admin')
    || pathname?.startsWith('/dashboard')
    || pathname?.match(/^\/[a-z]{2}\/dashboard(?:\/|$)/)
    || isCustomerAcademyRoute(pathname)
    || pathname?.startsWith('/academy')
    || pathname?.startsWith('/cursus')
  )
}
