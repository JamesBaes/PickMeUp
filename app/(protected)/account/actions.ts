'use server'

import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function deleteAccount(): Promise<{ error: string } | void> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const userId = user.id
  const userEmail = user.email

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  try {
    // Anonymize orders (linked by email — preserve rows for business records)
    if (userEmail) {
      const { error } = await adminClient
        .from('orders')
        .update({ customer_email: null, customer_name: null, customer_phone: null })
        .eq('customer_email', userEmail)
      if (error) return { error: 'Failed to remove your data. Please try again.' }
    }

    // Delete favorites
    const { error: favError } = await adminClient
      .from('favorites')
      .delete()
      .eq('customer_id', userId)
    if (favError) return { error: 'Failed to remove your data. Please try again.' }

    // Delete cart items
    const { error: cartError } = await adminClient
      .from('cart_items')
      .delete()
      .eq('user_id', userId)
    if (cartError) return { error: 'Failed to remove your data. Please try again.' }

    // Delete profile row (staff/admin only — no-op if doesn't exist)
    await adminClient.from('profiles').delete().eq('id', userId)

    // Delete auth user — point of no return
    const { error: authError } = await adminClient.auth.admin.deleteUser(userId)
    if (authError) return { error: 'Failed to delete account. Please contact support.' }
  } catch {
    return { error: 'An unexpected error occurred. Please try again.' }
  }

  await supabase.auth.signOut()
  redirect('/')
}
