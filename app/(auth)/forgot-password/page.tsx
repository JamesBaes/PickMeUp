"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { sendPasswordReset } from "./actions";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await sendPasswordReset(email);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setSent(true);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 flex-1 bg-background pt-16 px-4">
      <Image
        src="/gladiator-logo-circle.png"
        alt="Gladiator Logo"
        priority
        quality={100}
        width="80"
        height="80"
      />
      <h1 className="font-heading text-4xl font-black text-gray-700 text-center leading-tight">
        Forgot Password
      </h1>

      {sent ? (
        <div className="flex gap-4 flex-col w-full max-w-sm">
          <div role="alert" className="alert alert-info font-heading text-sm">
            <span>
              If this email exist we will send you an email to reset your
              password.
            </span>
          </div>
          <Link
            href="/login"
            className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg py-3 font-heading font-medium text-lg transition-colors text-center"
          >
            Back to Login
          </Link>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="flex gap-4 flex-col w-full max-w-sm"
        >
          {error && (
            <div role="alert" className="alert alert-error font-heading text-sm">
              <span>{error}</span>
            </div>
          )}
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
                <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
              </g>
            </svg>
            <input
              type="email"
              name="email"
              placeholder="Email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value.replace(/[<>"`;\\]/g, ""))}
              maxLength={254}
              required
              className="grow font-heading placeholder:text-gray-400"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg py-3 font-heading font-medium text-lg transition-colors hover:cursor-pointer disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send Password Reset Link"}
          </button>
        </form>
      )}
    </div>
  );
};

export default ForgotPassword;
