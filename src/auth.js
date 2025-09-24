import { supabase } from "./supabaseClient";

// Regisztráció
export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  if (error) throw error;
  return data.user;
}

// Bejelentkezés
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data.user;
}

// Kijelentkezés
export async function signOut() {
  await supabase.auth.signOut();
}

// Aktuális user
export function getUser() {
  return supabase.auth.getUser();
}