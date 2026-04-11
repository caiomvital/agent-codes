import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient, createServiceSupabaseClient } from "@/lib/supabase";

const PatchSchema = z.object({
  concluida: z.boolean(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  /* Auth */
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  /* Validate body */
  let body: z.infer<typeof PatchSchema>;
  try {
    body = PatchSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const tarefaId = params.id;
  const service  = createServiceSupabaseClient();

  /* Verify ownership: tarefa → analise → user */
  const { data: tarefa } = await service
    .from("tarefas")
    .select("id, analise_id")
    .eq("id", tarefaId)
    .single();

  if (!tarefa) {
    return NextResponse.json({ error: "Tarefa não encontrada." }, { status: 404 });
  }

  const { data: analise } = await service
    .from("analises")
    .select("user_id")
    .eq("id", tarefa.analise_id)
    .single();

  if (!analise || analise.user_id !== user.id) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  /* Update */
  const { error } = await service
    .from("tarefas")
    .update({ concluida: body.concluida })
    .eq("id", tarefaId);

  if (error) {
    console.error("Erro ao atualizar tarefa:", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
