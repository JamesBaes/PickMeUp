import React from 'react'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

const Account = async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen px-4 py-10 md:px-8 lg:px-20">
      <h1 className="font-heading text-3xl font-bold text-accent">Account</h1>
      <p className="mt-4 text-base text-foreground">
        Logged in as {user.email}
      </p>
    </div>
  )
}

export default Account