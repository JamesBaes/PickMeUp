"use client";
import React from "react";
import Image from "next/image";
import { login } from "@/helpers/authHelpers";
import Link from "next/link";
import ForgotPassword from "../forgot-password/page";

const Login = () => {
  const handleLogin = async (formData: FormData) => {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    await login(email, password);
  };

  return (
    <div className="min-h-screen pt-12 sm:pt-20 pb-12 px-4 sm:px-0 flex flex-col items-center gap-6 sm:gap-8 bg-accent">
      <Image
        src="/gladiator-logo-circle.png"
        alt="Gladiator Logo"
        priority
        quality={100}
        width="80"
        height="80"
        className="sm:w-24 sm:h-24"
      />
      <h1 className="font-heading text-3xl sm:text-4xl font-semibold text-white">Login</h1>

      {/* Login Form Section (Used the jsx from daisyUI) */}
      <form action={handleLogin} className="flex gap-4 sm:gap-6 flex-col w-full max-w-md px-4 sm:px-0">
        <div className="flex flex-1 gap-2 flex-col">
          <p className="font-heading text-background font-medium text-lg sm:text-2xl">
            Email
          </p>
          <label className="input validator flex items-center gap-2 bg-background w-full p-2 sm:p-3 border-2 border-gray-50 shadow-xs rounded-lg focus-within:border-gray-50">
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
              className="font-heading text-sm sm:text-base py-2 sm:py-4 w-full focus:outline-none focus:ring-0 placeholder:text-gray-400 focus:placeholder:opacity-0"
            />
          </label>
          <div className="validator-hint hidden font-heading text-background font-bold text-right">
            Enter valid email address
          </div>
        </div>

        <div className="flex flex-col flex-1 gap-2">
          <p className="font-heading text-background font-medium text-lg sm:text-2xl">
            Password
          </p>
          <label className="input validator flex items-center gap-2 bg-background w-full p-2 sm:p-3 border-2 border-gray-50 shadow-xs rounded-lg focus-within:border-gray-50">
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
              className="font-heading text-sm sm:text-base py-2 sm:py-4 w-full focus:outline-none focus:ring-0 placeholder:text-gray-400 focus:placeholder:opacity-0"
            />
          </label>
          <div className="validator-hint hidden font-heading text-background font-bold text-right">
            Enter your password
          </div>
        </div>


        <div className="font-heading text-sm sm:text-base text-background text-right hover:text-gray-200">
          <Link
            href={"/forgot-password"}
          >
            Forgot Password?
          </Link>
        </div>

        <button
          type="submit"
          className="w-full bg-foreground rounded-lg p-2 sm:p-3 hover:shadow-xl hover:cursor-pointer mt-4"
        >
          <p className="font-heading font-medium text-base sm:text-lg text-background">
            Login
          </p>
        </button>
      </form>
    </div>
  );
};

export default Login;
