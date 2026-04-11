import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock('@/lib/supabase', () => ({
  createServerSupabaseClient: vi.fn(),
  createServiceSupabaseClient: vi.fn(),
}))

import { PATCH } from '@/app/api/tarefas/[id]/route'
import { createServerSupabaseClient, createServiceSupabaseClient } from '@/lib/supabase'

// ─── Constants ────────────────────────────────────────────────────────────────

const TAREFA_ID  = 'tarefa-uuid-123'
const ANALISE_ID = 'analise-uuid-456'
const USER_ID    = 'user-uuid-abc'
const PARAMS     = { params: { id: TAREFA_ID } }

// ─── Mock helpers ─────────────────────────────────────────────────────────────

function mockAuth(userId: string | null) {
  ;(createServerSupabaseClient as ReturnType<typeof vi.fn>).mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: userId ? { id: userId, email: 'test@rankbr.com.br' } : null },
      }),
    },
  })
}

// Each call to from() gets the next result in the queue for that table.
type DbResult = { data?: unknown; error?: unknown }

function buildServiceDb(queue: Array<{ table: string; result: DbResult }>) {
  const consumed: Record<string, number> = {}

  const makeQB = (table: string): Record<string, unknown> => {
    const idx = consumed[table] ?? 0
    consumed[table] = idx + 1
    const entries = queue.filter(e => e.table === table)
    const result = entries[idx]?.result ?? { data: null, error: null }

    const qb: Record<string, unknown> = {}
    for (const m of ['select', 'update']) {
      qb[m] = vi.fn().mockReturnValue(qb)
    }
    qb.eq = vi.fn().mockReturnValue(qb)
    qb.single = vi.fn().mockResolvedValue(result)
    // Awaitable for update().eq() chains
    qb.then = (onFulfilled: (v: unknown) => unknown) =>
      Promise.resolve(result).then(onFulfilled)
    return qb
  }

  return { from: vi.fn().mockImplementation((t: string) => makeQB(t)) }
}

function makeRequest(body: unknown) {
  return new NextRequest(`http://localhost/api/tarefas/${TAREFA_ID}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('PATCH /api/tarefas/[id]', () => {
  beforeEach(() => vi.clearAllMocks())

  // ── Authentication ────────────────────────────────────────────────────────────

  it('returns 401 when there is no authenticated user', async () => {
    mockAuth(null)
    const res = await PATCH(makeRequest({ concluida: true }), PARAMS)
    expect(res.status).toBe(401)
    expect(await res.json()).toMatchObject({ error: expect.stringMatching(/autorizado/i) })
  })

  // ── Input validation ──────────────────────────────────────────────────────────

  it('returns 400 when body is missing the concluida field', async () => {
    mockAuth(USER_ID)
    const res = await PATCH(makeRequest({ wrong_field: true }), PARAMS)
    expect(res.status).toBe(400)
  })

  it('returns 400 when concluida is not a boolean', async () => {
    mockAuth(USER_ID)
    const res = await PATCH(makeRequest({ concluida: 'sim' }), PARAMS)
    expect(res.status).toBe(400)
  })

  it('returns 400 when concluida is a number instead of boolean', async () => {
    mockAuth(USER_ID)
    const res = await PATCH(makeRequest({ concluida: 1 }), PARAMS)
    expect(res.status).toBe(400)
  })

  // ── Ownership checks ──────────────────────────────────────────────────────────

  it('returns 404 when the tarefa does not exist', async () => {
    mockAuth(USER_ID)
    const db = buildServiceDb([
      { table: 'tarefas',  result: { data: null, error: null } }, // not found
    ])
    ;(createServiceSupabaseClient as ReturnType<typeof vi.fn>).mockReturnValue(db)

    const res = await PATCH(makeRequest({ concluida: true }), PARAMS)
    expect(res.status).toBe(404)
  })

  it('returns 403 when the tarefa belongs to a different user', async () => {
    mockAuth(USER_ID)
    const db = buildServiceDb([
      { table: 'tarefas',  result: { data: { id: TAREFA_ID, analise_id: ANALISE_ID }, error: null } },
      { table: 'analises', result: { data: { user_id: 'other-user-uuid' }, error: null } },
    ])
    ;(createServiceSupabaseClient as ReturnType<typeof vi.fn>).mockReturnValue(db)

    const res = await PATCH(makeRequest({ concluida: false }), PARAMS)
    expect(res.status).toBe(403)
    expect(await res.json()).toMatchObject({ error: expect.stringMatching(/negado/i) })
  })

  // ── Successful update ─────────────────────────────────────────────────────────

  it('returns 200 { success: true } for a valid authenticated update', async () => {
    mockAuth(USER_ID)
    const db = buildServiceDb([
      { table: 'tarefas',  result: { data: { id: TAREFA_ID, analise_id: ANALISE_ID }, error: null } },
      { table: 'analises', result: { data: { user_id: USER_ID }, error: null } },
      { table: 'tarefas',  result: { data: null, error: null } }, // update
    ])
    ;(createServiceSupabaseClient as ReturnType<typeof vi.fn>).mockReturnValue(db)

    const res = await PATCH(makeRequest({ concluida: true }), PARAMS)
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ success: true })
  })

  it('returns 200 when marking a task as not completed (false)', async () => {
    mockAuth(USER_ID)
    const db = buildServiceDb([
      { table: 'tarefas',  result: { data: { id: TAREFA_ID, analise_id: ANALISE_ID }, error: null } },
      { table: 'analises', result: { data: { user_id: USER_ID }, error: null } },
      { table: 'tarefas',  result: { data: null, error: null } },
    ])
    ;(createServiceSupabaseClient as ReturnType<typeof vi.fn>).mockReturnValue(db)

    const res = await PATCH(makeRequest({ concluida: false }), PARAMS)
    expect(res.status).toBe(200)
  })

  // ── DB error path ─────────────────────────────────────────────────────────────

  it('returns 500 when the DB update fails', async () => {
    mockAuth(USER_ID)
    const db = buildServiceDb([
      { table: 'tarefas',  result: { data: { id: TAREFA_ID, analise_id: ANALISE_ID }, error: null } },
      { table: 'analises', result: { data: { user_id: USER_ID }, error: null } },
      { table: 'tarefas',  result: { data: null, error: { message: 'Connection timeout' } } },
    ])
    ;(createServiceSupabaseClient as ReturnType<typeof vi.fn>).mockReturnValue(db)

    const res = await PATCH(makeRequest({ concluida: true }), PARAMS)
    expect(res.status).toBe(500)
  })
})
