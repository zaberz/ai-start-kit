import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY,
  {
    auth: {
      persistSession: true,
      storageKey: "ficus-auth-token",
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  }
);
