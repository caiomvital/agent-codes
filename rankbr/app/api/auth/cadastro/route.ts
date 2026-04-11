import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createElement } from "react";
import { createServerSupabaseClient, createServiceSupabaseClient } from "@/lib/supabase";
import { sendEmail } from "@/lib/email";
import { logger } from "@/lib/logger";
import { BemVindo } from "@/emails/BemVindo";

/**
 * POST /api/auth/cadastro
 *
 * Called by the sign-up page immediately after supabase.auth.signUp()
 * returns a session (i.e. email confirmation is disabled).
 *
 * Responsibilities:
 *  1. Verify the caller is authenticated (reads from the session cookie).
 *  2. Upsert the user record in public.users (service role, bypasses RLS).
 *  3. Send the BemVindo email — fire-and-forget, never blocks the response.
 *
 * The body is intentionally ignored for all sensitive fields (id, email,
 * role). Those come exclusively from the verified Supabase auth token.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verify session — the browser client sets the auth cookie during signUp.
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Não autenticado." },
        { status: 401 }
      );
    }

    // 2. Upsert public.users record via service role (bypasses RLS).
    const serviceClient = createServiceSupabaseClient();
    const userName =
      user.user_metadata?.name ??
      user.user_metadata?.full_name ??
      user.email?.split("@")[0] ??
      "Usuário";

    const { error: upsertError } = await serviceClient.from("users").upsert(
      {
        id: user.id,
        email: user.email,
        name: userName,
        role: "user",
        created_at: new Date().toISOString(),
      },
      { onConflict: "id", ignoreDuplicates: true }
    );

    if (upsertError) {
      logger.error("Falha ao criar registro do usuário", "auth/cadastro", {
        userId: user.id,
        error: upsertError.message,
      });
      // Non-fatal: the user is authenticated; proceed anyway.
    }

    // 3. Send BemVindo email — fire-and-forget, never blocks.
    if (user.email) {
      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;

      sendEmail({
        to: user.email,
        subject: "Bem-vindo ao RankBR! 🎉",
        component: createElement(BemVindo, { nome: userName, appUrl }),
      }).catch((err) => {
        logger.error("Falha ao enviar BemVindo", "auth/cadastro", {
          userId: user.id,
          error: err instanceof Error ? err.message : String(err),
        });
      });
    }

    logger.info("Usuário cadastrado", "auth/cadastro", { userId: user.id });

    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error("Erro inesperado no cadastro", "auth/cadastro", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: "Erro interno. Tente novamente." },
      { status: 500 }
    );
  }
}
