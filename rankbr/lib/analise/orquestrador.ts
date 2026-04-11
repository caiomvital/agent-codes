/**
 * Module 5 — Analysis Orchestrator
 *
 * rodarAnalise(analiseId):
 *   1. Fetch analise + site rows from DB
 *   2. Run all 4 data modules in parallel (Promise.allSettled — failures are
 *      isolated; one bad module never aborts the whole pipeline)
 *   3. Calculate composite scores
 *   4. Call the IA module to generate the report
 *   5. Persist resultado to analises
 *   6. Insert individual tarefas rows
 *   7. Mark analise as "concluida" (or "erro" if fatal)
 */

import { createElement } from "react";
import { createServiceSupabaseClient } from "@/lib/supabase";
import { sendEmail } from "@/lib/email";
import { AnaliseCompleta } from "@/emails/AnaliseCompleta";
import { analisarPageSpeed }     from "./pagespeed";
import { analisarSeoBasico }     from "./seo-basico";
import { buscarGoogleBusiness }  from "./google-business";
import { sugerirPalavrasChave }  from "./palavras-chave";
import { gerarRelatorioIA }      from "./ia";
import type {
  Site,
  PageSpeedResult,
  SeoBasicoResult,
  GoogleBusinessResult,
  PalavrasChaveResult,
  ResultadoAnalise,
} from "@/types";

// ─── score calculation ───────────────────────────────────────────────────────

interface Scores {
  score_geral:       number;
  score_performance: number;
  score_seo:         number;
  score_business:    number;
}

function calcularScores(
  ps: PageSpeedResult,
  seo: SeoBasicoResult,
  gb: GoogleBusinessResult
): Scores {
  // Performance: directly from PageSpeed (0-100)
  const score_performance = ps.error ? 0 : ps.performance_score;

  // SEO: directly from on-page checker (0-100)
  const score_seo = seo.error ? 0 : seo.score;

  // Google Business: composite from presence, rating, reviews, photos
  let score_business: number;
  if (gb.error && !gb.encontrado) {
    score_business = 0;
  } else if (!gb.encontrado) {
    score_business = 5; // Present on internet but zero local presence
  } else {
    let biz = 40; // Base: found on Maps
    if ((gb.total_avaliacoes ?? 0) > 0)  biz += 15; // Has reviews
    if ((gb.rating ?? 0) >= 4.0)         biz += 15; // Good rating
    if ((gb.rating ?? 0) >= 4.5)         biz += 5;  // Excellent rating
    if (gb.verificado)                   biz += 15; // Likely claimed/verified
    if ((gb.fotos_count ?? 0) >= 5)      biz += 10; // Has photos
    score_business = Math.min(100, biz);
  }

  // Composite: performance 35% · SEO 40% · Business 25%
  const score_geral = Math.round(
    score_performance * 0.35 +
    score_seo         * 0.40 +
    score_business    * 0.25
  );

  return { score_geral, score_performance, score_seo, score_business };
}

// ─── helpers for allSettled ──────────────────────────────────────────────────

function settled<T>(
  result: PromiseSettledResult<T>,
  fallback: T
): T {
  if (result.status === "fulfilled") return result.value;
  console.error("[orquestrador] Module failed:", result.reason);
  return fallback;
}

function psError(err: unknown): PageSpeedResult {
  return {
    performance_score: 0,
    metrics: {
      lcp:  { value: 0, unit: "ms", display: "—", score: "poor" },
      tbt:  { value: 0, unit: "ms", display: "—", score: "poor" },
      cls:  { value: 0, unit: "unitless", display: "—", score: "poor" },
      fcp:  { value: 0, unit: "ms", display: "—", score: "poor" },
      ttfb: { value: 0, unit: "ms", display: "—", score: "poor" },
    },
    error: String(err),
  };
}

function seoError(err: unknown): SeoBasicoResult {
  const placeholder = { passed: false, message: "Não verificado" };
  return {
    score: 0,
    https: placeholder, title: placeholder, meta_description: placeholder,
    h1: placeholder, canonical: placeholder, meta_robots: placeholder,
    og_tags: placeholder, robots_txt: placeholder, sitemap: placeholder,
    images_without_alt: placeholder,
    h2_count: 0,
    error: String(err),
  };
}

function gbError(err: unknown): GoogleBusinessResult {
  return { encontrado: false, error: String(err) };
}

function pkError(err: unknown): PalavrasChaveResult {
  return { palavras: [], fonte: "ia", error: String(err) };
}

// ─── main ────────────────────────────────────────────────────────────────────

export async function rodarAnalise(analiseId: string): Promise<void> {
  const db = createServiceSupabaseClient();

  // ── 1. Mark as processando ──────────────────────────────────────────────
  await db
    .from("analises")
    .update({ status: "processando", updated_at: new Date().toISOString() })
    .eq("id", analiseId);

  try {
    // ── 2. Fetch analise + site ───────────────────────────────────────────
    const { data: analise, error: fetchErr } = await db
      .from("analises")
      .select("*, sites(*)")
      .eq("id", analiseId)
      .single();

    if (fetchErr || !analise) {
      throw new Error(`Analise ${analiseId} não encontrada: ${fetchErr?.message}`);
    }

    const site = analise.sites as unknown as Site;
    if (!site?.url) throw new Error("Site sem URL associado");

    console.log(`[orquestrador] Iniciando análise ${analiseId} — ${site.url}`);

    // ── 3. Run all modules in parallel ────────────────────────────────────
    const [psResult, seoResult, gbResult, pkResult] = await Promise.allSettled([
      analisarPageSpeed(site.url),
      analisarSeoBasico(site.url),
      buscarGoogleBusiness(site.nome, site.cidade, site.estado),
      sugerirPalavrasChave(site.segmento, site.cidade, site.estado),
    ]);

    const pagespeed      = settled(psResult,  psError(psResult.status === "rejected" ? psResult.reason : "unknown"));
    const seo            = settled(seoResult, seoError(seoResult.status === "rejected" ? seoResult.reason : "unknown"));
    const google_business = settled(gbResult, gbError(gbResult.status === "rejected" ? gbResult.reason : "unknown"));
    const palavras_chave  = settled(pkResult, pkError(pkResult.status === "rejected" ? pkResult.reason : "unknown"));

    // ── 4. Calculate scores ───────────────────────────────────────────────
    const scores = calcularScores(pagespeed, seo, google_business);

    console.log(
      `[orquestrador] Scores — geral:${scores.score_geral} perf:${scores.score_performance} seo:${scores.score_seo} biz:${scores.score_business}`
    );

    // ── 5. Generate AI report ─────────────────────────────────────────────
    const relatorio = await gerarRelatorioIA({
      site,
      ...scores,
      pagespeed,
      seo,
      google_business,
      palavras_chave,
    });

    // ── 6. Build and persist resultado ────────────────────────────────────
    const resultado: ResultadoAnalise = {
      ...scores,
      pagespeed,
      seo,
      google_business,
      palavras_chave,
      relatorio,
      gerado_em: new Date().toISOString(),
    };

    const { error: updateErr } = await db
      .from("analises")
      .update({
        status:      "concluida",
        resultado,
        updated_at:  new Date().toISOString(),
      })
      .eq("id", analiseId);

    if (updateErr) {
      throw new Error(`Falha ao salvar resultado: ${updateErr.message}`);
    }

    // ── 7. Insert tarefas rows ────────────────────────────────────────────
    if (relatorio.tarefas.length > 0) {
      const tarefasRows = relatorio.tarefas.map((t) => ({
        analise_id:      analiseId,
        titulo:          t.titulo,
        descricao:       t.descricao,
        categoria:       t.categoria,
        prioridade:      t.prioridade,
        tempo_estimado:  t.tempo_estimado,
        concluida:       false,
      }));

      const { error: tarefasErr } = await db.from("tarefas").insert(tarefasRows);
      if (tarefasErr) {
        // Non-fatal: log and continue — the full result is already saved.
        console.error("[orquestrador] Falha ao inserir tarefas:", tarefasErr.message);
      }
    }

    // ── 8. Send AnaliseCompleta email ─────────────────────────────────────
    const { data: userRow } = await db
      .from("users")
      .select("name, email")
      .eq("id", analise.user_id)
      .single();

    if (userRow?.email) {
      const top3 = relatorio.tarefas
        .sort((a, b) => a.prioridade - b.prioridade)
        .slice(0, 3)
        .map((t) => ({ titulo: t.titulo, categoria: t.categoria, prioridade: t.prioridade }));

      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://rankbr.com.br";

      sendEmail({
        to: userRow.email,
        subject: `Diagnóstico de ${site.nome} pronto — score ${scores.score_geral}/100`,
        component: createElement(AnaliseCompleta, {
          nome:             userRow.name ?? userRow.email,
          nomeSite:         site.nome,
          urlSite:          site.url,
          scoreGeral:       scores.score_geral,
          scorePerformance: scores.score_performance,
          scoreSeo:         scores.score_seo,
          scoreBusiness:    scores.score_business,
          top3Tarefas:      top3,
          analiseId,
          appUrl,
        }),
      }).catch((err) =>
        console.error("[orquestrador] Falha ao enviar AnaliseCompleta:", err)
      );
    }

    console.log(`[orquestrador] Análise ${analiseId} concluída com sucesso ✓`);
  } catch (err) {
    // ── Fatal error: mark as erro ─────────────────────────────────────────
    console.error(`[orquestrador] Falha fatal na análise ${analiseId}:`, err);

    await db
      .from("analises")
      .update({
        status: "erro",
        resultado: { error: String(err), gerado_em: new Date().toISOString() } as unknown as ResultadoAnalise,
        updated_at: new Date().toISOString(),
      })
      .eq("id", analiseId);
  }
}
