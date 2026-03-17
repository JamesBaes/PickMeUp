'use server'

import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/utils/supabase/server'
import { headers } from 'next/headers'

export async function sendPasswordReset(email: string): Promise<{ error?: string }> {
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Check if the email exists in auth.users via the admin API
  const { data, error: listError } = await adminClient.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  })

  if (listError) {
    return { error: 'An error occurred. Please try again.' }
  }

  const userExists = data.users.some(
    (user) => user.email?.toLowerCase() === email.toLowerCase()
  )

  // Silently return success if email not found — prevents attackers from
  // determining which email addresses are registered (email enumeration).
  if (!userExists) {
    return {}
  }

  // Build redirectTo from request headers (avoids window.location in server context)
  const headersList = await headers()
  const host = headersList.get('host') ?? ''
  const protocol = host.startsWith('localhost') ? 'http' : 'https'
  const origin = `${protocol}://${host}`

  const supabase = await createServerClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  })

  if (error) {
    return { error: 'Failed to send reset email. Please try again.' }
  }

  return {}
}
