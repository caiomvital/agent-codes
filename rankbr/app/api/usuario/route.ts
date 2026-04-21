import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient, createServiceSupabaseClient } from "@/lib/supabase";

const PatchSchema = z.object({
  nome: z
    .string({ required_error: "O nome é obrigatório." })
    .min(2, "O nome deve ter pelo menos 2 caracteres.")
    .max(200, "O nome deve ter no máximo 200 caracteres.")
    .trim(),
});

/**
 * PATCH /api/usuario
 * Atualiza o nome do usuário na tabela public.users e nos metadados de auth.
 */
export async function PATCH(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  let body: z.infer<typeof PatchSchema>;
  try {
    const raw = await req.json();
    body = PatchSchema.parse(raw);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.errors[0].message },
        { status: 422 }
      );
    }
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const db = createServiceSupabaseClient();

  // Update public.users
  const { error: dbError } = await db
    .from("users")
    .update({ name: body.nome })
    .eq("id", user.id);

  if (dbError) {
    console.error("[api/usuario] DB error:", dbError);
    return NextResponse.json({ error: "Erro ao salvar. Tente novamente." }, { status: 500 });
  }

  // Keep auth metadata in sync
  await supabase.auth.updateUser({ data: { name: body.nome } });

  return NextResponse.json({ success: true });
}
