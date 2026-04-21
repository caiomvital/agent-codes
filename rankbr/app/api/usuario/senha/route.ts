import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createBrowserClient } from "@supabase/ssr";
import { createServerSupabaseClient, createServiceSupabaseClient } from "@/lib/supabase";

const PostSchema = z.object({
  senhaAtual: z
    .string({ required_error: "Informe a senha atual." })
    .min(1, "Informe a senha atual."),
  novaSenha: z
    .string({ required_error: "Informe a nova senha." })
    .min(8, "A nova senha deve ter no mínimo 8 caracteres.")
    .max(72, "A nova senha deve ter no máximo 72 caracteres."),
});

/**
 * POST /api/usuario/senha
 *
 * Altera a senha do usuário autenticado.
 * Fluxo:
 *  1. Verifica sessão via createServerSupabaseClient
 *  2. Tenta signInWithPassword com email + senhaAtual para confirmar identidade
 *  3. Se confirmar → usa Admin API (service role) para trocar a senha
 */
export async function POST(req: NextRequest) {
  // 1. Auth
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  // 2. Parse body
  let body: z.infer<typeof PostSchema>;
  try {
    const raw = await req.json();
    body = PostSchema.parse(raw);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 422 });
    }
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  if (body.senhaAtual === body.novaSenha) {
    return NextResponse.json(
      { error: "A nova senha deve ser diferente da senha atual." },
      { status: 422 }
    );
  }

  // 3. Verify current password via a fresh anon sign-in attempt
  const anonClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { error: signInError } = await anonClient.auth.signInWithPassword({
    email: user.email,
    password: body.senhaAtual,
  });

  if (signInError) {
    return NextResponse.json(
      { error: "Senha atual incorreta. Verifique e tente novamente." },
      { status: 401 }
    );
  }

  // 4. Update password via Admin API (service role)
  const db = createServiceSupabaseClient();
  const { error: updateError } = await db.auth.admin.updateUserById(user.id, {
    password: body.novaSenha,
  });

  if (updateError) {
    console.error("[api/usuario/senha] Admin update error:", updateError);
    return NextResponse.json(
      { error: "Erro ao alterar a senha. Tente novamente." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
