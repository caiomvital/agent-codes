import { vi, beforeEach, afterEach } from 'vitest'

// ─── Reset fetch mock between tests ──────────────────────────────────────────
beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

// ─── Mock Next.js server-only modules ────────────────────────────────────────

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
    getAll: vi.fn(() => []),
  })),
  headers: vi.fn(() => ({
    get: vi.fn(),
    entries: vi.fn(() => []),
  })),
}))

vi.mock('next/navigation', () => ({
  redirect:   vi.fn(),
  notFound:   vi.fn(),
  useRouter:  vi.fn(() => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn() })),
  usePathname: vi.fn(() => '/'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}))

// ─── Silence console in tests (override per-test when needed) ────────────────
vi.spyOn(console, 'log').mockImplementation(() => {})
vi.spyOn(console, 'warn').mockImplementation(() => {})
vi.spyOn(console, 'error').mockImplementation(() => {})
