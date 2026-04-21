import { NextRequest, NextResponse } from "next/server";
import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { createServerSupabaseClient, createServiceSupabaseClient } from "@/lib/supabase";
import { logger } from "@/lib/logger";
import { RelatorioPDF } from "@/lib/pdf/RelatorioPDF";
import type { ResultadoAnalise, CategoriaTarefa } from "@/types";

// Force dynamic rendering — never cache a personalized PDF.
export const dynamic = "force-dynamic";

interface TarefaRow {
  id: string;
  titulo: string;
  descricao: string;
  categoria: CategoriaTarefa;
  prioridade: number;
  tempo_estimado: string;
  concluida: boolean;
}

/**
 * GET /api/analise/[id]/pdf
 *
 * Generates and streams a PDF report for the given analysis.
 *
 * Security:
 *  - Verifies the caller is authenticated.
 *  - Verifies the analysis belongs to the authenticated user.
 *  - Returns 404 (not 403) for missing / mismatched analyses to avoid
 *    leaking whether an ID exists.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id: analiseId } = params;

  // ── 1. Auth ────────────────────────────────────────────────────────────────
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });
  }

  // ── 2. Fetch analysis (service role bypasses RLS for the join) ─────────────
  const db = createServiceSupabaseClient();

  const { data: analise, error: analiseError } = await db
    .from("analises")
    .select("id, status, resultado, user_id, sites(nome, url)")
    .eq("id", analiseId)
    .single();

  if (analiseError || !analise) {
    return NextResponse.json({ error: "Análise não encontrada." }, { status: 404 });
  }

  // Ownership check — return 404 so callers cannot enumerate IDs.
  if (analise.user_id !== user.id) {
    return NextResponse.json({ error: "Análise não encontrada." }, { status: 404 });
  }

  if (analise.status !== "concluida" || !analise.resultado) {
    return NextResponse.json(
      { error: "O relatório ainda não está disponível." },
      { status: 409 }
    );
  }

  // ── 3. Fetch tasks ─────────────────────────────────────────────────────────
  const { data: tarefasRaw } = await db
    .from("tarefas")
    .select("id, titulo, descricao, categoria, prioridade, tempo_estimado, concluida")
    .eq("analise_id", analiseId)
    .order("prioridade", { ascending: true });

  const tarefas: TarefaRow[] = tarefasRaw ?? [];

  // ── 4. Resolve site info ───────────────────────────────────────────────────
  const siteRaw = analise.sites;
  const site    = Array.isArray(siteRaw) ? siteRaw[0] : siteRaw;
  const nomeSite = (site as { nome?: string } | null)?.nome ?? "Seu site";
  const urlSite  = (site as { url?: string } | null)?.url  ?? "";

  const resultado = analise.resultado as ResultadoAnalise;

  // ── 5. Render PDF ──────────────────────────────────────────────────────────
  // Cast needed: createElement returns FunctionComponentElement<RelatorioPDFProps>
  // but renderToBuffer expects ReactElement<DocumentProps> (the inner Document).
  // At runtime the component wraps a <Document>, so the cast is safe.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type AnyElement = Parameters<typeof renderToBuffer>[0];

  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await renderToBuffer(
      createElement(RelatorioPDF, { nomeSite, urlSite, resultado, tarefas }) as AnyElement
    );
  } catch (err) {
    logger.error("Falha ao renderizar PDF", "analise/pdf", {
      analiseId,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: "Não foi possível gerar o PDF. Tente novamente." },
      { status: 500 }
    );
  }

  // ── 6. Build filename ──────────────────────────────────────────────────────
  const slug = nomeSite
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")  // strip accents
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);

  const filename = `relatorio-rankbr-${slug}.pdf`;

  logger.info("PDF gerado", "analise/pdf", { analiseId, userId: user.id, filename });

  // ── 7. Stream response ─────────────────────────────────────────────────────
  // Use the WHATWG Response (not NextResponse) so TypeScript accepts Buffer
  // (which is a Uint8Array/ArrayBufferView) as a valid BodyInit.
  // new Uint8Array() is required: Node Buffer extends Uint8Array but TypeScript's
  // BodyInit types don't reflect the inheritance; the copy is zero-cost.
  return new Response(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type":        "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length":      String(pdfBuffer.length),
      "Cache-Control":       "private, no-store",
    },
  });
}
