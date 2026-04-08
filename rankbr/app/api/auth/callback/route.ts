import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerSupabaseClient, createServiceSupabaseClient } from "@/lib/supabase";

/**
 * Supabase Auth callback handler.
 *
 * Handles three flows:
 *   1. Email confirmation (magic-link / sign-up verification)
 *   2. OAuth provider redirect (Google, GitHub, etc.)
 *   3. Password-reset link
 *
 * After exchanging the code for a session we create (or upsert) a record
 * in the public.users table using the service-role client so it always
 * succeeds regardless of RLS policies.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Supabase passes errors as query params in some flows (e.g. expired link).
  if (error) {
    const url = new URL("/login", origin);
    url.searchParams.set(
      "error",
      errorDescription ?? "Link inválido ou expirado. Tente novamente."
    );
    return NextResponse.redirect(url);
  }

  if (!code) {
    return NextResponse.redirect(new URL("/login", origin));
  }

  const supabase = createServerSupabaseClient();

  const { data, error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError || !data.user) {
    const url = new URL("/login", origin);
    url.searchParams.set("error", "Falha na autenticação. Tente fazer login novamente.");
    return NextResponse.redirect(url);
  }

  // Upsert the user record so new OAuth/magic-link users are always registered.
  // Uses service client (bypasses RLS) — safe because we derive all values from
  // the verified Supabase auth token, never from user-supplied input.
  const serviceClient = createServiceSupabaseClient();
  await serviceClient.from("users").upsert(
    {
      id: data.user.id,
      email: data.user.email,
      name:
        data.user.user_metadata?.name ??
        data.user.user_metadata?.full_name ??
        data.user.email?.split("@")[0] ??
        "Usuário",
      role: "user",
      created_at: new Date().toISOString(),
    },
    {
      // Only update name/email — never overwrite role or other sensitive fields.
      onConflict: "id",
      ignoreDuplicates: true,
    }
  );

  // Redirect to the originally requested page (or dashboard).
  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocalEnv = process.env.NODE_ENV === "development";

  if (isLocalEnv) {
    return NextResponse.redirect(new URL(next, origin));
  }

  if (forwardedHost) {
    return NextResponse.redirect(
      new URL(next, `${request.headers.get("x-forwarded-proto")}://${forwardedHost}`)
    );
  }

  return NextResponse.redirect(new URL(next, origin));
}
