/**
 * Resend email client
 *
 * Usage:
 *   import { sendEmail } from "@/lib/email";
 *   import { BemVindo } from "@/emails/BemVindo";
 *
 *   await sendEmail({
 *     to: "user@example.com",
 *     subject: "Bem-vindo ao RankBR!",
 *     component: <BemVindo nome="João" />,
 *   });
 *
 * Required env var: RESEND_API_KEY
 */

import { Resend } from "resend";
import { createElement } from "react";
import type { ReactElement } from "react";

const FROM = "RankBR <noreply@rankbr.com.br>";

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY não configurada.");
    _resend = new Resend(apiKey);
  }
  return _resend;
}

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  /** A React Email component already instantiated: <BemVindo nome="João" /> */
  component: ReactElement;
  /** Optional reply-to address */
  replyTo?: string;
}

interface SendEmailResult {
  id?: string;
  error?: string;
}

/**
 * Sends a transactional email via Resend.
 * Never throws — returns { error } on failure so callers can log and continue.
 */
export async function sendEmail({
  to,
  subject,
  component,
  replyTo,
}: SendEmailOptions): Promise<SendEmailResult> {
  // Skip in test environments
  if (process.env.NODE_ENV === "test") {
    return { id: "test-skipped" };
  }

  // In development without a key, log and skip
  if (!process.env.RESEND_API_KEY) {
    console.warn(
      `[email] RESEND_API_KEY não definida — email não enviado. Assunto: "${subject}" Para: ${to}`
    );
    return { id: "dev-skipped" };
  }

  try {
    const resend = getResend();

    const { data, error } = await resend.emails.send({
      from: FROM,
      to: Array.isArray(to) ? to : [to],
      subject,
      react: component,
      ...(replyTo ? { reply_to: replyTo } : {}),
    });

    if (error) {
      console.error("[email] Resend error:", error);
      return { error: error.message };
    }

    console.log(`[email] Enviado "${subject}" → ${to} (id: ${data?.id})`);
    return { id: data?.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[email] Exceção ao enviar email:", msg);
    return { error: msg };
  }
}
