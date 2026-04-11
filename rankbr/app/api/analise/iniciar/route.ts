import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient, createServiceSupabaseClient } from "@/lib/supabase";
import { rodarAnalise } from "@/lib/analise";

export const maxDuration = 30;

const bodySchema = z.object({
  analiseId: z.string().uuid("analiseId deve ser um UUID válido"),
});

/**
 * POST /api/analise/iniciar
 *
 * Validates that the associated payment is approved, then fires off
 * rodarAnalise() in the background (no await) and returns 200 immediately.
 *
 * The client should poll GET /api/analise/[id]/status or use a Supabase
 * Realtime subscription to know when the analysis is complete.
 */
export async function POST(request: NextRequest) {
  // ── 1. Auth ──────────────────────────────────────────────────────────────
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Autenticação necessária." },
      { status: 401 }
    );
  }

  // ── 2. Body ───────────────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 422 });
  }

  const { analiseId } = parsed.data;
  const db = createServiceSupabaseClient();

  // ── 3. Verify analise belongs to this user ────────────────────────────────
  const { data: analise, error: analiseErr } = await db
    .from("analises")
    .select("id, status, pagamento_id, user_id")
    .eq("id", analiseId)
    .single();

  if (analiseErr || !analise) {
    return NextResponse.json({ error: "Análise não encontrada." }, { status: 404 });
  }

  if (analise.user_id !== user.id) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  // ── 4. Gate on approved payment ───────────────────────────────────────────
  const { data: pagamento } = await db
    .from("pagamentos")
    .select("status")
    .eq("id", analise.pagamento_id)
    .single();

  if (pagamento?.status !== "aprovado") {
    return NextResponse.json(
      { error: "O pagamento ainda não foi aprovado. Aguarde a confirmação." },
      { status: 402 }
    );
  }

  // ── 5. Idempotency — skip if already running or done ─────────────────────
  if (analise.status === "concluida") {
    return NextResponse.json({ message: "Análise já concluída.", analiseId });
  }

  if (analise.status === "processando") {
    return NextResponse.json({ message: "Análise em andamento.", analiseId });
  }

  // ── 6. Fire and forget ────────────────────────────────────────────────────
  // rodarAnalise handles its own error catching and updates analise.status
  // to "concluida" or "erro" when done — we don't await here so the HTTP
  // response is immediate and the heavy work runs in the background.
  rodarAnalise(analiseId).catch((err) => {
    console.error(`[iniciar] Unhandled error in rodarAnalise(${analiseId}):`, err);
  });

  return NextResponse.json({ message: "Análise iniciada.", analiseId }, { status: 202 });
}
