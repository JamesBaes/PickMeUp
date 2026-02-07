'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);


  const router = useRouter();


  // checking for a valid session.
  useEffect(() => {
    const checkSession = async() => {

    }
  })



  // TEMPORARY RESET PASSWORD SUBMIT. ACTUAL LOGIC NEEDS TO BE IMPLEMENTED STILL I COULDNT FIGURE OUT AS I NEED TO WORK ON THE VIDEO NOW...
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewPassword(e.target.value);
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
  };

  const passwordsMatch = newPassword === confirmPassword;

  return (
    <div className="pt-20 flex flex-col items-center gap-8 bg-accent flex-1 px-4 ">
      {showSuccess && (
        <div role="alert" className="alert alert-info mt-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="h-6 w-6 shrink-0 stroke-current"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          <span>Password Successfully Updated.</span>
        </div>
      )}
      <Image
        src="/gladiator-logo-circle.png"
        alt="Gladiator Logo"
        priority
        quality={100}
        width="96"
        height="96"
      />
      <h2 className="font-heading text-4xl font-semibold text-white">Reset Password</h2>
      <form onSubmit={handleSubmit} className="flex flex-col">
        <div className="flex flex-col flex-1 gap-2">
          <p className="font-heading text-background font-medium text-2xl">
            New Password
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
                <path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"></path>
                <circle cx="16.5" cy="7.5" r=".5" fill="currentColor"></circle>
              </g>
            </svg>
            <input
              type="password"
              name="password"
              placeholder="Enter new password"
              required
              value={newPassword}
              onChange={handlePasswordChange}
              className="font-heading py-4 focus:outline-none focus:ring-0 placeholder:text-gray-400 focus:placeholder:opacity-0"
            />
          </label>
          <div className="flex flex-col flex-1 gap-2 mt-4">
            <p className="font-heading text-background font-medium text-2xl">
              Confirm New Password
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
                  <path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"></path>
                  <circle cx="16.5" cy="7.5" r=".5" fill="currentColor"></circle>
                </g>
              </svg>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm new password"
                required
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                className="font-heading py-4 focus:outline-none focus:ring-0 placeholder:text-gray-400 focus:placeholder:opacity-0"
              />
            </label>
          </div>
          {confirmPassword && !passwordsMatch && (
            <div className="text-background font-heading text-sm font-bold text-right mt-2">
              Passwords do not match
            </div>
          )}
          <button
            type="submit"
            className="w-md bg-foreground rounded-lg p-3 hover:shadow-xl hover:cursor-pointer mt-4"
            disabled={!passwordsMatch || !newPassword || !confirmPassword}
          >
            <p className="font-heading font-medium text-lg text-background">
              Reset Password
            </p>
          </button>
        </div>  
      </form>
    </div>
  )
}

export default ResetPassword;
