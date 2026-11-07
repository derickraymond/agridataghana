import { createBrowserClient } from "@supabase/ssr";
import { supabaseAnonKey, supabaseUrl } from "@/lib/config/env";

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
