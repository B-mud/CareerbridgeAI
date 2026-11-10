"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>
  signInWithGoogle: () => Promise<{ error: any }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (!error && data.session) {
      // Check if user has a resume in the database
      try {
        const response = await fetch('http://localhost:8000/api/resume/latest', {
          headers: {
            'Authorization': `Bearer ${data.session.access_token}`
          }
        })
        
        if (response.ok) {
          const resumeData = await response.json()
          if (resumeData && resumeData.file_id) {
            // User has a resume, go straight to dashboard
            router.push('/dashboard')
            return { error: null }
          }
        }
      } catch (err) {
        console.error("Error checking for existing resume:", err)
      }
      
      // No resume found or error occurred, go to get-started
      router.push('/get-started')
    }
    
    return { error }
  }

  const signUp = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    })
    
    if (!error && data.user) {
      console.log('✅ Signup successful:', {
        userId: data.user.id,
        email: data.user.email,
        name: name
      })
      
      // Redirect to get-started page to collect user information
      router.push('/get-started')
    } else if (error) {
      console.error('❌ Signup error:', error.message)
    }
    
    return { error, user: data.user }
  }

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth-callback`,
        // Always show the Google account picker, never auto-select
        queryParams: { prompt: 'select_account' },
      },
    })
    
    if (error) {
      console.error('❌ Google sign-in error:', error.message)
    }
    
    return { error }
  }

  const signOut = async () => {
    try {
      // Immediately clear React state so UI updates at once
      setUser(null)
      setSession(null)

      // Sign out globally (invalidates token on Supabase server for all tabs/devices)
      await Promise.race([
        supabase.auth.signOut({ scope: 'global' }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
      ])
    } catch (error) {
      console.warn('⚠️ Supabase signOut failed (offline?), continuing with local logout:', error)
    } finally {
      // Wipe every piece of local/session storage (app data + all Supabase tokens)
      if (typeof window !== 'undefined') {
        sessionStorage.clear()
        // Remove all supabase-related keys from localStorage individually
        // so the browser never auto-restores a previous session
        Object.keys(localStorage)
          .filter(key => key.startsWith('sb-') || key.includes('supabase'))
          .forEach(key => localStorage.removeItem(key))
        // Also clear any app-specific keys
        localStorage.clear()
      }
      // Always redirect to signin (not home) so user must authenticate again
      router.push('/signin')
    }
  }

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
