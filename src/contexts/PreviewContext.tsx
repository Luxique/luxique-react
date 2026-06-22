'use client'

import { createContext, useContext, ReactNode } from 'react'

interface PreviewContextType {
  isPreview: boolean
}

const PreviewContext = createContext<PreviewContextType | undefined>(undefined)

export function PreviewProvider({ isPreview, children }: { isPreview: boolean; children: ReactNode }) {
  return (
    <PreviewContext.Provider value={{ isPreview }}>
      {children}
    </PreviewContext.Provider>
  )
}

export function usePreviewMode() {
  const context = useContext(PreviewContext)
  if (context === undefined) {
    return { isPreview: false }
  }
  return context
}