"use client";
import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { signUp } from "./actions";

const SignUp = () => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (formData: FormData) => {
    setLoading(true);
    setError(null);

    const result = await signUp(formData);

    // Only runs if signup failed (success redirects)
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <div className="pt-12 flex flex-col items-center gap-8 bg-accent flex-1">
      <Image
        src="/gladiator-logo-circle.png"
        alt="Gladiator Logo"
        priority
        quality={100}
        width="96"
        height="96"
      />
      <h1 className="font-heading text-4xl font-semibold text-white">
        Sign Up
      </h1>

      {/* Sign Up Form */}
      <form action={handleSignUp} className="flex gap-6 flex-col">
        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded font-heading">
            {error}
          </div>
        )}

        <div className="flex flex-1 gap-2 flex-col">
          <p className="font-heading text-background font-medium text-2xl">
            Email
          </p>
          <label className="input validator flex items-center gap-2 bg-background w-md p-3 border-2 border-gray-50 shadow-xs rounded-lg">
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
              required
              disabled={loading}
              className="font-heading py-4 focus:outline-none focus:ring-0 placeholder:text-gray-400 focus:placeholder:opacity-0 disabled:opacity-50"
            />
          </label>
        </div>

        <div className="flex flex-col flex-1 gap-2">
          <p className="font-heading text-background font-medium text-2xl">
            Password
          </p>
          <label className="input validator flex items-center gap-2 bg-background w-md p-3 border-2 border-gray-50 shadow-xs rounded-lg">
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
              placeholder="Password"
              required
              disabled={loading}
              className="font-heading py-4 focus:outline-none focus:ring-0 placeholder:text-gray-400 focus:placeholder:opacity-0 disabled:opacity-50"
            />
          </label>
          <p className="font-heading text-background text-sm">
            Must be 8+ characters with uppercase and number
          </p>
        </div>

        <div className="flex flex-col flex-1 gap-2">
          <p className="font-heading text-background font-medium text-2xl">
            Confirm Password
          </p>
          <label className="input validator flex items-center gap-2 bg-background w-md p-3 border-2 border-gray-50 shadow-xs rounded-lg">
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
              placeholder="Confirm Password"
              required
              disabled={loading}
              className="font-heading py-4 focus:outline-none focus:ring-0 placeholder:text-gray-400 focus:placeholder:opacity-0 disabled:opacity-50"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-md bg-foreground rounded-lg p-3 hover:shadow-xl hover:cursor-pointer mb-6 disabled:opacity-50"
        >
          <p className="font-heading font-medium text-lg text-background">
            {loading ? "Creating Account..." : "Create an Account"}
          </p>
        </button>

        <p className="font-heading text-background text-center">
          Already have an account?{" "}
          <Link href="/login" className="underline hover:text-gray-200">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
};

export default SignUp;