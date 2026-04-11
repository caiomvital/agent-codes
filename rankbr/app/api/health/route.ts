import { NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * GET /api/health
 * Liveness + readiness check.
 * Verifica conectividade com o Supabase e retorna status 200 se tudo estiver ok.
 */
export async function GET() {
  const timestamp = new Date().toISOString();

  try {
    const db = createServiceSupabaseClient();
    const { error } = await db.from("users").select("id").limit(1).maybeSingle();

    if (error) {
      return NextResponse.json(
        { status: "degraded", timestamp, error: error.message },
        { status: 503 }
      );
    }

    return NextResponse.json({ status: "ok", timestamp });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { status: "error", timestamp, error: message },
      { status: 503 }
    );
  }
}
