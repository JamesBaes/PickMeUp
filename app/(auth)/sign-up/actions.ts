'use server'

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export async function signUp(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!email || !email.includes("@") || email.length > 255) {
    return { error: "Please enter a valid email" };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters" };
  }

  if (!/[A-Z]/.test(password)) {
    return { error: "Password must contain an uppercase letter" };
  }

  if (!/[0-9]/.test(password)) {
    return { error: "Password must contain a number" };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match" };
  }

  // create a new account
  const supabase = await createClient();
  
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    console.log(error.message);
    return { error: "Could not create account. Please try again." };
  }

  redirect("/verify-email?from=signup");
}