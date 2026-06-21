'use client'

import { useEffect } from 'react'

const WARM_CREAM = '#F3EEE6'

export default function HomepageBgFix() {
  useEffect(() => {
    document.documentElement.style.background = WARM_CREAM
    document.body.style.background = WARM_CREAM
    return () => {
      document.documentElement.style.background = ''
      document.body.style.background = ''
    }
  }, [])
  return null
}
