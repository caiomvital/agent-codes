import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createElement } from "react";
import { createServerSupabaseClient, createServiceSupabaseClient } from "@/lib/supabase";
import { sendEmail } from "@/lib/email";
import { BemVindo } from "@/emails/BemVindo";

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

  const supabase = await createServerSupabaseClient();

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
  const userName =
    data.user.user_metadata?.name ??
    data.user.user_metadata?.full_name ??
    data.user.email?.split("@")[0] ??
    "Usuário";

  const { error: upsertError } = await serviceClient.from("users").upsert(
    {
      id: data.user.id,
      email: data.user.email,
      name: userName,
      role: "user",
      created_at: new Date().toISOString(),
    },
    {
      // Only update name/email — never overwrite role or other sensitive fields.
      onConflict: "id",
      ignoreDuplicates: true,
    }
  );

  // Send BemVindo email only for truly new users (upsert inserted, not skipped).
  // We detect new users by comparing created_at and last_sign_in_at — if
  // they're within 60 s of each other this is a brand-new account.
  const createdAt     = new Date(data.user.created_at).getTime();
  const lastSignIn    = new Date(data.user.last_sign_in_at ?? data.user.created_at).getTime();
  const isNewUser     = Math.abs(lastSignIn - createdAt) < 60_000;

  if (isNewUser && data.user.email && !upsertError) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;
    sendEmail({
      to: data.user.email,
      subject: "Bem-vindo ao RankBR! 🎉",
      component: createElement(BemVindo, { nome: userName, appUrl }),
    }).catch((err) => console.error("[auth/callback] Falha ao enviar BemVindo:", err));
  }

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
