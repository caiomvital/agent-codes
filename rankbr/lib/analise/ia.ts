/**
 * Module 6 — AI Report Generator (Claude)
 *
 * Receives all collected analysis data, calls Claude claude-sonnet-4-6,
 * and returns a structured report with:
 *   - Executive summary
 *   - 3 strengths
 *   - 3 critical problems
 *   - 10 prioritised action tasks
 *
 * The model is instructed to respond ONLY with valid JSON matching RelatorioIA.
 */

import Anthropic from "@anthropic-ai/sdk";
import { SEGMENTOS } from "@/types";
import type {
  PageSpeedResult,
  SeoBasicoResult,
  GoogleBusinessResult,
  PalavrasChaveResult,
  RelatorioIA,
  Site,
} from "@/types";

// ─── types ───────────────────────────────────────────────────────────────────

interface GerarRelatorioParams {
  site: Pick<Site, "url" | "nome" | "segmento" | "cidade" | "estado">;
  score_geral: number;
  score_performance: number;
  score_seo: number;
  score_business: number;
  pagespeed: PageSpeedResult;
  seo: SeoBasicoResult;
  google_business: GoogleBusinessResult;
  palavras_chave: PalavrasChaveResult;
}

// ─── prompt builder ──────────────────────────────────────────────────────────

function buildPrompt(p: GerarRelatorioParams): string {
  const loc = [p.site.cidade, p.site.estado].filter(Boolean).join(", ") || "Brasil";
  const segLabel = SEGMENTOS[p.site.segmento] ?? p.site.segmento;

  // ── PageSpeed section ──
  const { metrics: m, performance_score: ps, error: psErr } = p.pagespeed;
  const perfSection = psErr
    ? `Não foi possível obter dados de desempenho: ${psErr}`
    : `
  • Score de performance (mobile): ${ps}/100
  • LCP (Largest Contentful Paint): ${m.lcp.display} [${m.lcp.score}]
  • TBT (Total Blocking Time / proxy FID): ${m.tbt.display} [${m.tbt.score}]
  • CLS (Cumulative Layout Shift): ${m.cls.display} [${m.cls.score}]
  • FCP (First Contentful Paint): ${m.fcp.display} [${m.fcp.score}]
  • TTFB (Time to First Byte): ${m.ttfb.display} [${m.ttfb.score}]`.trim();

  // ── SEO section ──
  const { seo } = p;
  const seoLines = seo.error
    ? `Não foi possível verificar SEO on-page: ${seo.error}`
    : `
  • Score SEO on-page: ${seo.score}/100
  • HTTPS: ${seo.https.passed ? "✓" : "✗"} — ${seo.https.message}
  • Título: ${seo.title.passed ? "✓" : "✗"} — ${seo.title.message}
  • Meta description: ${seo.meta_description.passed ? "✓" : "✗"} — ${seo.meta_description.message}
  • H1: ${seo.h1.passed ? "✓" : "✗"} — ${seo.h1.message}
  • H2s encontrados: ${seo.h2_count}
  • Canonical: ${seo.canonical.passed ? "✓" : "✗"} — ${seo.canonical.message}
  • Meta robots: ${seo.meta_robots.passed ? "✓" : "✗"} — ${seo.meta_robots.message}
  • OG tags: ${seo.og_tags.passed ? "✓" : "✗"} — ${seo.og_tags.message}
  • robots.txt: ${seo.robots_txt.passed ? "✓" : "✗"}
  • sitemap.xml: ${seo.sitemap.passed ? "✓" : "✗"}
  • Imagens sem alt: ${seo.images_without_alt.message}`.trim();

  // ── Google Business section ──
  const gb = p.google_business;
  const gbSection = gb.error
    ? `Não foi possível verificar Google Business: ${gb.error}`
    : gb.encontrado
    ? `
  • Score Google Business: ${p.score_business}/100
  • Perfil encontrado: Sim
  • Nome: ${gb.nome}
  • Avaliação: ${gb.rating ?? "—"} ⭐ (${gb.total_avaliacoes ?? 0} avaliações)
  • Verificado/Reivindicado: ${gb.verificado ? "Sim" : "Provável não"}
  • Fotos: ${gb.fotos_count ?? 0}
  • Endereço: ${gb.endereco ?? "—"}`.trim()
    : "Negócio NÃO encontrado no Google Business / Google Maps — ausência crítica de presença local.";

  // ── Keywords section ──
  const kw = p.palavras_chave;
  const kwSection = kw.error
    ? `Palavras-chave não disponíveis: ${kw.error}`
    : `Fonte: ${kw.fonte === "dataforseo" ? "DataForSEO (dados reais)" : "Sugestões geradas por IA"}
  ${kw.palavras
    .slice(0, 10)
    .map((k) => `  • "${k.termo}" — volume: ${k.volume_estimado}, dificuldade: ${k.dificuldade}, intenção: ${k.intencao}`)
    .join("\n")}`;

  return `Você é um consultor sênior de marketing digital especializado em pequenas e médias empresas brasileiras.
Analise os dados abaixo e gere um relatório completo de diagnóstico digital.

═══════════════════════════════════════
DADOS DO NEGÓCIO
═══════════════════════════════════════
Nome:        ${p.site.nome}
Segmento:    ${segLabel}
Localização: ${loc}
URL:         ${p.site.url}
Score Geral: ${p.score_geral}/100

═══════════════════════════════════════
1. DESEMPENHO DO SITE (Score: ${p.score_performance}/100)
═══════════════════════════════════════
${perfSection}

═══════════════════════════════════════
2. SEO ON-PAGE (Score: ${p.score_seo}/100)
═══════════════════════════════════════
${seoLines}

═══════════════════════════════════════
3. PRESENÇA NO GOOGLE BUSINESS (Score: ${p.score_business}/100)
═══════════════════════════════════════
${gbSection}

═══════════════════════════════════════
4. PALAVRAS-CHAVE RELEVANTES
═══════════════════════════════════════
${kwSection}

═══════════════════════════════════════
INSTRUÇÕES PARA O RELATÓRIO
═══════════════════════════════════════
Gere o relatório considerando que o público é o próprio dono do negócio — linguagem clara,
objetiva e encorajadora, sem jargões técnicos excessivos.

Responda EXCLUSIVAMENTE com um JSON válido, sem texto antes ou depois, no formato:
{
  "resumo_executivo": "<2-3 parágrafos avaliando a situação geral do negócio online, o que está bem e o que precisa melhorar>",
  "pontos_fortes": [
    "<ponto forte 1 — específico aos dados>",
    "<ponto forte 2>",
    "<ponto forte 3>"
  ],
  "problemas_criticos": [
    "<problema crítico 1 — específico, com impacto real no negócio>",
    "<problema crítico 2>",
    "<problema crítico 3>"
  ],
  "tarefas": [
    {
      "titulo": "<título curto e direto>",
      "descricao": "<o que fazer, como fazer e por que é importante — 2-3 frases>",
      "categoria": "<seo|performance|google_business|conteudo|outro>",
      "prioridade": <1-10 onde 1=mais urgente>,
      "tempo_estimado": "<ex: 30 minutos, 1 hora, meio dia, 1 semana>"
    }
  ]
}

OBRIGATÓRIO: gere exatamente 10 tarefas, ordenadas por prioridade (1 primeiro).
As tarefas devem ser ações concretas e executáveis pelo dono do negócio ou por um freelancer.`;
}

// ─── JSON parser (resilient) ─────────────────────────────────────────────────

function parseRelatorioJSON(text: string): RelatorioIA {
  // Strip markdown code fences if present
  const cleaned = text
    .replace(/^```(?:json)?\n?/m, "")
    .replace(/\n?```$/m, "")
    .trim();

  // Find outermost JSON object
  const start = cleaned.indexOf("{");
  const end   = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("Nenhum objeto JSON encontrado na resposta do Claude");
  }

  const parsed = JSON.parse(cleaned.slice(start, end + 1)) as RelatorioIA;

  // Validate required fields
  if (
    typeof parsed.resumo_executivo !== "string" ||
    !Array.isArray(parsed.pontos_fortes) ||
    !Array.isArray(parsed.problemas_criticos) ||
    !Array.isArray(parsed.tarefas)
  ) {
    throw new Error("JSON não tem os campos obrigatórios do RelatorioIA");
  }

  // Ensure exactly 3 items in each array
  while (parsed.pontos_fortes.length < 3)       parsed.pontos_fortes.push("—");
  while (parsed.problemas_criticos.length < 3)  parsed.problemas_criticos.push("—");

  // Normalise tasks: ensure required fields
  parsed.tarefas = parsed.tarefas.slice(0, 10).map((t, i) => ({
    titulo:          t.titulo ?? `Tarefa ${i + 1}`,
    descricao:       t.descricao ?? "",
    categoria:       t.categoria ?? "outro",
    prioridade:      Number(t.prioridade ?? i + 1),
    tempo_estimado:  t.tempo_estimado ?? "—",
  }));

  return parsed;
}

// ─── main ────────────────────────────────────────────────────────────────────

export async function gerarRelatorioIA(
  params: GerarRelatorioParams
): Promise<RelatorioIA> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = buildPrompt(params);

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system:
      "Você é um consultor de marketing digital especializado em PMEs brasileiras. " +
      "Responda SEMPRE e EXCLUSIVAMENTE com JSON válido conforme as instruções.",
    messages: [{ role: "user", content: prompt }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  return parseRelatorioJSON(text);
}
