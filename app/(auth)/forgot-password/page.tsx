'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import supabase from '@/utils/supabase/client' 

const ForgotPassword = () => {

  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?=/reset-password`, 
    })

    if (error) {
      console.log('An error occurred sending reset email.', error)
    } else {
      setSent(true) 
    }
  }

  return (
   <div className="pt-20 flex flex-col items-center gap-8 bg-accent flex-1 px-4">
      <Image
        src="/gladiator-logo-circle.png"
        alt="Gladiator Logo"
        priority
        quality={100}
        width="96"
        height="96"
      />
      <h1 className="font-heading text-4xl font-semibold text-white">Forgot Password</h1>
      
      {sent ? (
        <p className="font-heading text-background font-medium text-2xl">Check your email for reset link!</p>
      ) : (
        <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
          <p className="font-heading text-background font-medium text-2xl">
            Email
          </p>
          <label className="input validator flex items-center gap-2 bg-background w-md p-3 border-2 border-gray-50 shadow-xs rounded-lg focus-within:border-gray-50">
            <svg
              className="h-[1em] opacity-50"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
            >
              <g
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeWidth="2.5"
                fill="none"
                stroke="currentColor"
              >
                <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
              </g>
            </svg>
            <input
              type="email"
              name="email"
              placeholder="Email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="font-heading py-4 focus:outline-none focus:ring-0 placeholder:text-gray-400 focus:placeholder:opacity-0 flex-1"
            />
          </label>
          
          <button type="submit" className=" font-heading text-background font-medium w-md bg-foreground rounded-lg p-3 hover:shadow-xl hover:cursor-pointer">
            Send Password Reset Link
          </button>
        </form>
      )}
    </div>
  )
}

export default ForgotPassword