/**
 * Module 4 — Keyword Suggestions
 *
 * Primary  : DataForSEO Labs API (Google Keyword Ideas)
 *              – requires DATAFORSEO_LOGIN + DATAFORSEO_PASSWORD
 * Fallback : Claude (claude-sonnet-4-6)
 *              – used when DataForSEO credentials are absent or the call fails
 *
 * Returns 10 keywords with estimated volume, difficulty and search intent.
 *
 * @see https://docs.dataforseo.com/v3/dataforseo_labs/google/keyword_ideas/live/
 */

import Anthropic from "@anthropic-ai/sdk";
import { SEGMENTOS } from "@/types";
import type {
  PalavrasChaveResult,
  PalavraChave,
  Segmento,
  VolumeEstimado,
  DificuldadeKW,
  IntencaoBusca,
} from "@/types";

// ─── DataForSEO ──────────────────────────────────────────────────────────────

interface DFSEOKeywordItem {
  keyword?: string;
  search_volume?: number;
  keyword_difficulty?: number;
  intent?: { types?: string[] };
}

interface DFSEOResponse {
  status_code?: number;
  tasks?: Array<{
    status_code?: number;
    result?: Array<{ items?: DFSEOKeywordItem[] }>;
  }>;
}

function volumeFromMonthly(v: number): VolumeEstimado {
  if (v >= 1000) return "alto";
  if (v >= 100)  return "medio";
  return "baixo";
}

function difficultyFromScore(d: number): DificuldadeKW {
  if (d >= 60) return "alta";
  if (d >= 30) return "media";
  return "baixa";
}

function intentFromTypes(types: string[] = []): IntencaoBusca {
  const t = types[0]?.toLowerCase() ?? "";
  if (t === "transactional") return "transacional";
  if (t === "commercial")    return "comercial";
  if (t === "navigational")  return "navegacional";
  return "informacional";
}

async function fetchDataForSEO(
  seedKeyword: string,
  cidade?: string
): Promise<PalavraChave[] | null> {
  const login    = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;
  if (!login || !password) return null;

  const credentials = Buffer.from(`${login}:${password}`).toString("base64");
  const locationNote = cidade ? `, ${cidade}` : "";

  let res: Response;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15_000);

    res = await fetch(
      "https://api.dataforseo.com/v3/dataforseo_labs/google/keyword_ideas/live",
      {
        method: "POST",
        signal: controller.signal,
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          {
            keywords: [`${seedKeyword}${locationNote}`],
            language_name: "Portuguese (Brazil)",
            location_name: "Brazil",
            include_seed_keyword: true,
            limit: 10,
          },
        ]),
      }
    );
    clearTimeout(timer);
  } catch {
    return null;
  }

  if (!res.ok) return null;

  let data: DFSEOResponse;
  try {
    data = (await res.json()) as DFSEOResponse;
  } catch {
    return null;
  }

  const items = data.tasks?.[0]?.result?.[0]?.items ?? [];
  if (items.length === 0) return null;

  return items
    .filter((i): i is DFSEOKeywordItem & { keyword: string } => !!i.keyword)
    .map((item) => ({
      termo:            item.keyword,
      volume_estimado:  volumeFromMonthly(item.search_volume ?? 0),
      dificuldade:      difficultyFromScore(item.keyword_difficulty ?? 0),
      intencao:         intentFromTypes(item.intent?.types),
      relevancia:       Math.round(Math.random() * 3 + 7), // DataForSEO doesn't give relevance score
    }));
}

// ─── Claude fallback ─────────────────────────────────────────────────────────

async function fetchViaIA(
  segmento: Segmento,
  cidade?: string,
  estado?: string
): Promise<PalavraChave[]> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const location = [cidade, estado].filter(Boolean).join(", ") || "Brasil";
  const segLabel = SEGMENTOS[segmento] ?? segmento;

  const prompt = `Você é um especialista em SEO para pequenas empresas brasileiras.
Gere exatamente 10 sugestões de palavras-chave para um negócio do segmento "${segLabel}" localizado em ${location}.

Responda APENAS com um array JSON válido, sem texto adicional, no formato:
[
  {
    "termo": "palavra-chave aqui",
    "volume_estimado": "alto" | "medio" | "baixo",
    "dificuldade": "alta" | "media" | "baixa",
    "intencao": "informacional" | "navegacional" | "transacional" | "comercial",
    "relevancia": <número 1-10>
  }
]

Critérios:
- Inclua variações locais (ex: "restaurante em ${cidade ?? location}")
- Misture intenções: perguntas informacionais, buscas transacionais e comerciais
- Priorize palavras com boa relação volume/dificuldade para PMEs
- Use português brasileiro natural`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";

  // Extract JSON array from response (Claude might wrap it in markdown)
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error("Claude não retornou JSON válido");

  const parsed = JSON.parse(jsonMatch[0]) as PalavraChave[];
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("Array de palavras-chave inválido");
  }

  return parsed.slice(0, 10);
}

// ─── main ────────────────────────────────────────────────────────────────────

export async function sugerirPalavrasChave(
  segmento: Segmento,
  cidade?: string,
  estado?: string
): Promise<PalavrasChaveResult> {
  const segLabel = SEGMENTOS[segmento] ?? segmento;
  const seedKeyword = cidade ? `${segLabel} ${cidade}` : segLabel;

  // 1. Try DataForSEO first
  try {
    const dfseoResult = await fetchDataForSEO(seedKeyword, cidade);
    if (dfseoResult && dfseoResult.length > 0) {
      return { palavras: dfseoResult, fonte: "dataforseo" };
    }
  } catch {
    // Fall through to Claude
  }

  // 2. Claude fallback
  try {
    const iaResult = await fetchViaIA(segmento, cidade, estado);
    return { palavras: iaResult, fonte: "ia" };
  } catch (err) {
    return {
      palavras: [],
      fonte: "ia",
      error: `Falha ao gerar palavras-chave: ${String(err)}`,
    };
  }
}
