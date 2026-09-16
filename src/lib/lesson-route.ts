import { useSyncExternalStore } from 'react'
import { usePathname } from 'next/navigation'

const LESSON_PATH = /^\/(?:[a-z]{2}\/)?academy\/[^/]+\/[^/]+(?:\/|$)/
const subscribe = () => () => {}

export function isLessonPathname(pathname: string | null | undefined) {
  return Boolean(pathname && LESSON_PATH.test(pathname))
}

/**
 * `usePathname()` can differ between the server render and the browser's first
 * render when locale redirects/rewrites are involved. Keep the hydration pass
 * deterministic, then derive the lesson chrome after the component mounts.
 */
export function useHydrationSafeLessonRoute() {
  const pathname = usePathname()

  return useSyncExternalStore(
    subscribe,
    () => isLessonPathname(pathname),
    () => false,
  )
}
