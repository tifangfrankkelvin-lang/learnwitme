// src/stores/authStore.ts
import { create } from 'zustand'
import type { User, Session } from '@supabase/supabase-js'

// This defines the shape of our auth state —
// what data we're storing and what actions we can perform.
interface AuthState {
  user: User | null        // The logged-in user object (null if not logged in)
  session: Session | null  // The active session (contains the access token)
  loading: boolean         // True while we're checking if a user is logged in
  setUser: (user: User | null) => void
  setSession: (session: Session | null) => void
  setLoading: (loading: boolean) => void
}

// create() makes a global store — any component in the app
// can import and read/update this without passing props around.
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: true,
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setLoading: (loading) => set({ loading }),
}))