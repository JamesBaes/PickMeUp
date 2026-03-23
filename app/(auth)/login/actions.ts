'use server'

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export async function login(email: string, password: string) {
  const trimmedEmail = email?.trim().toLowerCase();

  if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    return { error: "Please enter a valid email" };
  }

  if (!password) {
    return { error: "Please enter your password" };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: "Invalid email or password" };
  }

  const restrictedRoles = ["staff", "admin", "super_admin"];
  const accessToken = data.session?.access_token;
  const tokenPayload = accessToken
    ? JSON.parse(Buffer.from(accessToken.split('.')[1], 'base64').toString())
    : null;
  const appRole = tokenPayload?.app_metadata?.app_role;

  if (restrictedRoles.includes(appRole)) {
    await supabase.auth.signOut();
    return { error: "This account is not authorized to access this application. Please use a customer email address." };
  }

  redirect("/");
}