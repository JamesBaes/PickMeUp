'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import supabase from '@/utils/supabase/client'

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/forgot-password');
      } else {
        setIsValidSession(true);
      }
    };
    checkSession();
  }, [router]);

  const passwordsMatch = newPassword === confirmPassword;
  const passwordMeetsRequirements =
    newPassword.length >= 8 &&
    /[A-Z]/.test(newPassword) &&
    /[0-9]/.test(newPassword);
  const canSubmit =
    passwordMeetsRequirements &&
    passwordsMatch &&
    !!newPassword &&
    !!confirmPassword &&
    !isLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      setIsLoading(false);
      return;
    }

    if (!/[A-Z]/.test(newPassword)) {
      setError('Password must contain an uppercase letter');
      setIsLoading(false);
      return;
    }

    if (!/[0-9]/.test(newPassword)) {
      setError('Password must contain a number');
      setIsLoading(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (updateError) {
      setError(updateError.message);
      setIsLoading(false);
      return;
    }

    await supabase.auth.signOut();

    setShowSuccess(true);
    setTimeout(() => {
      router.push('/login');
    }, 2000);
  };

  if (!isValidSession) {
    return (
      <div className="flex flex-col items-center gap-6 flex-1 bg-background pt-16 px-4">
        <p className="font-heading text-foreground text-lg">Verifying session...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 flex-1 bg-background pt-16 px-4">
      <Image
        src="/gladiator-logo-circle.png"
        alt="Gladiator Logo"
        priority
        quality={100}
        width={80}
        height={80}
      />
      <h1 className="font-heading text-4xl font-black text-center leading-tight text-neutral-700">
        Reset Password
      </h1>

      <form onSubmit={handleSubmit} className="flex gap-4 flex-col w-full max-w-sm">
        {showSuccess && (
          <div role="alert" className="alert alert-success font-heading text-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="h-5 w-5 shrink-0 stroke-current"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Password successfully updated. Redirecting to login...</span>
          </div>
        )}

        {error && (
          <div role="alert" className="alert alert-error font-heading text-sm">
            <span>{error}</span>
          </div>
        )}

        {/* New Password */}
        <div className="flex flex-col gap-1">
          <label className="font-body text-sm text-base-content/60">New Password</label>
          <label className="input input-bordered flex items-center gap-2 w-full bg-background">
            <svg
              className="h-4 w-4 opacity-50 shrink-0"
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
              type={showNewPassword ? 'text' : 'password'}
              placeholder="Enter new password"
              aria-label="New password"
              required
              disabled={isLoading}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="grow font-heading placeholder:text-neutral-400 disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword((v) => !v)}
              className="opacity-40 hover:opacity-80 transition-opacity shrink-0"
              aria-label={showNewPassword ? 'Hide password' : 'Show password'}
            >
              {showNewPassword ? (
                <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
              ) : (
                <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              )}
            </button>
          </label>
          {newPassword && (
            <ul className="font-body text-xs mt-1 flex flex-col gap-0.5">
              <li className={newPassword.length >= 8 ? 'text-success' : 'text-base-content/40'}>
                {newPassword.length >= 8 ? '✓' : '✗'} At least 8 characters
              </li>
              <li className={/[A-Z]/.test(newPassword) ? 'text-success' : 'text-base-content/40'}>
                {/[A-Z]/.test(newPassword) ? '✓' : '✗'} At least one uppercase letter
              </li>
              <li className={/[0-9]/.test(newPassword) ? 'text-success' : 'text-base-content/40'}>
                {/[0-9]/.test(newPassword) ? '✓' : '✗'} At least one number
              </li>
            </ul>
          )}
        </div>

        {/* Confirm Password */}
        <div className="flex flex-col gap-1">
          <label className="font-body text-sm text-base-content/60">Confirm New Password</label>
          <label className="input input-bordered flex items-center gap-2 w-full bg-background">
            <svg
              className="h-4 w-4 opacity-50 shrink-0"
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
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm new password"
              aria-label="Confirm new password"
              required
              disabled={isLoading}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="grow font-heading placeholder:text-neutral-400 disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((v) => !v)}
              className="opacity-40 hover:opacity-80 transition-opacity shrink-0"
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? (
                <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
              ) : (
                <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              )}
            </button>
          </label>
          {confirmPassword && !passwordsMatch && (
            <p className="font-body text-xs text-error mt-1">Passwords do not match</p>
          )}
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full bg-info hover:bg-info-hover active:bg-info-dark text-white rounded-lg py-3 font-heading font-medium text-lg transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? 'Updating...' : 'Reset Password'}
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;
