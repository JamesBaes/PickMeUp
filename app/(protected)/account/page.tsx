"use client";

import React, { useEffect, useState } from "react";
import supabase from "@/utils/supabase/client";
import { useLocation } from "@/context/locationContext";

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

  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const selectedLocation = locations.find((loc) => loc.id === selectedId);
    if (selectedLocation) {
      setCurrentLocation(selectedLocation);
      setShowLocationSelect(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-3xl font-bold">Account Settings</h1>

      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-xl font-bold">Profile Settings</h2>

        {/* Email */}
        <div>
          <p className="font-body text-sm text-base-content/60">Email</p>
          <p className="font-body text-sm">{email || "Loading..."}</p>
        </div>

        {/* Change Password */}
        <form onSubmit={handleChangePassword} className="flex flex-col gap-3">
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
              <span className="font-body text-sm">
                Password updated successfully.
              </span>
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
              <span className="font-body text-sm">{passwordError}</span>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="font-body text-sm text-base-content/60">
              New Password
            </label>
            <label className="input flex items-center gap-2 bg-background w-full max-w-sm p-3 border border-base-200 rounded-lg focus-within:border-base-content/30">
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
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="font-body text-sm py-2 focus:outline-none focus:ring-0 placeholder:text-gray-400 flex-1"
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
              <ul className="font-body text-xs mt-1 flex flex-col gap-0.5">
                <li className={newPassword.length >= 8 ? "text-success" : "text-base-content/40"}>
                  {newPassword.length >= 8 ? "✓" : "✗"} At least 8 characters
                </li>
                <li className={/[A-Z]/.test(newPassword) ? "text-success" : "text-base-content/40"}>
                  {/[A-Z]/.test(newPassword) ? "✓" : "✗"} At least one uppercase letter
                </li>
                <li className={/[0-9]/.test(newPassword) ? "text-success" : "text-base-content/40"}>
                  {/[0-9]/.test(newPassword) ? "✓" : "✗"} At least one number
                </li>
              </ul>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-body text-sm text-base-content/60">
              Confirm Password
            </label>
            <label className="input flex items-center gap-2 bg-background w-full max-w-sm p-3 border border-base-200 rounded-lg focus-within:border-base-content/30">
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
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="font-body text-sm py-2 focus:outline-none focus:ring-0 placeholder:text-gray-400 flex-1"
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
              <p className="font-body text-xs text-error mt-1">
                Passwords do not match
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={
              !passwordsMatch || !newPassword || !confirmPassword || isLoading
            }
            className="font-body text-sm text-white bg-foreground rounded-lg px-4 py-2 w-fit hover:shadow-md hover:cursor-pointer disabled:opacity-50"
          >
            {isLoading ? "Updating..." : "Change Password"}
          </button>
        </form>

        {/* Location */}
        <div className="flex flex-col gap-2 mt-2">
          <p className="font-body text-sm text-base-content/60">Location</p>
          <p className="font-body text-sm font-semibold">
            {locationLoading
              ? "Loading..."
              : (currentLocation?.name ?? "Not set")}
          </p>

          {showLocationSelect ? (
            <select
              className="w-full max-w-sm p-2 rounded-lg border border-base-200 bg-background font-body text-sm text-base-content focus:outline-none focus:ring-2 focus:ring-foreground"
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
              className="font-body text-sm text-white bg-foreground rounded-lg px-4 py-2 w-fit hover:shadow-md hover:cursor-pointer"
            >
              Change Location
            </button>
          )}
        </div>
      </section>
    </div>
  );
};

export default Account;
