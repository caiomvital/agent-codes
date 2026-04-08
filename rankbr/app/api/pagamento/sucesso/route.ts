import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase";
import { getMpPayment } from "@/lib/mercadopago";

/**
 * GET /api/pagamento/sucesso
 *
 * Mercado Pago redirects the buyer here after a successful payment.
 * Query params injected by MP:
 *   - payment_id        — MP internal payment ID
 *   - status            — "approved" | "pending" | "in_process"
 *   - merchant_order_id — MP merchant order ID
 *   - payment_type      — payment method slug
 *
 * SECURITY: Never trust the `status` query param. Always re-verify via
 * the MP REST API using `payment_id` before treating a payment as approved.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const paymentId = searchParams.get("payment_id");
  const redirectBase = new URL("/dashboard", request.url);

  // MP can redirect here even for pending/failed payments.
  if (!paymentId) {
    redirectBase.searchParams.set("aviso", "pagamento_sem_id");
    return NextResponse.redirect(redirectBase);
  }

  // 1. Verify payment status directly with the MP API.
  let mpPayment: Awaited<ReturnType<typeof getMpPayment>>;
  try {
    mpPayment = await getMpPayment(paymentId);
  } catch (err) {
    console.error("[sucesso] Failed to fetch payment from MP:", err);
    redirectBase.searchParams.set("aviso", "verificacao_falhou");
    return NextResponse.redirect(redirectBase);
  }

  const mpStatus = mpPayment.status;
  const externalReference = mpPayment.external_reference; // = our pagamento UUID

  // 2. Handle non-approved statuses gracefully.
  if (mpStatus !== "approved") {
    if (mpStatus === "pending" || mpStatus === "in_process") {
      redirectBase.searchParams.set("aviso", "pagamento_pendente");
    } else {
      redirectBase.searchParams.set("aviso", "pagamento_recusado");
    }
    return NextResponse.redirect(redirectBase);
  }

  if (!externalReference) {
    redirectBase.searchParams.set("aviso", "referencia_nao_encontrada");
    return NextResponse.redirect(redirectBase);
  }

  const db = createServiceSupabaseClient();

  // 3. Update pagamento status (webhook may have already done this — that's fine).
  await db
    .from("pagamentos")
    .update({
      status: "aprovado",
      mp_payment_id: String(mpPayment.id ?? ""),
      updated_at: new Date().toISOString(),
    })
    .eq("id", externalReference)
    .neq("status", "aprovado"); // Avoid overwriting if already set.

  // 4. Find the analise linked to this pagamento.
  const { data: analise } = await db
    .from("analises")
    .select("id, status")
    .eq("pagamento_id", externalReference)
    .single();

  // 5. Advance analise to "processando" if it hasn't been already.
  if (analise && analise.status === "aguardando") {
    await db
      .from("analises")
      .update({
        status: "processando",
        updated_at: new Date().toISOString(),
      })
      .eq("id", analise.id);
  }

  // 6. Redirect to the dashboard with the analise ID so the UI can poll for results.
  const successUrl = new URL("/dashboard", request.url);
  if (analise?.id) {
    successUrl.searchParams.set("analise", analise.id);
  }
  successUrl.searchParams.set("pagamento", "aprovado");

  return NextResponse.redirect(successUrl);
}
