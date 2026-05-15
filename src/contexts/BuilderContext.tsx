'use client'

import { createContext } from 'react'

export const BuilderContext = createContext<{
  courseTitle: string
  setCourseTitle: (t: string) => void
  saveCourse: () => void
}>({ courseTitle: '', setCourseTitle: () => {}, saveCourse: () => {} })