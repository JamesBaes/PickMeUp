"use client";

import React, { useState } from "react";
import supabase from "@/utils/supabase/client";

const EyeIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const KeyIcon = () => (
  <svg className="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
    <g strokeLinejoin="round" strokeLinecap="round" strokeWidth="2.5" fill="none" stroke="currentColor">
      <path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"></path>
      <circle cx="16.5" cy="7.5" r=".5" fill="currentColor"></circle>
    </g>
  </svg>
);

export const ChangePasswordForm = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordsMatch = newPassword === confirmPassword;
  const passwordMeetsRequirements =
    newPassword.length >= 8 &&
    /[A-Z]/.test(newPassword) &&
    /[0-9]/.test(newPassword);
  const canSubmit =
    passwordMeetsRequirements && passwordsMatch && !!newPassword && !!confirmPassword && !isLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsLoading(true);

    if (newPassword !== confirmPassword) { setError("Passwords do not match"); setIsLoading(false); return; }
    if (newPassword.length < 8) { setError("Password must be at least 8 characters"); setIsLoading(false); return; }
    if (!/[A-Z]/.test(newPassword)) { setError("Password must contain an uppercase letter"); setIsLoading(false); return; }
    if (!/[0-9]/.test(newPassword)) { setError("Password must contain a number"); setIsLoading(false); return; }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setNewPassword("");
      setConfirmPassword("");
    }
    setIsLoading(false);
  };

  return (
    <div className="mb-6 pb-6 border-b border-stone-100">
      <h3 className="text-lg font-heading font-semibold text-neutral-900 mb-4">Change Password</h3>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {success && (
          <div role="alert" className="alert alert-success">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="h-5 w-5 shrink-0 stroke-current">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm">Password updated successfully.</span>
          </div>
        )}
        {error && (
          <div role="alert" className="alert alert-error">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="h-5 w-5 shrink-0 stroke-current">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="text-sm">{error}</span>
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold tracking-wide uppercase text-neutral-400">New Password</label>
          <label className="input flex items-center gap-2 bg-white w-full max-w-sm p-3 border border-stone-300 rounded-lg focus-within:border-neutral-400">
            <KeyIcon />
            <input
              type={showNewPassword ? "text" : "password"}
              placeholder="Enter new password"
              maxLength={128}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="text-sm text-neutral-700 placeholder:text-neutral-400 py-2 focus:outline-none focus:ring-0 flex-1 bg-transparent"
            />
            <button type="button" onClick={() => setShowNewPassword((v) => !v)} className="opacity-50 hover:opacity-80 focus:outline-none" tabIndex={-1}>
              {showNewPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
            </button>
          </label>
          {newPassword && (
            <ul className="text-xs mt-1 flex flex-col gap-0.5">
              <li className={newPassword.length >= 8 ? "text-success" : "text-neutral-400"}>
                {newPassword.length >= 8 ? "✓" : "✗"} At least 8 characters
              </li>
              <li className={/[A-Z]/.test(newPassword) ? "text-success" : "text-neutral-400"}>
                {/[A-Z]/.test(newPassword) ? "✓" : "✗"} At least one uppercase letter
              </li>
              <li className={/[0-9]/.test(newPassword) ? "text-success" : "text-neutral-400"}>
                {/[0-9]/.test(newPassword) ? "✓" : "✗"} At least one number
              </li>
            </ul>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold tracking-wide uppercase text-neutral-400">Confirm Password</label>
          <label className="input flex items-center gap-2 bg-white w-full max-w-sm p-3 border border-stone-300 rounded-lg focus-within:border-neutral-400">
            <KeyIcon />
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm new password"
              maxLength={128}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="text-sm text-neutral-700 placeholder:text-neutral-400 py-2 focus:outline-none focus:ring-0 flex-1 bg-transparent"
            />
            <button type="button" onClick={() => setShowConfirmPassword((v) => !v)} className="opacity-50 hover:opacity-80 focus:outline-none" tabIndex={-1}>
              {showConfirmPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
            </button>
          </label>
          {confirmPassword && !passwordsMatch && (
            <p className="text-xs text-error mt-1">Passwords do not match</p>
          )}
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className={`btn bg-foreground hover:opacity-80 border-0 text-white font-heading w-fit disabled:opacity-50 ${canSubmit ? "cursor-pointer" : "cursor-not-allowed"}`}
        >
          {isLoading ? "Updating..." : "Change Password"}
        </button>
      </form>
    </div>
  );
};
