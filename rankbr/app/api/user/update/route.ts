import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient, createServiceSupabaseClient } from "@/lib/supabase";

const UpdateSchema = z.object({
  name: z.string().min(1).max(200).trim(),
});

export async function PATCH(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  let body: z.infer<typeof UpdateSchema>;
  try {
    body = UpdateSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const db = createServiceSupabaseClient();
  const { error } = await db
    .from("users")
    .update({ name: body.name })
    .eq("id", user.id);

  if (error) {
    console.error("[user/update] DB error:", error);
    return NextResponse.json({ error: "Erro ao salvar." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
