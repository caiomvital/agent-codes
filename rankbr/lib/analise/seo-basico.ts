/**
 * Module 2 — SEO On-Page checker
 *
 * Fetches the site HTML (10 s timeout) and checks:
 *   title · meta description · H1 · canonical · meta robots
 *   OG tags · robots.txt · sitemap.xml · HTTPS · images without alt
 *
 * Score (0-100):
 *   HTTPS              : 10 pts
 *   title              : 5 pts (present) + 5 pts (30-60 chars)
 *   meta description   : 5 pts (present) + 5 pts (100-160 chars)
 *   H1                 : 8 pts (present) + 4 pts (single)
 *   canonical          : 6 pts
 *   meta robots        : 4 pts (present + not "noindex")
 *   OG tags            : 5 pts
 *   robots.txt         : 8 pts
 *   sitemap.xml        : 10 pts
 *   images without alt : up to 15 pts  (15 × imgsWithAlt / total)
 *   ──────────────────────────────────
 *   Total              : 100 pts
 */

import type { SeoBasicoResult, SeoCheck } from "@/types";

// ─── HTML helpers ────────────────────────────────────────────────────────────

function extractTag(html: string, pattern: RegExp): string | null {
  const m = html.match(pattern);
  return m ? (m[1] ?? m[0]).replace(/<[^>]+>/g, "").trim() : null;
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, "").trim();
}

function check(passed: boolean, value: string | number | undefined, message: string): SeoCheck {
  return { passed, value, message };
}

// ─── fetch with timeout ──────────────────────────────────────────────────────

async function fetchWithTimeout(url: string, timeoutMs = 10_000): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; RankBR/1.0; +https://rankbr.com.br/bot)",
        Accept: "text/html,application/xhtml+xml,*/*",
      },
      redirect: "follow",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

async function urlExists(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5_000);
    const res = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; RankBR/1.0)",
      },
    });
    clearTimeout(timer);
    return res.ok;
  } catch {
    return false;
  }
}

// ─── scoring ─────────────────────────────────────────────────────────────────

function calcScore(checks: Omit<SeoBasicoResult, "score" | "h2_count" | "error">): number {
  let pts = 0;
  if (checks.https.passed)               pts += 10;
  if (checks.title.passed) {
    pts += 5;
    const len = Number(checks.title.value ?? 0);
    if (len >= 30 && len <= 60)          pts += 5;
  }
  if (checks.meta_description.passed) {
    pts += 5;
    const len = Number(checks.meta_description.value ?? 0);
    if (len >= 100 && len <= 160)        pts += 5;
  }
  if (checks.h1.passed) {
    pts += 8;
    if (checks.h1.value === 1)           pts += 4;
  }
  if (checks.canonical.passed)           pts += 6;
  if (checks.meta_robots.passed)         pts += 4;
  if (checks.og_tags.passed)             pts += 5;
  if (checks.robots_txt.passed)          pts += 8;
  if (checks.sitemap.passed)             pts += 10;

  // images without alt: up to 15 pts
  const imgData = String(checks.images_without_alt.value ?? "0/0");
  const [withoutStr, totalStr] = imgData.split("/");
  const without = parseInt(withoutStr, 10);
  const total   = parseInt(totalStr,   10);
  if (total === 0) {
    pts += 15; // no images = no problem
  } else {
    const ratio = 1 - without / total;
    pts += Math.round(15 * ratio);
  }

  return Math.min(100, pts);
}

// ─── main ────────────────────────────────────────────────────────────────────

export async function analisarSeoBasico(url: string): Promise<SeoBasicoResult> {
  let origin: string;
  try {
    origin = new URL(url).origin;
  } catch {
    return buildError(url, "URL inválida");
  }

  // ── HTTPS ──
  const isHttps = url.startsWith("https://");
  const httpsCheck = check(isHttps, undefined,
    isHttps ? "Site usa HTTPS ✓" : "Site não usa HTTPS — migração urgente para segurança e SEO");

  // ── Fetch HTML ──
  let html: string;
  try {
    html = await fetchWithTimeout(url);
  } catch (err) {
    return buildError(url, `Falha ao buscar o site: ${String(err)}`);
  }

  // ── title ──
  const titleText = extractTag(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const titleLen  = titleText?.length ?? 0;
  const titleCheck = check(
    !!titleText,
    titleLen,
    titleText
      ? (titleLen < 30 ? `Título muito curto (${titleLen} chars — ideal: 30-60)`
        : titleLen > 60 ? `Título muito longo (${titleLen} chars — ideal: 30-60)`
        : `Título OK (${titleLen} chars)`)
      : "Tag <title> ausente — crítico para SEO"
  );

  // ── meta description ──
  const descText =
    extractTag(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)/i) ??
    extractTag(html, /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i);
  const descLen = descText?.length ?? 0;
  const metaDescCheck = check(
    !!descText,
    descLen,
    descText
      ? (descLen < 100 ? `Meta description curta (${descLen} chars — ideal: 100-160)`
        : descLen > 160 ? `Meta description longa (${descLen} chars — ideal: 100-160)`
        : `Meta description OK (${descLen} chars)`)
      : "Meta description ausente — impacta CTR nos resultados do Google"
  );

  // ── H1 ──
  const h1Matches = html.match(/<h1[^>]*>[\s\S]*?<\/h1>/gi) ?? [];
  const h1Count   = h1Matches.length;
  const h1Text    = h1Matches[0] ? stripTags(h1Matches[0]) : null;
  const h1Check   = check(
    h1Count > 0,
    h1Count,
    h1Count === 0 ? "Tag H1 ausente — necessária para indicar o tema da página"
      : h1Count > 1 ? `${h1Count} tags H1 encontradas — use apenas uma`
      : `H1 encontrado: "${h1Text?.slice(0, 60)}"`
  );

  // ── H2 count ──
  const h2Count = (html.match(/<h2[^>]*>/gi) ?? []).length;

  // ── canonical ──
  const canonical =
    extractTag(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)/i) ??
    extractTag(html, /<link[^>]+href=["']([^"']*)["'][^>]+rel=["']canonical["']/i);
  const canonicalCheck = check(
    !!canonical,
    canonical ?? undefined,
    canonical ? `Canonical: ${canonical}` : "Tag canonical ausente — pode causar conteúdo duplicado"
  );

  // ── meta robots ──
  const robotsContent =
    extractTag(html, /<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)/i) ??
    extractTag(html, /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']robots["']/i);
  const isNoindex = robotsContent?.toLowerCase().includes("noindex") ?? false;
  const metaRobotsCheck = check(
    robotsContent !== null && !isNoindex,
    robotsContent ?? undefined,
    isNoindex
      ? `ATENÇÃO: página bloqueada por meta robots="${robotsContent}"`
      : robotsContent
      ? `Meta robots: ${robotsContent}`
      : "Meta robots não encontrado (comportamento padrão do Google)"
  );

  // ── OG tags ──
  const ogTitle = /<meta[^>]+property=["']og:title["']/i.test(html);
  const ogDesc  = /<meta[^>]+property=["']og:description["']/i.test(html);
  const ogImage = /<meta[^>]+property=["']og:image["']/i.test(html);
  const ogCount = [ogTitle, ogDesc, ogImage].filter(Boolean).length;
  const ogCheck = check(
    ogCount >= 2,
    `${ogCount}/3`,
    ogCount >= 2
      ? `Open Graph configurado (${ogCount}/3 tags)`
      : `Open Graph incompleto (${ogCount}/3) — compartilhamentos nas redes sociais ficam sem preview`
  );

  // ── images without alt ──
  const allImgs     = html.match(/<img[^>]*>/gi) ?? [];
  const imgsNoAlt   = allImgs.filter((img) => !/alt=["'][^"']+["']/.test(img)).length;
  const imgCheck    = check(
    imgsNoAlt === 0,
    `${imgsNoAlt}/${allImgs.length}`,
    imgsNoAlt === 0
      ? `Todas as imagens têm atributo alt (${allImgs.length} imagens)`
      : `${imgsNoAlt} de ${allImgs.length} imagens sem alt — prejudica acessibilidade e SEO de imagens`
  );

  // ── robots.txt & sitemap.xml (parallel) ──
  const [robotsTxtExists, sitemapExists] = await Promise.all([
    urlExists(`${origin}/robots.txt`),
    urlExists(`${origin}/sitemap.xml`),
  ]);

  const robotsTxtCheck = check(
    robotsTxtExists, undefined,
    robotsTxtExists ? "robots.txt encontrado" : "robots.txt ausente — crie para controlar indexação"
  );
  const sitemapCheck = check(
    sitemapExists, undefined,
    sitemapExists ? "sitemap.xml encontrado" : "sitemap.xml ausente — acelera indexação do Google"
  );

  const checks = {
    https: httpsCheck,
    title: titleCheck,
    meta_description: metaDescCheck,
    h1: h1Check,
    canonical: canonicalCheck,
    meta_robots: metaRobotsCheck,
    og_tags: ogCheck,
    robots_txt: robotsTxtCheck,
    sitemap: sitemapCheck,
    images_without_alt: imgCheck,
  };

  return {
    score: calcScore(checks),
    h2_count: h2Count,
    ...checks,
  };
}

function buildError(url: string, error: string): SeoBasicoResult {
  const placeholder = check(false, undefined, "Não foi possível verificar");
  return {
    score: 0,
    https: check(url.startsWith("https://"), undefined, ""),
    title: placeholder, meta_description: placeholder, h1: placeholder,
    canonical: placeholder, meta_robots: placeholder, og_tags: placeholder,
    robots_txt: placeholder, sitemap: placeholder, images_without_alt: placeholder,
    h2_count: 0,
    error,
  };
}
