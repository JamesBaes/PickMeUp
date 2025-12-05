"use client";
import React from "react";
import Image from "next/image";
import { login } from "@/helpers/authHelpers";

const Login = () => {
  const handleLogin = async (formData: FormData) => {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    await login(email, password);
  };

  return (
    <div className="pt-20 flex flex-col items-center gap-8 bg-accent flex-1">
      <Image
        src="/gladiator-logo-circle.png"
        alt="Gladiator Logo"
        priority
        quality={100}
        width="96"
        height="96"
      />
      <h1 className="font-heading text-4xl font-semibold text-white">Login</h1>

      {/* Login Form Section (Used the jsx from daisyUI) */}
      <form action={handleLogin} className="flex gap-6 flex-col">
        <div className="flex flex-1 gap-2 flex-col">
          <p className="font-heading text-background font-medium text-2xl">
            Email
          </p>
          <label className="input validator flex items-center gap-2 bg-background w-md p-3 border-2 border-gray-50 shadow-xs rounded-lg focus-within:border-gray-50">
            <svg
              className="h-[1em] opacity-50"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
            >
              <g
                strokeLinejoin="round"
                strokeLinecap="round"
                stroke-width="2.5"
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
              className="font-heading py-4 focus:outline-none focus:ring-0 placeholder:text-gray-400 focus:placeholder:opacity-0"
            />
          </label>
          <div className="validator-hint hidden font-heading text-background font-bold text-right">
            Enter valid email address
          </div>
        </div>

        <div className="flex flex-col flex-1 gap-2">
          <p className="font-heading text-background font-medium text-2xl">
            Password
          </p>
          <label className="input validator flex items-center gap-2 bg-background w-md p-3 border-2 border-gray-50 shadow-xs rounded-lg focus-within:border-gray-50">
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
              className="font-heading py-4 focus:outline-none focus:ring-0 placeholder:text-gray-400 focus:placeholder:opacity-0"
            />
          </label>
          <div className="validator-hint hidden font-heading text-background font-bold text-right">
            Enter your password
          </div>
        </div>

        {/* Lmk if i got you HAHAH its temporary ;p*/}
        <div className="font-heading text-background text-right hover:text-gray-200">
          <a
            href="https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=RDdQw4w9WgXcQ&start_radio=1"
            target="_blank"
            rel="noopener noreferrer"
          >
            Forgot Password?
          </a>
        </div>

        <button
          type="submit"
          className="w-md bg-foreground rounded-lg p-3 hover:shadow-xl hover:cursor-pointer"
        >
          <p className="font-heading font-medium text-lg text-background">
            Login
          </p>
        </button>
      </form>
    </div>
  );
};

export default Login;
