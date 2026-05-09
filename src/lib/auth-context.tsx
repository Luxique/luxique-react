'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import type { User, Session } from '@supabase/supabase-js'

type AuthContextType = {
  user: User | null
  session: Session | null
  loading: boolean
  role: 'admin' | 'student' | null
  enrollments: Enrollment[]
  signOut: () => Promise<void>
}

type Enrollment = {
  course_id: string
  status: string
  enrolled_at: string
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  role: null,
  enrollments: [],
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState<'admin' | 'student' | null>(null)
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])

  const fetchRole = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()
    // Only update if we got a result — keep existing role if fetch fails
    if (data?.role) {
      setRole(data.role === 'admin' ? 'admin' : 'student')
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) fetchRole(session.user.id)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        // Skip INITIAL_SESSION — already handled by getSession above
        if (_event === 'INITIAL_SESSION') return
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) fetchRole(session.user.id)
        else {
          setRole(null)
          setEnrollments([])
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!user) return
    supabase
      .from('enrollments')
      .select('course_id, status, enrolled_at')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .then(({ data }) => setEnrollments(data || []))
  }, [user])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    setRole(null)
    setEnrollments([])
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, role, enrollments, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
