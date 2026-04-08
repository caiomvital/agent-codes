import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase";
import { getMpPayment, validateWebhookSignature } from "@/lib/mercadopago";

/**
 * POST /api/pagamento/webhook
 *
 * Receives Mercado Pago event notifications and keeps our database in sync.
 *
 * MP calls this endpoint whenever a payment status changes.
 * We must respond 200 quickly — any heavy work (AI analysis) is enqueued
 * by updating the analises row to status "processando", which a background
 * worker (to be implemented) will pick up.
 *
 * Idempotency: if the pagamento is already "aprovado" we still return 200
 * so MP stops retrying, but we skip the DB updates.
 *
 * @see https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
 */
export async function POST(request: NextRequest) {
  // 1. Signature validation.
  const xSignature = request.headers.get("x-signature") ?? "";
  const xRequestId = request.headers.get("x-request-id");

  let rawBody: string;
  let notification: Record<string, unknown>;

  try {
    rawBody = await request.text();
    notification = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // The data.id from the notification body is used in the signature manifest.
  const dataId = String(
    (notification.data as Record<string, unknown>)?.id ?? ""
  );

  if (
    xSignature &&
    !validateWebhookSignature({ xSignature, xRequestId, dataId })
  ) {
    console.warn("[webhook] Invalid signature — rejecting.");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // 2. We only process "payment" topic events.
  const type = notification.type as string | undefined;
  const action = notification.action as string | undefined;

  if (type !== "payment") {
    // Acknowledge non-payment events (merchant_order, etc.) without processing.
    return NextResponse.json({ received: true });
  }

  // 3. Fetch the full payment from the MP API — never trust webhook body alone.
  if (!dataId) {
    return NextResponse.json({ error: "Missing data.id" }, { status: 400 });
  }

  let mpPayment: Awaited<ReturnType<typeof getMpPayment>>;
  try {
    mpPayment = await getMpPayment(dataId);
  } catch (err) {
    console.error("[webhook] Failed to fetch payment from MP:", err);
    // Return 500 so MP will retry.
    return NextResponse.json(
      { error: "Could not fetch payment" },
      { status: 500 }
    );
  }

  const mpStatus = mpPayment.status; // "approved" | "pending" | "rejected" | "cancelled" | ...
  const externalReference = mpPayment.external_reference; // = our pagamento UUID
  const mpPaymentId = String(mpPayment.id ?? "");

  if (!externalReference) {
    // Payment not linked to our system — ignore silently.
    return NextResponse.json({ received: true });
  }

  // 4. Map MP status → our status.
  const statusMap: Record<string, string> = {
    approved: "aprovado",
    pending: "pendente",
    in_process: "pendente",
    rejected: "recusado",
    cancelled: "cancelado",
    refunded: "cancelado",
    charged_back: "cancelado",
  };
  const novoStatus = statusMap[mpStatus ?? ""] ?? "pendente";

  const db = createServiceSupabaseClient();

  // 5. Find our pagamento record.
  const { data: pagamento, error: findError } = await db
    .from("pagamentos")
    .select("id, status, site_id, user_id")
    .eq("id", externalReference)
    .single();

  if (findError || !pagamento) {
    console.error("[webhook] pagamento not found:", externalReference, findError);
    // Return 200 to stop MP from retrying an event we can't process.
    return NextResponse.json({ received: true });
  }

  // 6. Idempotency — skip if already in the target state.
  if (pagamento.status === novoStatus) {
    return NextResponse.json({ received: true });
  }

  // 7. Update pagamentos.
  const { error: updateError } = await db
    .from("pagamentos")
    .update({
      status: novoStatus,
      mp_payment_id: mpPaymentId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", pagamento.id);

  if (updateError) {
    console.error("[webhook] Failed to update pagamento:", updateError);
    return NextResponse.json({ error: "DB update failed" }, { status: 500 });
  }

  // 8. On approval, move the analise to "processando" to trigger the AI pipeline.
  if (novoStatus === "aprovado") {
    const { error: analiseError } = await db
      .from("analises")
      .update({
        status: "processando",
        updated_at: new Date().toISOString(),
      })
      .eq("pagamento_id", pagamento.id)
      .eq("status", "aguardando"); // Only update if not already processing/done.

    if (analiseError) {
      console.error("[webhook] Failed to update analise:", analiseError);
      // Non-fatal — log and continue. The background worker can recover.
    }

    // TODO: Enqueue AI analysis job here (e.g. trigger a background route,
    //       Supabase Edge Function, or a queue like BullMQ / Inngest).
    console.log(
      `[webhook] Payment approved — analise queued for site ${pagamento.site_id}`
    );
  }

  console.log(
    `[webhook] action=${action} payment=${mpPaymentId} status=${novoStatus} pagamento=${pagamento.id}`
  );

  return NextResponse.json({ received: true });
}
