'use server'

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export async function signUp(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;
  const recaptchaToken = formData.get("recaptchaToken") as string;

  // Verify reCAPTCHA token with Google
  if (!recaptchaToken) {
    return { error: "reCAPTCHA verification required." };
  }

  const verifyResponse = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`,
  });

  const verifyData = await verifyResponse.json();
  if (!verifyData.success || verifyData.score < 0.5) {
    return { error: "reCAPTCHA verification failed. Please try again." };
  }

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
  const headersList = await headers();
  const host = headersList.get('host') ?? '';
  const protocol = host.startsWith('localhost') ? 'http' : 'https';
  const origin = `${protocol}://${host}`;

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    console.log(error.message);
    return { error: "Could not create account. Please try again." };
  }

  redirect("/verify-email?from=signup");
}