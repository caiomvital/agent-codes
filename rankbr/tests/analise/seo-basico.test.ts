import { describe, it, expect, vi, beforeEach } from 'vitest'
import { analisarSeoBasico } from '@/lib/analise/seo-basico'

// ─── HTML fixture factory ─────────────────────────────────────────────────────

interface HtmlOpts {
  title?: string | null
  metaDescription?: string | null
  h1Tags?: string[]
  h2Count?: number
  canonical?: string | null
  robots?: string | null
  ogTitle?: boolean
  ogDescription?: boolean
  ogImage?: boolean
  images?: Array<{ src: string; alt?: string }>
}

function buildHtml(opts: HtmlOpts = {}): string {
  const {
    title = 'Restaurante Sabor Mineiro — Belo Horizonte MG',
    metaDescription = 'O melhor restaurante de comida mineira em BH. Pratos típicos, ambiente aconchegante e preços justos para toda a família.',
    h1Tags = ['Restaurante Sabor Mineiro'],
    h2Count = 3,
    canonical = 'https://sabormineiro.com.br/',
    robots = 'index, follow',
    ogTitle = true,
    ogDescription = true,
    ogImage = true,
    images = [{ src: 'prato.jpg', alt: 'Prato típico mineiro' }],
  } = opts

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  ${title !== null ? `<title>${title}</title>` : ''}
  ${metaDescription !== null ? `<meta name="description" content="${metaDescription}" />` : ''}
  ${canonical !== null ? `<link rel="canonical" href="${canonical}" />` : ''}
  ${robots !== null ? `<meta name="robots" content="${robots}" />` : ''}
  ${ogTitle ? `<meta property="og:title" content="Sabor Mineiro" />` : ''}
  ${ogDescription ? `<meta property="og:description" content="Restaurante mineiro" />` : ''}
  ${ogImage ? `<meta property="og:image" content="https://sabormineiro.com.br/og.jpg" />` : ''}
</head>
<body>
  ${h1Tags.map(t => `<h1>${t}</h1>`).join('\n  ')}
  ${Array.from({ length: h2Count }, (_, i) => `<h2>Seção ${i + 1}</h2>`).join('\n  ')}
  ${images.map(img => img.alt ? `<img src="${img.src}" alt="${img.alt}" />` : `<img src="${img.src}" />`).join('\n  ')}
</body>
</html>`
}

// ─── Fetch mock ───────────────────────────────────────────────────────────────

function mockFetch(html: string, robotsTxtOk = true, sitemapOk = true) {
  vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string, opts?: RequestInit) => {
    if (opts?.method === 'HEAD') {
      if (String(url).endsWith('/robots.txt')) return Promise.resolve({ ok: robotsTxtOk })
      if (String(url).endsWith('/sitemap.xml')) return Promise.resolve({ ok: sitemapOk })
      return Promise.resolve({ ok: false })
    }
    return Promise.resolve({ ok: true, text: () => Promise.resolve(html) })
  }))
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('analisarSeoBasico', () => {
  beforeEach(() => vi.restoreAllMocks())

  // ── HTTPS check ───────────────────────────────────────────────────────────────

  it('marks https as passed for an https:// URL', async () => {
    mockFetch(buildHtml())
    const result = await analisarSeoBasico('https://sabormineiro.com.br')
    expect(result.https.passed).toBe(true)
  })

  it('marks https as failed for an http:// URL', async () => {
    mockFetch(buildHtml())
    const result = await analisarSeoBasico('http://sabormineiro.com.br')
    expect(result.https.passed).toBe(false)
    expect(result.https.message).toMatch(/HTTPS/)
  })

  // ── Title ─────────────────────────────────────────────────────────────────────

  it('passes title check for a present, well-sized title', async () => {
    mockFetch(buildHtml({ title: 'Restaurante Sabor Mineiro — Comida Típica BH' })) // ~45 chars
    const result = await analisarSeoBasico('https://sabormineiro.com.br')
    expect(result.title.passed).toBe(true)
    expect(result.title.message).toMatch(/OK/)
  })

  it('fails title check when <title> is absent', async () => {
    mockFetch(buildHtml({ title: null }))
    const result = await analisarSeoBasico('https://sabormineiro.com.br')
    expect(result.title.passed).toBe(false)
    expect(result.title.message).toMatch(/ausente/i)
  })

  it('reports title too short (< 30 chars)', async () => {
    mockFetch(buildHtml({ title: 'Café MG' })) // 7 chars
    const result = await analisarSeoBasico('https://sabormineiro.com.br')
    expect(result.title.passed).toBe(true)
    expect(result.title.message).toMatch(/curto/i)
    expect(Number(result.title.value)).toBeLessThan(30)
  })

  it('reports title too long (> 60 chars)', async () => {
    mockFetch(buildHtml({ title: 'A'.repeat(70) }))
    const result = await analisarSeoBasico('https://sabormineiro.com.br')
    expect(result.title.passed).toBe(true)
    expect(result.title.message).toMatch(/longo/i)
  })

  // ── Meta description ─────────────────────────────────────────────────────────

  it('fails meta_description when absent', async () => {
    mockFetch(buildHtml({ metaDescription: null }))
    const result = await analisarSeoBasico('https://sabormineiro.com.br')
    expect(result.meta_description.passed).toBe(false)
    expect(result.meta_description.message).toMatch(/ausente/i)
  })

  it('reports meta_description too short (< 100 chars)', async () => {
    mockFetch(buildHtml({ metaDescription: 'Restaurante mineiro em BH.' }))
    const result = await analisarSeoBasico('https://sabormineiro.com.br')
    expect(result.meta_description.passed).toBe(true)
    expect(result.meta_description.message).toMatch(/curta/i)
  })

  it('reports meta_description too long (> 160 chars)', async () => {
    mockFetch(buildHtml({ metaDescription: 'A'.repeat(170) }))
    const result = await analisarSeoBasico('https://sabormineiro.com.br')
    expect(result.meta_description.passed).toBe(true)
    expect(result.meta_description.message).toMatch(/longa/i)
  })

  // ── H1 ────────────────────────────────────────────────────────────────────────

  it('passes h1 with a single tag', async () => {
    mockFetch(buildHtml({ h1Tags: ['Título Principal'] }))
    const result = await analisarSeoBasico('https://sabormineiro.com.br')
    expect(result.h1.passed).toBe(true)
    expect(result.h1.value).toBe(1)
  })

  it('fails h1 when absent', async () => {
    mockFetch(buildHtml({ h1Tags: [] }))
    const result = await analisarSeoBasico('https://sabormineiro.com.br')
    expect(result.h1.passed).toBe(false)
    expect(result.h1.message).toMatch(/ausente/i)
  })

  it('reports multiple H1 tags', async () => {
    mockFetch(buildHtml({ h1Tags: ['H1 Um', 'H1 Dois', 'H1 Três'] }))
    const result = await analisarSeoBasico('https://sabormineiro.com.br')
    expect(result.h1.passed).toBe(true)
    expect(result.h1.value).toBe(3)
    expect(result.h1.message).toMatch(/3/)
  })

  // ── H2 count ─────────────────────────────────────────────────────────────────

  it('counts h2 tags correctly', async () => {
    mockFetch(buildHtml({ h2Count: 5 }))
    const result = await analisarSeoBasico('https://sabormineiro.com.br')
    expect(result.h2_count).toBe(5)
  })

  // ── Meta robots ───────────────────────────────────────────────────────────────

  it('fails meta_robots when page is noindex', async () => {
    mockFetch(buildHtml({ robots: 'noindex, nofollow' }))
    const result = await analisarSeoBasico('https://sabormineiro.com.br')
    expect(result.meta_robots.passed).toBe(false)
    expect(result.meta_robots.message).toMatch(/ATENÇÃO/i)
  })

  it('passes meta_robots with index, follow', async () => {
    mockFetch(buildHtml({ robots: 'index, follow' }))
    const result = await analisarSeoBasico('https://sabormineiro.com.br')
    expect(result.meta_robots.passed).toBe(true)
  })

  // ── OG tags ───────────────────────────────────────────────────────────────────

  it('passes og_tags when at least 2 of 3 are present', async () => {
    mockFetch(buildHtml({ ogTitle: true, ogDescription: true, ogImage: false }))
    const result = await analisarSeoBasico('https://sabormineiro.com.br')
    expect(result.og_tags.passed).toBe(true)
    expect(result.og_tags.value).toBe('2/3')
  })

  it('fails og_tags when fewer than 2 are present', async () => {
    mockFetch(buildHtml({ ogTitle: true, ogDescription: false, ogImage: false }))
    const result = await analisarSeoBasico('https://sabormineiro.com.br')
    expect(result.og_tags.passed).toBe(false)
  })

  // ── Images without alt ────────────────────────────────────────────────────────

  it('passes images check when all images have alt', async () => {
    mockFetch(buildHtml({
      images: [
        { src: 'a.jpg', alt: 'Foto A' },
        { src: 'b.jpg', alt: 'Foto B' },
      ],
    }))
    const result = await analisarSeoBasico('https://sabormineiro.com.br')
    expect(result.images_without_alt.passed).toBe(true)
  })

  it('fails images check and counts missing alt attributes', async () => {
    mockFetch(buildHtml({
      images: [
        { src: 'a.jpg', alt: 'Foto A' },
        { src: 'b.jpg' },
        { src: 'c.jpg' },
      ],
    }))
    const result = await analisarSeoBasico('https://sabormineiro.com.br')
    expect(result.images_without_alt.passed).toBe(false)
    expect(result.images_without_alt.value).toBe('2/3')
  })

  it('passes images check when there are no images', async () => {
    mockFetch(buildHtml({ images: [] }))
    const result = await analisarSeoBasico('https://sabormineiro.com.br')
    expect(result.images_without_alt.passed).toBe(true)
  })

  // ── robots.txt / sitemap ──────────────────────────────────────────────────────

  it('passes robots_txt when file is reachable', async () => {
    mockFetch(buildHtml(), true, true)
    const result = await analisarSeoBasico('https://sabormineiro.com.br')
    expect(result.robots_txt.passed).toBe(true)
  })

  it('fails robots_txt when file returns 404', async () => {
    mockFetch(buildHtml(), false, true)
    const result = await analisarSeoBasico('https://sabormineiro.com.br')
    expect(result.robots_txt.passed).toBe(false)
    expect(result.robots_txt.message).toMatch(/ausente/i)
  })

  it('fails sitemap when file returns 404', async () => {
    mockFetch(buildHtml(), true, false)
    const result = await analisarSeoBasico('https://sabormineiro.com.br')
    expect(result.sitemap.passed).toBe(false)
    expect(result.sitemap.message).toMatch(/ausente/i)
  })

  // ── Score calculation ─────────────────────────────────────────────────────────

  it('calculates a high score for a fully optimised page', async () => {
    mockFetch(buildHtml(), true, true)
    const result = await analisarSeoBasico('https://sabormineiro.com.br')
    expect(result.score).toBeGreaterThan(80)
  })

  it('gives a low score for a page with no SEO elements', async () => {
    mockFetch('<html><body>Hello</body></html>', false, false)
    const result = await analisarSeoBasico('http://bad.example.com')
    expect(result.score).toBeLessThan(20)
  })

  // ── Error paths ───────────────────────────────────────────────────────────────

  it('returns error object when page fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string, opts?: RequestInit) => {
      if (opts?.method === 'HEAD') return Promise.resolve({ ok: true })
      return Promise.reject(new Error('Connection refused'))
    }))
    const result = await analisarSeoBasico('https://down.example.com')
    expect(result.error).toMatch(/Connection refused/)
    expect(result.score).toBe(0)
  })

  it('returns error for an invalid URL', async () => {
    const result = await analisarSeoBasico('not-a-url')
    expect(result.error).toBeDefined()
    expect(result.score).toBe(0)
  })
})
