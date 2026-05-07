import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";

let clientSingleton: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabaseBrowserClient() {
  if (clientSingleton) {
    return clientSingleton;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  clientSingleton = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
  });

  return clientSingleton;
}
