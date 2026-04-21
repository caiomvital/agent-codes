/**
 * Module 1 — Google PageSpeed Insights v5
 *
 * Endpoint (free, no key required):
 *   GET https://www.googleapis.com/pagespeedonline/v5/runPagespeed
 *     ?url={url}&strategy=mobile&locale=pt_BR
 *
 * Thresholds (per web.dev):
 *   LCP  : good < 2500 ms  / poor ≥ 4000 ms
 *   TBT  : good < 200 ms   / poor ≥ 600 ms   (lab proxy for FID)
 *   CLS  : good < 0.1      / poor ≥ 0.25
 *   FCP  : good < 1800 ms  / poor ≥ 3000 ms
 *   TTFB : good < 800 ms   / poor ≥ 1800 ms
 */

import type { PageSpeedResult, PageSpeedMetric, MetricScore } from "@/types";

const PSI_BASE =
  "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";

// ─── threshold helpers ──────────────────────────────────────────────────────

function scoreMs(
  ms: number,
  good: number,
  poor: number
): MetricScore {
  if (ms < good) return "good";
  if (ms < poor) return "needs-improvement";
  return "poor";
}

function scoreUnitless(
  v: number,
  good: number,
  poor: number
): MetricScore {
  if (v < good) return "good";
  if (v < poor) return "needs-improvement";
  return "poor";
}

function fmtMs(ms: number): string {
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)} s` : `${Math.round(ms)} ms`;
}

function buildDefaultMetrics(): PageSpeedResult["metrics"] {
  const placeholder: PageSpeedMetric = {
    value: 0,
    unit: "ms",
    display: "—",
    score: "poor",
  };
  return { lcp: placeholder, tbt: placeholder, cls: placeholder, fcp: placeholder, ttfb: placeholder };
}

// ─── main ───────────────────────────────────────────────────────────────────

export async function analisarPageSpeed(url: string): Promise<PageSpeedResult> {
  const apiUrl = `${PSI_BASE}?url=${encodeURIComponent(url)}&strategy=mobile&locale=pt_BR`;

  let raw: Response;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    raw = await fetch(apiUrl, { signal: controller.signal });
    clearTimeout(timeout);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { performance_score: 0, metrics: buildDefaultMetrics(), error: `Timeout ou falha de rede: ${msg}` };
  }

  if (!raw.ok) {
    return {
      performance_score: 0,
      metrics: buildDefaultMetrics(),
      error: `PageSpeed API retornou ${raw.status}`,
    };
  }

  let data: Record<string, unknown>;
  try {
    data = await raw.json();
  } catch {
    return { performance_score: 0, metrics: buildDefaultMetrics(), error: "Resposta inválida da API" };
  }

  try {
    const lr = data.lighthouseResult as Record<string, unknown>;
    const audits = lr.audits as Record<string, Record<string, unknown>>;
    const cats   = lr.categories as Record<string, { score: number }>;

    const perfScore = Math.round((cats.performance?.score ?? 0) * 100);

    // ── LCP ──
    const lcpMs = Number(audits["largest-contentful-paint"]?.numericValue ?? 0);
    const lcp: PageSpeedMetric = {
      value:   lcpMs,
      unit:    "ms",
      display: fmtMs(lcpMs),
      score:   scoreMs(lcpMs, 2500, 4000),
    };

    // ── TBT (proxy for FID) ──
    const tbtMs = Number(audits["total-blocking-time"]?.numericValue ?? 0);
    const tbt: PageSpeedMetric = {
      value:   tbtMs,
      unit:    "ms",
      display: fmtMs(tbtMs),
      score:   scoreMs(tbtMs, 200, 600),
    };

    // ── CLS ──
    const clsVal = Number(audits["cumulative-layout-shift"]?.numericValue ?? 0);
    const cls: PageSpeedMetric = {
      value:   clsVal,
      unit:    "unitless",
      display: clsVal.toFixed(3),
      score:   scoreUnitless(clsVal, 0.1, 0.25),
    };

    // ── FCP ──
    const fcpMs = Number(audits["first-contentful-paint"]?.numericValue ?? 0);
    const fcp: PageSpeedMetric = {
      value:   fcpMs,
      unit:    "ms",
      display: fmtMs(fcpMs),
      score:   scoreMs(fcpMs, 1800, 3000),
    };

    // ── TTFB ──
    const ttfbMs = Number(audits["server-response-time"]?.numericValue ?? 0);
    const ttfb: PageSpeedMetric = {
      value:   ttfbMs,
      unit:    "ms",
      display: fmtMs(ttfbMs),
      score:   scoreMs(ttfbMs, 800, 1800),
    };

    return { performance_score: perfScore, metrics: { lcp, tbt, cls, fcp, ttfb } };
  } catch (err) {
    return {
      performance_score: 0,
      metrics: buildDefaultMetrics(),
      error: `Falha ao interpretar resposta: ${String(err)}`,
    };
  }
}
