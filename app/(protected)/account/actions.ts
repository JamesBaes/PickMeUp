'use server'

import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function deleteAccount(): Promise<{ error: string } | void> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Delete auth user — cascade handles all linked table rows automatically
  const { error } = await adminClient.auth.admin.deleteUser(user.id)
  if (error) return { error: 'Failed to delete account. Please contact support.' }

  await supabase.auth.signOut()
  redirect('/')
}
