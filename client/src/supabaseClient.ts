import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  // Allow direct SUPABASE_* when envPrefix includes them
  import.meta.env.SUPABASE_URL ||
  "";

const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.SUPABASE_ANON_KEY ||
  "";

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Supabase client env missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or SUPABASE_URL / SUPABASE_ANON_KEY with envPrefix) in client/.env."
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);
