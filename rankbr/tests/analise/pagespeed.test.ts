import { describe, it, expect, vi, beforeEach } from 'vitest'
import { analisarPageSpeed } from '@/lib/analise/pagespeed'

// ─── PSI response factory ─────────────────────────────────────────────────────

interface PsiOverrides {
  performanceScore?: number
  lcpMs?: number
  tbtMs?: number
  clsVal?: number
  fcpMs?: number
  ttfbMs?: number
}

function buildPsiResponse(o: PsiOverrides = {}) {
  return {
    lighthouseResult: {
      categories: {
        performance: { score: o.performanceScore ?? 0.73 },
      },
      audits: {
        'largest-contentful-paint': { numericValue: o.lcpMs ?? 2800 },
        'total-blocking-time':      { numericValue: o.tbtMs ?? 150  },
        'cumulative-layout-shift':  { numericValue: o.clsVal ?? 0.08 },
        'first-contentful-paint':   { numericValue: o.fcpMs ?? 1200 },
        'server-response-time':     { numericValue: o.ttfbMs ?? 450 },
      },
    },
  }
}

function mockOkFetch(body: unknown) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
  }))
}

function mockErrorFetch(status: number) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status }))
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('analisarPageSpeed', () => {
  beforeEach(() => vi.restoreAllMocks())

  // ── Happy path ───────────────────────────────────────────────────────────────

  it('parses performance score correctly', async () => {
    mockOkFetch(buildPsiResponse({ performanceScore: 0.73 }))
    const result = await analisarPageSpeed('https://example.com')
    expect(result.performance_score).toBe(73)
    expect(result.error).toBeUndefined()
  })

  it('classifies LCP as needs-improvement (2500–3999 ms)', async () => {
    mockOkFetch(buildPsiResponse({ lcpMs: 2800 }))
    const result = await analisarPageSpeed('https://example.com')
    expect(result.metrics.lcp.value).toBe(2800)
    expect(result.metrics.lcp.score).toBe('needs-improvement')
    expect(result.metrics.lcp.unit).toBe('ms')
  })

  it('classifies LCP as good (< 2500 ms)', async () => {
    mockOkFetch(buildPsiResponse({ lcpMs: 1800 }))
    const result = await analisarPageSpeed('https://example.com')
    expect(result.metrics.lcp.score).toBe('good')
  })

  it('classifies LCP as poor (>= 4000 ms)', async () => {
    mockOkFetch(buildPsiResponse({ lcpMs: 5000 }))
    const result = await analisarPageSpeed('https://example.com')
    expect(result.metrics.lcp.score).toBe('poor')
  })

  it('classifies TBT as good (< 200 ms)', async () => {
    mockOkFetch(buildPsiResponse({ tbtMs: 150 }))
    const result = await analisarPageSpeed('https://example.com')
    expect(result.metrics.tbt.score).toBe('good')
  })

  it('classifies TBT as poor (>= 600 ms)', async () => {
    mockOkFetch(buildPsiResponse({ tbtMs: 800 }))
    const result = await analisarPageSpeed('https://example.com')
    expect(result.metrics.tbt.score).toBe('poor')
  })

  it('classifies CLS as good (< 0.1)', async () => {
    mockOkFetch(buildPsiResponse({ clsVal: 0.08 }))
    const result = await analisarPageSpeed('https://example.com')
    expect(result.metrics.cls.score).toBe('good')
    expect(result.metrics.cls.unit).toBe('unitless')
  })

  it('classifies CLS as poor (>= 0.25)', async () => {
    mockOkFetch(buildPsiResponse({ clsVal: 0.30 }))
    const result = await analisarPageSpeed('https://example.com')
    expect(result.metrics.cls.score).toBe('poor')
  })

  it('classifies TTFB as good (< 800 ms)', async () => {
    mockOkFetch(buildPsiResponse({ ttfbMs: 450 }))
    const result = await analisarPageSpeed('https://example.com')
    expect(result.metrics.ttfb.score).toBe('good')
  })

  it('classifies TTFB as poor (>= 1800 ms)', async () => {
    mockOkFetch(buildPsiResponse({ ttfbMs: 2000 }))
    const result = await analisarPageSpeed('https://example.com')
    expect(result.metrics.ttfb.score).toBe('poor')
  })

  // ── Display formatting ────────────────────────────────────────────────────────

  it('formats values below 1000 ms as "N ms"', async () => {
    mockOkFetch(buildPsiResponse({ fcpMs: 750, ttfbMs: 300 }))
    const result = await analisarPageSpeed('https://example.com')
    expect(result.metrics.fcp.display).toBe('750 ms')
    expect(result.metrics.ttfb.display).toBe('300 ms')
  })

  it('formats values >= 1000 ms as "N.N s"', async () => {
    mockOkFetch(buildPsiResponse({ lcpMs: 2500, fcpMs: 1800 }))
    const result = await analisarPageSpeed('https://example.com')
    expect(result.metrics.lcp.display).toBe('2.5 s')
    expect(result.metrics.fcp.display).toBe('1.8 s')
  })

  it('formats CLS as 3-decimal string', async () => {
    mockOkFetch(buildPsiResponse({ clsVal: 0.08 }))
    const result = await analisarPageSpeed('https://example.com')
    expect(result.metrics.cls.display).toBe('0.080')
  })

  // ── Error paths ───────────────────────────────────────────────────────────────

  it('returns error when PSI returns HTTP 500', async () => {
    mockErrorFetch(500)
    const result = await analisarPageSpeed('https://example.com')
    expect(result.performance_score).toBe(0)
    expect(result.error).toMatch(/500/)
  })

  it('returns error on network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))
    const result = await analisarPageSpeed('https://example.com')
    expect(result.performance_score).toBe(0)
    expect(result.error).toBeDefined()
  })

  it('returns error on AbortError (timeout)', async () => {
    const err = Object.assign(new Error('The operation was aborted'), { name: 'AbortError' })
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(err))
    const result = await analisarPageSpeed('https://example.com')
    expect(result.performance_score).toBe(0)
    expect(result.error).toBeDefined()
  })

  it('handles missing audit keys without throwing', async () => {
    mockOkFetch({
      lighthouseResult: {
        categories: { performance: { score: 0.60 } },
        audits: {},
      },
    })
    const result = await analisarPageSpeed('https://example.com')
    expect(result.performance_score).toBe(60)
    expect(result.metrics.lcp.value).toBe(0)
    expect(result.error).toBeUndefined()
  })

  it('returns all 5 metrics with correct structure', async () => {
    mockOkFetch(buildPsiResponse())
    const result = await analisarPageSpeed('https://example.com')
    const keys: Array<keyof typeof result.metrics> = ['lcp', 'tbt', 'cls', 'fcp', 'ttfb']
    for (const key of keys) {
      expect(result.metrics[key]).toMatchObject({
        value: expect.any(Number),
        unit: expect.any(String),
        display: expect.any(String),
        score: expect.stringMatching(/^(good|needs-improvement|poor)$/),
      })
    }
  })
})
