'use client'

import { useEffect } from 'react'

export default function HomepageBgFix() {
  useEffect(() => {
    document.documentElement.style.background = '#FAF8F4'
    document.body.style.background = '#FAF8F4'
    return () => {
      document.documentElement.style.background = ''
      document.body.style.background = ''
    }
  }, [])
  return null
}
