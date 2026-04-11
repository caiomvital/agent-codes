/**
 * Logger simples com níveis info / warn / error.
 *
 * - Desenvolvimento : saída legível no terminal (prefixo colorido + contexto)
 * - Produção        : JSON estruturado para o agregador de logs da Vercel
 *
 * Uso:
 *   import { logger } from "@/lib/logger";
 *   logger.info("Pagamento aprovado", "webhook", { paymentId: "123" });
 *   logger.error("Falha ao rodar análise", "analise", { analiseId, err });
 */

type Level = "info" | "warn" | "error";

interface LogPayload {
  level: Level;
  message: string;
  context?: string;
  timestamp: string;
  [key: string]: unknown;
}

const IS_PROD = process.env.NODE_ENV === "production";

function log(
  level: Level,
  message: string,
  context?: string,
  extra?: Record<string, unknown>
): void {
  const timestamp = new Date().toISOString();

  if (IS_PROD) {
    const payload: LogPayload = { level, message, timestamp };
    if (context) payload.context = context;
    if (extra)   Object.assign(payload, extra);

    const output = JSON.stringify(payload);
    if (level === "error") {
      console.error(output);
    } else if (level === "warn") {
      console.warn(output);
    } else {
      console.log(output);
    }
  } else {
    const ctx   = context ? ` [${context}]` : "";
    const label = `${timestamp} ${level.toUpperCase()}${ctx}`;

    if (level === "error") {
      console.error(label, message, extra ?? "");
    } else if (level === "warn") {
      console.warn(label, message, extra ?? "");
    } else {
      console.log(label, message, extra ?? "");
    }
  }
}

export const logger = {
  info:  (message: string, context?: string, extra?: Record<string, unknown>) =>
    log("info",  message, context, extra),
  warn:  (message: string, context?: string, extra?: Record<string, unknown>) =>
    log("warn",  message, context, extra),
  error: (message: string, context?: string, extra?: Record<string, unknown>) =>
    log("error", message, context, extra),
};
