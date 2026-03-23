"use client";
import React, { useCallback, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { signUp } from "./actions";
import PasswordRequirements from "@/components/PasswordRequirements";

const SignUpForm = () => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { executeRecaptcha } = useGoogleReCaptcha();

  const handleSignUp = useCallback(async (formData: FormData) => {
    if (!executeRecaptcha) {
      setError("reCAPTCHA is not ready yet. Please try again.");
      return;
    }

    const token = await executeRecaptcha("sign_up");
    if (!token) {
      setError("reCAPTCHA verification failed. Please try again.");
      return;
    }

    setLoading(true);
    setError(null);

    formData.append("recaptchaToken", token);
    const result = await signUp(formData);

    // Only runs if signup failed (success redirects)
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }, [executeRecaptcha]);

  return (
    <div className="pt-12 flex flex-col items-center gap-6 flex-1 px-4">
      <Image
        src="/gladiator-logo-circle.png"
        alt="Gladiator Logo"
        priority
        quality={100}
        width="96"
        height="96"
      />
      <h1 className="font-heading text-4xl font-black text-neutral-700">
        Sign Up
      </h1>

      {/* Sign Up Form */}
      <form
        action={handleSignUp}
        className="flex gap-4 flex-col w-full max-w-sm"
      >
        {/* Error Message */}
        {error && (
          <div role="alert" className="alert alert-error font-heading text-sm">
            <span>{error}</span>
          </div>
        )}

        {/* First Name and Last Name inputs */}
        <div className="flex gap-2 w-full">
          <label className="input input-bordered flex items-center gap-2 flex-1 bg-background">
            <svg
              className="h-4 w-4 opacity-50 shrink-0"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <input
              type="text"
              name="firstName"
              placeholder="First Name"
              aria-label="First name"
              autoComplete="given-name"
              required
              disabled={loading}
              className="grow font-heading placeholder:text-gray-400 disabled:opacity-50"
            />
          </label>
          <label className="input input-bordered flex items-center gap-2 flex-1 bg-background">
            <svg
              className="h-4 w-4 opacity-50 shrink-0"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <input
              type="text"
              name="lastName"
              placeholder="Last Name"
              aria-label="Last name"
              autoComplete="family-name"
              required
              disabled={loading}
              className="grow font-heading placeholder:text-gray-400 disabled:opacity-50"
            />
          </label>
        </div>

        {/* Email input */}
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
            aria-label="Email address"
            autoComplete="email"
            maxLength={254}
            required
            disabled={loading}
            onInput={(e) => { e.currentTarget.value = e.currentTarget.value.replace(/[<>"`;\\]/g, ""); }}
            className="grow font-heading placeholder:text-neutral-400 disabled:opacity-50"
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
            autoComplete="new-password"
            maxLength={128}
            required
            disabled={loading}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="grow font-heading placeholder:text-neutral-400 disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="opacity-40 hover:opacity-80 transition-opacity shrink-0"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
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

        <PasswordRequirements password={password} />

        {/* Confirm Password input */}
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
            type={showConfirmPassword ? "text" : "password"}
            name="confirmPassword"
            placeholder="Confirm Password"
            aria-label="Confirm password"
            autoComplete="new-password"
            maxLength={128}
            required
            disabled={loading}
            className="grow font-heading placeholder:text-neutral-400 disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="opacity-40 hover:opacity-80 transition-opacity shrink-0"
            aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
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

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-info hover:bg-info-hover active:bg-info-dark text-white rounded-lg py-3 font-heading font-medium text-lg transition-colors hover:cursor-pointer disabled:opacity-50"
        >
          {loading ? "Creating Account..." : "Create an Account"}
        </button>

        <p className="font-heading text-neutral-700 text-center text-sm mt-2 pb-20">
          Already have an account?{" "}
          <Link href="/login" className="text-info-muted hover:text-info-hover">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
};

const SignUp = () => (
  <GoogleReCaptchaProvider reCaptchaKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!}>
    <SignUpForm />
  </GoogleReCaptchaProvider>
);

export default SignUp;
