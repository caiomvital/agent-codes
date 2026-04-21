import { createBrowserClient } from "@supabase/ssr";
import { createServerClient as _createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Browser/Client Component client.
 * Call once per render — @supabase/ssr memoises internally.
 */
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Server Component, Route Handler and Server Action client.
 * Reads/writes session cookies via next/headers.
 * Async to support both Next.js 14 (sync cookies) and Next.js 15 (async cookies).
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return _createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a Server Component — cookies can't be mutated.
          // This is safe to ignore when middleware keeps sessions fresh.
        }
      },
    },
  });
}

/**
 * Service-role client — bypasses RLS.
 * Server-side only. Never import this in Client Components.
 *
 * Requires SUPABASE_SERVICE_KEY env var (not prefixed with NEXT_PUBLIC_).
 */
export function createServiceSupabaseClient() {
  return createClient(supabaseUrl, process.env.SUPABASE_SERVICE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
