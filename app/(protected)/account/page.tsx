"use client";

import React, { useEffect, useState } from "react";
import supabase from "@/utils/supabase/client";
import { useLocation } from "@/context/locationContext";
import { deleteAccount } from "./actions";

const Account = () => {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showLocationSelect, setShowLocationSelect] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    locations,
    currentLocation,
    setCurrentLocation,
    loading: locationLoading,
  } = useLocation();

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.email) setEmail(user.email);
    };
    fetchUser();
  }, []);

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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);
    setIsLoading(true);

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      setIsLoading(false);
      return;
    }

    if (!/[A-Z]/.test(newPassword)) {
      setPasswordError("Password must contain an uppercase letter");
      setIsLoading(false);
      return;
    }

    if (!/[0-9]/.test(newPassword)) {
      setPasswordError("Password must contain a number");
      setIsLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setPasswordError(error.message);
    } else {
      setPasswordSuccess(true);
      setNewPassword("");
      setConfirmPassword("");
    }

    setIsLoading(false);
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    const result = await deleteAccount();
    if (result?.error) {
      setDeleteError(result.error);
      setIsDeleting(false);
    }
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const selectedLocation = locations.find((loc) => loc.id === selectedId);
    if (selectedLocation) {
      setCurrentLocation(selectedLocation);
      setShowLocationSelect(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <section className="border-b border-stone-300 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <h1 className="text-4xl md:text-5xl font-heading font-extrabold text-neutral-900">
            Account Settings
          </h1>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-6">
        {/* Profile Settings Card */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-[0_8px_24px_rgba(0,0,0,0.06)] p-6 md:p-8">
          <h2 className="text-2xl font-heading font-semibold text-neutral-900 mb-6">
            Profile Settings
          </h2>

          {/* Email */}
          <div className="mb-6 pb-6 border-b border-stone-100">
            <p className="text-xs font-semibold tracking-wide uppercase text-neutral-400 mb-1">
              Email
            </p>
            <p className="text-sm font-medium text-neutral-900">
              {email || "Loading..."}
            </p>
          </div>

          {/* Change Password */}
          <div className="mb-6 pb-6 border-b border-stone-100">
            <h3 className="text-lg font-heading font-semibold text-neutral-900 mb-4">
              Change Password
            </h3>

            <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
              {passwordSuccess && (
                <div role="alert" className="alert alert-success">
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
                  <span className="text-sm">Password updated successfully.</span>
                </div>
              )}
              {passwordError && (
                <div role="alert" className="alert alert-error">
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  <span className="text-sm">{passwordError}</span>
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold tracking-wide uppercase text-neutral-400">
                  New Password
                </label>
                <label className="input flex items-center gap-2 bg-white w-full max-w-sm p-3 border border-stone-300 rounded-lg focus-within:border-neutral-400">
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
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    maxLength={128}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="text-sm text-neutral-700 placeholder:text-neutral-400 py-2 focus:outline-none focus:ring-0 flex-1 bg-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((v) => !v)}
                    className="opacity-50 hover:opacity-80 focus:outline-none"
                    tabIndex={-1}
                  >
                    {showNewPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
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
                <label className="text-xs font-semibold tracking-wide uppercase text-neutral-400">
                  Confirm Password
                </label>
                <label className="input flex items-center gap-2 bg-white w-full max-w-sm p-3 border border-stone-300 rounded-lg focus-within:border-neutral-400">
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
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    maxLength={128}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="text-sm text-neutral-700 placeholder:text-neutral-400 py-2 focus:outline-none focus:ring-0 flex-1 bg-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="opacity-50 hover:opacity-80 focus:outline-none"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
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

          {/* Location */}
          <div>
            <p className="text-xs font-semibold tracking-wide uppercase text-neutral-400 mb-2">
              Location
            </p>
            <p className="text-sm font-medium text-neutral-900 mb-3">
              {locationLoading ? "Loading..." : (currentLocation?.name ?? "Not set")}
            </p>

            {showLocationSelect ? (
              <select
                className="w-full max-w-sm h-10 rounded-lg border border-stone-300 bg-white px-3 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-accent/20"
                value={currentLocation?.id || ""}
                onChange={handleLocationChange}
              >
                <option value="" disabled>
                  Select a location
                </option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            ) : (
              <button
                onClick={() => setShowLocationSelect(true)}
                className="btn bg-foreground hover:opacity-80 border-0 text-white font-heading"
              >
                Change Location
              </button>
            )}
          </div>
        </div>

        {/* Danger Zone Card */}
        <div className="bg-white rounded-2xl border border-danger-border shadow-[0_8px_24px_rgba(0,0,0,0.06)] p-6 md:p-8">
          <h2 className="text-2xl font-heading font-semibold text-danger-dark mb-3">
            Danger Zone
          </h2>
          <p className="text-sm text-neutral-500 mb-5">
            Permanently delete your account and all associated data. This cannot be undone.
          </p>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="btn bg-error hover:bg-danger-text border-0 text-white font-heading"
          >
            Delete Account
          </button>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      <dialog open={showDeleteModal} className="modal">
        <div className="modal-box rounded-2xl border border-stone-200 shadow-[0_10px_28px_rgba(0,0,0,0.12)]">
          <h3 className="font-heading font-bold text-xl text-neutral-900 mb-2">
            Delete Account
          </h3>
          <p className="text-sm text-neutral-500 py-3">
            This action is permanent and cannot be undone. Your favourites and cart will be deleted.
          </p>
          {deleteError && (
            <div role="alert" className="alert alert-error mb-4">
              <span className="text-sm">{deleteError}</span>
            </div>
          )}
          <div className="modal-action">
            <button
              onClick={() => { setShowDeleteModal(false); setDeleteError(null); }}
              disabled={isDeleting}
              className="btn bg-white hover:bg-stone-50 border-stone-300 text-neutral-700 font-heading disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="btn bg-error hover:bg-danger-text border-0 text-white font-heading disabled:opacity-50"
            >
              {isDeleting ? "Deleting..." : "Yes, Delete My Account"}
            </button>
          </div>
        </div>
        <div
          className="modal-backdrop"
          onClick={() => { if (!isDeleting) { setShowDeleteModal(false); setDeleteError(null); } }}
        />
      </dialog>
    </div>
  );
};

export default Account;
