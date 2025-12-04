'use client'

import React from 'react'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import supabase from '@/utils/supabase/client'

// temporary success page

const success = () => {
  const router = useRouter();

  // redirects to menupage after 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/');
    }, 2000);

    return () => clearTimeout(timer)
    
  }, [router]);

  return (
    <div>You have been logged in or Your account has been created.</div>
  )
}

export default success