"use client";
import React, { useState } from "react";
import Image from "next/image";
import { login } from "./actions";
import Link from "next/link";

const Login = () => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (formData: FormData) => {
    setLoading(true);
    setError(null);

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const result = await login(email, password);

    // if login failed (success redirects)
    if (result?.error) {
      setError(result.error);
      setLoading(false);
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
      <h1 className="font-heading text-4xl font-black text-foreground text-center leading-tight text-gray-700">
        Welcome to
        <br />
        Gladiator Burger
      </h1>

      {/* Login Form Section */}
      <form
        action={handleLogin}
        className="flex gap-4 flex-col w-full max-w-sm"
      >
        {/* Error Message */}
        {error && (
          <div role="alert" className="alert alert-error font-heading text-sm">
            <span>{error}</span>
          </div>
        )}

        {/* Username/Email input */}
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
            placeholder="Email address"
            aria-label="Email address"
            autoComplete="email"
            required
            disabled={loading}
            className="grow font-heading placeholder:text-gray-400 disabled:opacity-50"
          />
        </label>

        {/* Password input */}
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
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Password"
            aria-label="Password"
            autoComplete="current-password"
            required
            disabled={loading}
            className="grow font-heading placeholder:text-gray-400 disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="opacity-40 hover:opacity-80 transition-opacity shrink-0"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <svg
                className="h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
              </svg>
            ) : (
              <svg
                className="h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            )}
          </button>
        </label>

        <div className="text-right">
          <Link
            href="/forgot-password"
            className="font-heading text-blue-500 hover:text-blue-700 text-sm"
          >
            Forgot Password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg py-3 font-heading font-medium text-lg transition-colors hover:cursor-pointer disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>

        <p className="text-center font-heading text-sm text-gray-500 mt-2 pb-20">
          New to Gladiator Burger?
          <br />
          <Link href="/sign-up" className="text-blue-500 hover:text-blue-700">
            Create your account.
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Login;
