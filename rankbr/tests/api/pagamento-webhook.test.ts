import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ─── Module mocks (hoisted) ───────────────────────────────────────────────────

vi.mock('@/lib/supabase', () => ({
  createServiceSupabaseClient: vi.fn(),
}))
vi.mock('@/lib/mercadopago', () => ({
  getMpPayment:             vi.fn(),
  validateWebhookSignature: vi.fn(),
}))
vi.mock('@/lib/analise', () => ({
  rodarAnalise: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('@/lib/email', () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('@/emails/PagamentoConfirmado', () => ({
  PagamentoConfirmado: vi.fn(),
}))
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>()
  return { ...actual, createElement: vi.fn() }
})

import { POST } from '@/app/api/pagamento/webhook/route'
import { createServiceSupabaseClient } from '@/lib/supabase'
import { getMpPayment, validateWebhookSignature } from '@/lib/mercadopago'
import { rodarAnalise } from '@/lib/analise'

// ─── Supabase mock builder ────────────────────────────────────────────────────
// Tracks per-table call counts so each call to from('table') yields the next
// queued result for that table.

type DbResult = { data?: unknown; error?: unknown }

function buildDb(queue: Array<{ table: string; result: DbResult }>) {
  const consumed: Record<string, number> = {}

  const makeQB = (table: string): unknown => {
    const idx = consumed[table] ?? 0
    consumed[table] = idx + 1
    const entries = queue.filter(e => e.table === table)
    const result = entries[idx]?.result ?? { data: null, error: null }

    const qb: Record<string, unknown> = {}
    for (const m of ['select', 'update', 'insert', 'upsert']) {
      qb[m] = vi.fn().mockReturnValue(qb)
    }
    qb.eq = vi.fn().mockReturnValue(qb)
    qb.single = vi.fn().mockResolvedValue(result)
    qb.maybeSingle = vi.fn().mockResolvedValue(result)
    // Make the QB itself awaitable (for chains ending without .single())
    qb.then = (onFulfilled: (v: unknown) => unknown) =>
      Promise.resolve(result).then(onFulfilled)
    return qb
  }

  return { from: vi.fn().mockImplementation((t: string) => makeQB(t)) }
}

// ─── Request helpers ──────────────────────────────────────────────────────────

function makeRequest(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost/api/pagamento/webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })
}

const NOTIFICATION = (dataId = '12345678') => ({
  type: 'payment',
  action: 'payment.updated',
  data: { id: dataId },
})

const PAGAMENTO_ROW = {
  id:         'pagamento-uuid',
  status:     'pendente',
  site_id:    'site-uuid',
  user_id:    'user-uuid',
  valor:      10,
  updated_at: new Date().toISOString(),
  sites:      { nome: 'Meu Site', url: 'https://meusite.com.br' },
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/pagamento/webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: valid signature
    ;(validateWebhookSignature as ReturnType<typeof vi.fn>).mockReturnValue(true)
  })

  // ── Routing guards ────────────────────────────────────────────────────────────

  it('returns 200 { received: true } for non-payment event types', async () => {
    const req = makeRequest({ type: 'merchant_order', action: 'created', data: { id: '1' } })
    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ received: true })
  })

  it('returns 400 when data.id is missing from the notification', async () => {
    const req = makeRequest({ type: 'payment', action: 'payment.updated', data: {} })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 for malformed JSON body', async () => {
    const req = new NextRequest('http://localhost/api/pagamento/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{not valid json',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 401 when x-signature header is present but invalid', async () => {
    ;(validateWebhookSignature as ReturnType<typeof vi.fn>).mockReturnValue(false)
    const req = makeRequest(NOTIFICATION(), { 'x-signature': 'bad-sig' })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 500 when getMpPayment throws', async () => {
    ;(getMpPayment as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('MP API down'))
    const req = makeRequest(NOTIFICATION())
    const res = await POST(req)
    expect(res.status).toBe(500)
  })

  // ── Idempotency ───────────────────────────────────────────────────────────────

  it('returns 200 without updating when pagamento is already in the target status', async () => {
    ;(getMpPayment as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 12345678,
      status: 'approved',
      external_reference: 'pagamento-uuid',
    })
    const db = buildDb([
      { table: 'pagamentos', result: { data: { ...PAGAMENTO_ROW, status: 'aprovado' }, error: null } },
    ])
    ;(createServiceSupabaseClient as ReturnType<typeof vi.fn>).mockReturnValue(db)

    const req = makeRequest(NOTIFICATION())
    const res = await POST(req)

    expect(res.status).toBe(200)
    expect(rodarAnalise).not.toHaveBeenCalled()
  })

  it('returns 200 silently when external_reference has no match in DB', async () => {
    ;(getMpPayment as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 999,
      status: 'approved',
      external_reference: 'unknown-uuid',
    })
    const db = buildDb([
      { table: 'pagamentos', result: { data: null, error: { message: 'No rows found' } } },
    ])
    ;(createServiceSupabaseClient as ReturnType<typeof vi.fn>).mockReturnValue(db)

    const req = makeRequest(NOTIFICATION())
    const res = await POST(req)
    expect(res.status).toBe(200)
  })

  // ── Status transitions ────────────────────────────────────────────────────────

  it('updates pagamento status to recusado for a rejected payment without triggering analysis', async () => {
    ;(getMpPayment as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 12345678,
      status: 'rejected',
      external_reference: 'pagamento-uuid',
    })
    const db = buildDb([
      { table: 'pagamentos', result: { data: { ...PAGAMENTO_ROW, status: 'pendente' }, error: null } },
      { table: 'pagamentos', result: { data: null, error: null } }, // update
    ])
    ;(createServiceSupabaseClient as ReturnType<typeof vi.fn>).mockReturnValue(db)

    const req = makeRequest(NOTIFICATION())
    const res = await POST(req)

    expect(res.status).toBe(200)
    expect(rodarAnalise).not.toHaveBeenCalled()
  })

  it('updates pagamento status to cancelado for a cancelled payment', async () => {
    ;(getMpPayment as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 12345678,
      status: 'cancelled',
      external_reference: 'pagamento-uuid',
    })
    const db = buildDb([
      { table: 'pagamentos', result: { data: { ...PAGAMENTO_ROW, status: 'pendente' }, error: null } },
      { table: 'pagamentos', result: { data: null, error: null } },
    ])
    ;(createServiceSupabaseClient as ReturnType<typeof vi.fn>).mockReturnValue(db)

    const req = makeRequest(NOTIFICATION())
    const res = await POST(req)

    expect(res.status).toBe(200)
    expect(rodarAnalise).not.toHaveBeenCalled()
  })

  // ── Approved payment → analysis pipeline ─────────────────────────────────────

  it('calls rodarAnalise when an approved payment advances the analise to processando', async () => {
    ;(getMpPayment as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 12345678,
      status: 'approved',
      external_reference: 'pagamento-uuid',
    })
    const db = buildDb([
      { table: 'pagamentos', result: { data: { ...PAGAMENTO_ROW, status: 'pendente' }, error: null } },
      { table: 'pagamentos', result: { data: null, error: null } },           // update pagamento
      { table: 'analises',   result: { data: { id: 'analise-uuid' }, error: null } }, // update analise
      { table: 'users',      result: { data: { name: 'João', email: 'joao@example.com' }, error: null } },
    ])
    ;(createServiceSupabaseClient as ReturnType<typeof vi.fn>).mockReturnValue(db)

    const req = makeRequest(NOTIFICATION())
    const res = await POST(req)

    expect(res.status).toBe(200)
    // Give fire-and-forget microtasks time to settle
    await new Promise(r => setTimeout(r, 20))
    expect(rodarAnalise).toHaveBeenCalledWith('analise-uuid')
  })

  it('does not call rodarAnalise when analise update returns no row (already processed)', async () => {
    ;(getMpPayment as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 12345678,
      status: 'approved',
      external_reference: 'pagamento-uuid',
    })
    const db = buildDb([
      { table: 'pagamentos', result: { data: { ...PAGAMENTO_ROW, status: 'pendente' }, error: null } },
      { table: 'pagamentos', result: { data: null, error: null } },
      { table: 'analises',   result: { data: null, error: null } }, // no row updated
      { table: 'users',      result: { data: null, error: null } },
    ])
    ;(createServiceSupabaseClient as ReturnType<typeof vi.fn>).mockReturnValue(db)

    const req = makeRequest(NOTIFICATION())
    await POST(req)
    await new Promise(r => setTimeout(r, 20))

    expect(rodarAnalise).not.toHaveBeenCalled()
  })

  // ── External reference not set ────────────────────────────────────────────────

  it('returns 200 silently when external_reference is null', async () => {
    ;(getMpPayment as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 12345678,
      status: 'approved',
      external_reference: null,
    })
    const req = makeRequest(NOTIFICATION())
    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(rodarAnalise).not.toHaveBeenCalled()
  })
})
