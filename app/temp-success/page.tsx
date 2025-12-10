"use client";
import React from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/utils/supabase/client";

// temporary success page

const tempsuccess = () => {
  const router = useRouter();

  // redirects to menupage after 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/login");
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div role="alert" className="alert alert-info">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        className="h-6 w-6 shrink-0 stroke-current"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        ></path>
      </svg>
      <span>Password Successfully Updated.</span>
    </div>
  );
};

export default tempsuccess;
