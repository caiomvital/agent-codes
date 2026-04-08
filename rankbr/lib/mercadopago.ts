/**
 * Mercado Pago integration — server-side only.
 * Never import this file in Client Components.
 */
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import crypto from "crypto";

// ─── client ────────────────────────────────────────────────────────────────

const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
  options: { timeout: 10_000 },
});

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// ─── preference ────────────────────────────────────────────────────────────

export interface CreatePreferenceParams {
  /** Internal UUID of the sites row. Used as the item ID. */
  siteId: string;
  /** Display name of the business — appears on the MP checkout screen. */
  nomeNegocio: string;
  /** Payer e-mail (pre-fills the MP checkout form). */
  email: string;
  /**
   * Internal UUID of the pagamentos row.
   * Stored as external_reference so webhooks can match back to our DB.
   */
  pagamentoId: string;
}

/**
 * Creates a Checkout Pro preference and returns the redirect URL (init_point).
 *
 * @throws {Error} if the MP API does not return an init_point.
 */
export async function createPreference({
  siteId,
  nomeNegocio,
  email,
  pagamentoId,
}: CreatePreferenceParams): Promise<string> {
  const preference = new Preference(mpClient);

  const response = await preference.create({
    body: {
      items: [
        {
          id: siteId,
          title: `Diagnóstico RankBR — ${nomeNegocio}`,
          description:
            "Diagnóstico completo de marketing digital com IA. Entrega em até 5 minutos.",
          quantity: 1,
          unit_price: 10.0,
          currency_id: "BRL",
        },
      ],
      payer: { email },
      /**
       * external_reference is returned in both the webhook body and the
       * back_url query string, letting us look up our pagamentos record.
       */
      external_reference: pagamentoId,
      back_urls: {
        success: `${APP_URL}/api/pagamento/sucesso`,
        failure: `${APP_URL}/api/pagamento/falha`,
        pending: `${APP_URL}/api/pagamento/pendente`,
      },
      /**
       * auto_approve: false means we must check payment status explicitly —
       * never trust only the back_url redirect.
       */
      auto_approve: false,
      /**
       * notification_url receives POST events whenever payment status changes.
       * Must be publicly reachable (use ngrok in development).
       */
      notification_url: `${APP_URL}/api/pagamento/webhook`,
      statement_descriptor: "RANKBR",
    },
  });

  if (!response.init_point) {
    throw new Error(
      "Mercado Pago não retornou uma URL de pagamento. Tente novamente."
    );
  }

  return response.init_point;
}

// ─── payment lookup ────────────────────────────────────────────────────────

/**
 * Fetches full payment details from Mercado Pago.
 * Use this to verify payment status — never trust MP redirect query params alone.
 */
export async function getMpPayment(paymentId: string | number) {
  const payment = new Payment(mpClient);
  return payment.get({ id: String(paymentId) });
}

// ─── webhook signature validation ─────────────────────────────────────────

/**
 * Validates the x-signature header sent by Mercado Pago on webhook events.
 *
 * Signing algorithm (MP v2 webhooks):
 *   manifest = "id:{data.id};request-id:{x-request-id};ts:{ts}"
 *   expected  = HMAC-SHA256(MERCADOPAGO_WEBHOOK_SECRET, manifest)
 *
 * @see https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
 */
export function validateWebhookSignature({
  xSignature,
  xRequestId,
  dataId,
}: {
  xSignature: string;
  xRequestId: string | null;
  dataId: string;
}): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) {
    // Secret not configured — skip validation in development.
    // In production, set MERCADOPAGO_WEBHOOK_SECRET and remove this bypass.
    console.warn(
      "[webhook] MERCADOPAGO_WEBHOOK_SECRET not set — skipping signature check."
    );
    return true;
  }

  try {
    // Parse "ts=1715787836,v1=abc123def456..."
    const sigMap = Object.fromEntries(
      xSignature
        .split(",")
        .map((s) => s.trim().split("=", 2) as [string, string])
    );
    const { ts, v1 } = sigMap;
    if (!ts || !v1) return false;

    const parts: string[] = [];
    if (dataId) parts.push(`id:${dataId}`);
    if (xRequestId) parts.push(`request-id:${xRequestId}`);
    parts.push(`ts:${ts}`);

    const manifest = parts.join(";");
    const expected = crypto
      .createHmac("sha256", secret)
      .update(manifest)
      .digest("hex");

    // Use timingSafeEqual to prevent timing attacks.
    return crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(v1.toLowerCase(), "hex")
    );
  } catch {
    return false;
  }
}
