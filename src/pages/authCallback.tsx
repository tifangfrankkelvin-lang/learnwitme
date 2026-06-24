// src/pages/AuthCallback.tsx
// After a student signs in with Google, they get redirected here.
// This page does 3 things:
// 1. Waits for Supabase to read the token from the URL
// 2. Checks if the student has completed onboarding
// 3. Redirects them to the right page

import { useEffect } from 'react'
// useEffect — runs code after the component loads on screen

import { useNavigate } from 'react-router-dom'
// useNavigate — lets us send the user to a different page programmatically

import { BookOpen } from 'lucide-react'

import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'

export default function AuthCallback() {
  const navigate = useNavigate()
  // setUser and setSession let us save the logged-in user
  // into our global Zustand store so any page can access them
  const { setUser, setSession } = useAuthStore()

  useEffect(() => {
    // onAuthStateChange listens for any change in auth state.
    // When Google redirects back here with a token in the URL,
    // Supabase automatically exchanges it for a session and
    // fires this listener with event = 'SIGNED_IN'
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          // Save the user and session to our global store
          setUser(session.user)
          setSession(session)

          // Check if this student has completed onboarding
          // (picked their exam type and subjects)
          const { data: profile } = await supabase
            .from('profiles')
            .select('onboarding_done')
            .eq('id', session.user.id)
            .single()

          if (profile?.onboarding_done) {
            // Returning student — go straight to dashboard
            navigate('/dashboard')
          } else {
            // New student — go through onboarding first
            navigate('/onboarding')
          }
        }
      }
    )

    // Cleanup: stop listening when the component is removed from screen
    return () => subscription.unsubscribe()
  }, [navigate, setUser, setSession])

  // While waiting for the auth check, show a loading screen
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="text-indigo-600" size={32} />
        <span className="text-2xl font-bold text-gray-900">
          Learn<span className="text-indigo-600">Wit</span>Me
        </span>
      </div>
      {/* Spinning loading circle */}
      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-500">Signing you in...</p>
    </div>
  )
}