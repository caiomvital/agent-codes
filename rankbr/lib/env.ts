/**
 * Environment variable validation.
 *
 * Import this in any server-only module that needs env vars.
 * Throws at startup with a clear message if a required var is missing.
 *
 * Usage:
 *   import { env } from "@/lib/env";
 *   const client = new SomeSDK(env.ANTHROPIC_API_KEY);
 */

function require(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `[env] Variável de ambiente obrigatória não definida: ${name}\n` +
      `Adicione-a ao arquivo .env.local e reinicie o servidor.`
    );
  }
  return value;
}

function optional(name: string, fallback = ""): string {
  return process.env[name] ?? fallback;
}

export const env = {
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL:      require("NEXT_PUBLIC_SUPABASE_URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: require("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  SUPABASE_SERVICE_KEY:          require("SUPABASE_SERVICE_KEY"),

  // Mercado Pago
  MERCADOPAGO_ACCESS_TOKEN:   require("MERCADOPAGO_ACCESS_TOKEN"),
  MERCADOPAGO_WEBHOOK_SECRET: optional("MERCADOPAGO_WEBHOOK_SECRET"),

  // Anthropic
  ANTHROPIC_API_KEY: require("ANTHROPIC_API_KEY"),

  // Google (optional — Google Business module skips gracefully when absent)
  GOOGLE_PLACES_API_KEY: optional("GOOGLE_PLACES_API_KEY"),

  // DataForSEO (optional — falls back to Claude)
  DATAFORSEO_LOGIN:    optional("DATAFORSEO_LOGIN"),
  DATAFORSEO_PASSWORD: optional("DATAFORSEO_PASSWORD"),

  // Resend (optional — emails are skipped gracefully when absent)
  RESEND_API_KEY: optional("RESEND_API_KEY"),

  // App
  NEXT_PUBLIC_APP_URL: optional("NEXT_PUBLIC_APP_URL", "https://rankbr.com.br"),
} as const;
