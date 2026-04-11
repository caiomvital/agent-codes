import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mock @anthropic-ai/sdk BEFORE importing the module under test ─────────────
// vi.mock() is hoisted by Vitest to run before imports. Variables declared with
// const/let are NOT hoisted, so we use vi.hoisted() to create the shared spy
// before the factory evaluates.

// vi.hoisted ensures this spy is defined before the vi.mock factory evaluates
const mockCreate = vi.hoisted(() => vi.fn())

vi.mock('@anthropic-ai/sdk', () => ({
  // Use a class so `new Anthropic(...)` is valid (arrow fns are not constructable)
  default: class MockAnthropic {
    messages = { create: mockCreate }
  },
}))

import { gerarRelatorioIA } from '@/lib/analise/ia'
import type {
  PageSpeedResult,
  SeoBasicoResult,
  GoogleBusinessResult,
  PalavrasChaveResult,
} from '@/types'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const BASE_PARAMS = {
  site: {
    url: 'https://sabormineiro.com.br',
    nome: 'Sabor Mineiro',
    segmento: 'restaurante' as const,
    cidade: 'Belo Horizonte',
    estado: 'MG',
  },
  score_geral: 62,
  score_performance: 55,
  score_seo: 70,
  score_business: 60,
  pagespeed: {
    performance_score: 55,
    metrics: {
      lcp:  { value: 3200, unit: 'ms',       display: '3.2 s',   score: 'needs-improvement' },
      tbt:  { value: 180,  unit: 'ms',       display: '180 ms',  score: 'good'              },
      cls:  { value: 0.05, unit: 'unitless', display: '0.050',   score: 'good'              },
      fcp:  { value: 1600, unit: 'ms',       display: '1.6 s',   score: 'good'              },
      ttfb: { value: 600,  unit: 'ms',       display: '600 ms',  score: 'good'              },
    },
  } as PageSpeedResult,
  seo: {
    score: 70,
    h2_count: 3,
    https:              { passed: true,  message: 'HTTPS OK'            },
    title:              { passed: true,  value: 45, message: 'Título OK' },
    meta_description:   { passed: false, message: 'Meta description ausente' },
    h1:                 { passed: true,  value: 1,  message: 'H1 OK'    },
    canonical:          { passed: true,  value: 'https://sabormineiro.com.br/', message: 'Canonical OK' },
    meta_robots:        { passed: true,  message: 'index, follow'       },
    og_tags:            { passed: false, value: '1/3', message: 'Incompleto' },
    robots_txt:         { passed: true,  message: 'robots.txt OK'       },
    sitemap:            { passed: false, message: 'sitemap ausente'     },
    images_without_alt: { passed: false, value: '3/10', message: '3 imagens sem alt' },
  } as SeoBasicoResult,
  google_business: {
    encontrado:      true,
    nome:            'Sabor Mineiro',
    rating:          4.5,
    total_avaliacoes: 128,
    verificado:      true,
    fotos_count:     12,
  } as GoogleBusinessResult,
  palavras_chave: {
    palavras: [
      { termo: 'restaurante bh', volume_estimado: 'alto', dificuldade: 'media', intencao: 'transacional', relevancia: 9 },
    ],
    fonte: 'ia',
  } as PalavrasChaveResult,
}

function makeTarefas(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    titulo:         `Tarefa ${i + 1}`,
    descricao:      `Descrição da tarefa ${i + 1} com detalhes suficientes.`,
    categoria:      'seo',
    prioridade:     i + 1,
    tempo_estimado: '30 minutos',
  }))
}

const VALID_RELATORIO = {
  resumo_executivo: 'O Sabor Mineiro tem boa presença digital com nota 62/100. Há pontos fortes mas também melhorias importantes.',
  pontos_fortes: [
    'Excelente avaliação no Google com 4.5 estrelas e 128 avaliações',
    'Site seguro com HTTPS corretamente configurado',
    'Performance mobile razoável com LCP abaixo de 4 segundos',
  ],
  problemas_criticos: [
    'Meta description ausente impacta CTR nos resultados de busca',
    'Sitemap.xml não encontrado, dificultando a indexação',
    'Imagens sem alt prejudicam acessibilidade e SEO',
  ],
  tarefas: makeTarefas(10),
}

function mockAnthropicResponse(text: string) {
  mockCreate.mockResolvedValue({
    content: [{ type: 'text', text }],
  })
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('gerarRelatorioIA', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Happy path ────────────────────────────────────────────────────────────────

  it('returns a valid RelatorioIA from a well-formed JSON response', async () => {
    mockAnthropicResponse(JSON.stringify(VALID_RELATORIO))
    const result = await gerarRelatorioIA(BASE_PARAMS)

    expect(typeof result.resumo_executivo).toBe('string')
    expect(result.resumo_executivo.length).toBeGreaterThan(10)
    expect(result.pontos_fortes).toHaveLength(3)
    expect(result.problemas_criticos).toHaveLength(3)
    expect(result.tarefas).toHaveLength(10)
  })

  it('passes correct model and parameters to Anthropic', async () => {
    mockAnthropicResponse(JSON.stringify(VALID_RELATORIO))
    await gerarRelatorioIA(BASE_PARAMS)

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'claude-sonnet-4-6',
        max_tokens: expect.any(Number),
        messages: expect.arrayContaining([
          expect.objectContaining({ role: 'user' }),
        ]),
      })
    )
  })

  // ── JSON parsing ─────────────────────────────────────────────────────────────

  it('parses JSON wrapped in markdown code fences', async () => {
    const wrapped = '```json\n' + JSON.stringify(VALID_RELATORIO) + '\n```'
    mockAnthropicResponse(wrapped)
    const result = await gerarRelatorioIA(BASE_PARAMS)

    expect(result.pontos_fortes).toHaveLength(3)
    expect(result.tarefas).toHaveLength(10)
  })

  it('parses JSON wrapped in plain code fences', async () => {
    const wrapped = '```\n' + JSON.stringify(VALID_RELATORIO) + '\n```'
    mockAnthropicResponse(wrapped)
    const result = await gerarRelatorioIA(BASE_PARAMS)

    expect(result.resumo_executivo).toBe(VALID_RELATORIO.resumo_executivo)
  })

  it('finds JSON object even with leading text', async () => {
    const withLeading = 'Aqui está o relatório:\n' + JSON.stringify(VALID_RELATORIO)
    mockAnthropicResponse(withLeading)
    const result = await gerarRelatorioIA(BASE_PARAMS)

    expect(result.pontos_fortes).toHaveLength(3)
  })

  // ── Array normalisation ───────────────────────────────────────────────────────

  it('pads pontos_fortes to exactly 3 items when fewer are returned', async () => {
    mockAnthropicResponse(JSON.stringify({
      ...VALID_RELATORIO,
      pontos_fortes: ['Só um ponto forte'],
    }))
    const result = await gerarRelatorioIA(BASE_PARAMS)

    expect(result.pontos_fortes).toHaveLength(3)
    expect(result.pontos_fortes[1]).toBe('—')
    expect(result.pontos_fortes[2]).toBe('—')
  })

  it('pads problemas_criticos to exactly 3 items when fewer are returned', async () => {
    mockAnthropicResponse(JSON.stringify({
      ...VALID_RELATORIO,
      problemas_criticos: ['Um problema'],
    }))
    const result = await gerarRelatorioIA(BASE_PARAMS)

    expect(result.problemas_criticos).toHaveLength(3)
    expect(result.problemas_criticos[1]).toBe('—')
  })

  // ── Task normalisation ────────────────────────────────────────────────────────

  it('caps tasks at 10 when Claude returns more than 10', async () => {
    mockAnthropicResponse(JSON.stringify({
      ...VALID_RELATORIO,
      tarefas: makeTarefas(15),
    }))
    const result = await gerarRelatorioIA(BASE_PARAMS)

    expect(result.tarefas.length).toBeLessThanOrEqual(10)
  })

  it('normalises tasks with missing fields using defaults', async () => {
    mockAnthropicResponse(JSON.stringify({
      ...VALID_RELATORIO,
      tarefas: [{ titulo: 'Só o título' }],
    }))
    const result = await gerarRelatorioIA(BASE_PARAMS)

    expect(result.tarefas[0].titulo).toBe('Só o título')
    expect(result.tarefas[0].descricao).toBe('')
    expect(result.tarefas[0].categoria).toBe('outro')
    expect(result.tarefas[0].prioridade).toBe(1)
    expect(result.tarefas[0].tempo_estimado).toBe('—')
  })

  it('uses index + 1 as default prioridade when missing', async () => {
    mockAnthropicResponse(JSON.stringify({
      ...VALID_RELATORIO,
      tarefas: [{ titulo: 'T1' }, { titulo: 'T2' }, { titulo: 'T3' }],
    }))
    const result = await gerarRelatorioIA(BASE_PARAMS)

    expect(result.tarefas[0].prioridade).toBe(1)
    expect(result.tarefas[1].prioridade).toBe(2)
    expect(result.tarefas[2].prioridade).toBe(3)
  })

  // ── Error paths ───────────────────────────────────────────────────────────────

  it('throws when response JSON has no object braces', async () => {
    mockAnthropicResponse('Não foi possível processar sua solicitação.')
    await expect(gerarRelatorioIA(BASE_PARAMS)).rejects.toThrow(/JSON/)
  })

  it('throws when required fields are missing from response JSON', async () => {
    mockAnthropicResponse(JSON.stringify({ some_other_field: true }))
    await expect(gerarRelatorioIA(BASE_PARAMS)).rejects.toThrow()
  })

  it('propagates Anthropic API errors', async () => {
    mockCreate.mockRejectedValue(new Error('Rate limit exceeded'))
    await expect(gerarRelatorioIA(BASE_PARAMS)).rejects.toThrow('Rate limit exceeded')
  })

  it('propagates Anthropic overload errors', async () => {
    mockCreate.mockRejectedValue(new Error('529 Overloaded'))
    await expect(gerarRelatorioIA(BASE_PARAMS)).rejects.toThrow('529 Overloaded')
  })
})
