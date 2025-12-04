'use client'
import React from 'react'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'


// temporary error page
const ErrorPage = () => {

  const router = useRouter();


  // redirects to main menu page after 2 seconds on the error page
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/');
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div>An error occurred trying to log you in or sign you up. Rerouting you back to the menu page.</div>

  )
}

export default ErrorPage