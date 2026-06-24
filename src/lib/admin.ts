// src/lib/admin.ts
// Helper to check if the current logged-in user has admin privileges.
// We check the JWT's app_metadata, which we set manually in Supabase
// via SQL: UPDATE auth.users SET raw_app_meta_data = ... role: admin

import { supabase } from './supabase'

export async function isCurrentUserAdmin(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return false

  // app_metadata is embedded directly in the JWT — no extra DB call needed
  const role = session.user.app_metadata?.role
  return role === 'admin'
}