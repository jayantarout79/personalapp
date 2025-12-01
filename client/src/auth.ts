import { supabase } from "./supabaseClient";

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.session) throw error || new Error("Unable to sign in");
  return data.session;
};

export const signOut = async () => {
  await supabase.auth.signOut();
};
