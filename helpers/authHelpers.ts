'use server'

// Helper Functions for authentication

import { createClient } from '@/utils/supabase/server'; 
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function signUp(email: string, password: string) {
  const supabase = await createClient();
  
  const { error } = await supabase.auth.signUp({
    email,
    password,
  });
  
  if (error) {
    console.log("Sign Up Error " + error.message)
    redirect('/error')
  }
  
  revalidatePath('/', 'layout')
  redirect('/success')
}

export async function login(email: string, password: string) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  // redirects to temporary error page
  if (error) {
    console.log("Login Error " + error.message)
    redirect('/error')
  }

  // does a "refresh" and redirects to a temporary success page. Will change this once I create the has an account navbar so it just refreshes with the new navbar.
  revalidatePath('/', 'layout')
  redirect('/success')
}

export async function signOut() {
  const supabase = await createClient();

  const { error } = await supabase.auth.signOut();

   // redirects to temporary error page
  if (error) {
    redirect('/error')
  }

  // does a "refresh" and redirects to/account page.
  revalidatePath('/', 'layout')
  redirect('/')
}

export async function getCurrentUser() {
  const supabaseServer = await createClient();
  const { data: { user }, error } = await supabaseServer.auth.getUser();
  return { user, error };
}