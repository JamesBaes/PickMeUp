'use server'

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export async function login(email: string, password: string) {
  // Basic validation
  if (!email || !email.includes("@")) {
    return { error: "Please enter a valid email" };
  }

  if (!password || password.length < 1) {
    return { error: "Please enter your password" };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.log("Login error:", error.message, error.status);
    return { error: "Invalid email or password" };
  }

  redirect("/");
}