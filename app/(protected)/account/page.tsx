"use client";

import React, { useEffect, useState } from "react";
import supabase from "@/utils/supabase/client";
import { useLocation } from "@/context/locationContext";
import { deleteAccount } from "./actions";
import { ChangePasswordForm } from "@/components/account/ChangePasswordForm";
import { DeleteAccountModal } from "@/components/account/DeleteAccountModal";

const Account = () => {
  const [email, setEmail] = useState("");
  const [showLocationSelect, setShowLocationSelect] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { locations, currentLocation, setCurrentLocation, loading: locationLoading } = useLocation();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) setEmail(user.email);
    };
    fetchUser();
  }, []);

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
    const selected = locations.find((loc) => loc.id === e.target.value);
    if (selected) {
      setCurrentLocation(selected);
      setShowLocationSelect(false);
    }
  };

  const handleCloseDeleteModal = () => {
    if (!isDeleting) {
      setShowDeleteModal(false);
      setDeleteError(null);
    }
  };

  return (
    <div className="min-h-screen">
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
          <h2 className="text-2xl font-heading font-semibold text-neutral-900 mb-6">Profile Settings</h2>

          {/* Email */}
          <div className="mb-6 pb-6 border-b border-stone-100">
            <p className="text-xs font-semibold tracking-wide uppercase text-neutral-400 mb-1">Email</p>
            <p className="text-sm font-medium text-neutral-900">{email || "Loading..."}</p>
          </div>

          <ChangePasswordForm />

          {/* Location */}
          <div>
            <p className="text-xs font-semibold tracking-wide uppercase text-neutral-400 mb-2">Location</p>
            <p className="text-sm font-medium text-neutral-900 mb-3">
              {locationLoading ? "Loading..." : (currentLocation?.name ?? "Not set")}
            </p>
            {showLocationSelect ? (
              <select
                className="w-full max-w-sm h-10 rounded-lg border border-stone-300 bg-white px-3 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-accent/20"
                value={currentLocation?.id || ""}
                onChange={handleLocationChange}
              >
                <option value="" disabled>Select a location</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
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
          <h2 className="text-2xl font-heading font-semibold text-danger-dark mb-3">Danger Zone</h2>
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

      {showDeleteModal && (
        <DeleteAccountModal
          isDeleting={isDeleting}
          error={deleteError}
          onConfirm={handleDeleteAccount}
          onCancel={handleCloseDeleteModal}
        />
      )}
    </div>
  );
};

export default Account;
