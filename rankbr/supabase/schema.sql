-- ============================================================
--  RankBR — Supabase Database Schema
-- ============================================================
-- Run this script in:
--   Supabase Dashboard → SQL Editor → New query → Run
--
-- Or via CLI:
--   supabase db push   (if using local dev with supabase CLI)
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ── Enums ────────────────────────────────────────────────────────────────────

create type segmento_enum as enum (
  'restaurante', 'salao_beleza', 'barbearia', 'clinica', 'academia',
  'escola', 'hotel', 'loja_fisica', 'ecommerce', 'servicos',
  'escritorio', 'imobiliaria', 'farmacia', 'supermercado', 'outro'
);

create type status_pagamento_enum as enum (
  'pendente', 'aprovado', 'recusado', 'cancelado', 'expirado'
);

create type status_analise_enum as enum (
  'aguardando', 'processando', 'concluida', 'erro'
);

create type categoria_tarefa_enum as enum (
  'seo', 'performance', 'google_business', 'conteudo', 'outro'
);

-- ── users ─────────────────────────────────────────────────────────────────────
-- Mirror of auth.users with profile data.
-- Populated by the auth callback route on first sign-in.

create table if not exists public.users (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  name        text not null default '',
  role        text not null default 'user' check (role in ('user', 'admin')),
  created_at  timestamptz not null default now()
);

-- RLS
alter table public.users enable row level security;

create policy "users: select own row"
  on public.users for select
  using (auth.uid() = id);

create policy "users: update own row"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ── sites ─────────────────────────────────────────────────────────────────────

create table if not exists public.sites (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.users (id) on delete cascade,
  url         text not null,
  nome        text not null,
  segmento    segmento_enum not null,
  cidade      text,
  estado      char(2),
  created_at  timestamptz not null default now()
);

create index if not exists sites_user_id_idx on public.sites (user_id);

-- RLS
alter table public.sites enable row level security;

create policy "sites: select own"
  on public.sites for select
  using (auth.uid() = user_id);

create policy "sites: insert own"
  on public.sites for insert
  with check (auth.uid() = user_id);

create policy "sites: delete own"
  on public.sites for delete
  using (auth.uid() = user_id);

-- ── pagamentos ────────────────────────────────────────────────────────────────

create table if not exists public.pagamentos (
  id                  uuid primary key default uuid_generate_v4(),
  site_id             uuid not null references public.sites (id) on delete cascade,
  user_id             uuid not null references public.users (id) on delete cascade,
  mp_preference_id    text,
  mp_payment_id       text,
  status              status_pagamento_enum not null default 'pendente',
  valor               numeric(10, 2) not null default 10.00,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists pagamentos_user_id_idx on public.pagamentos (user_id);
create index if not exists pagamentos_site_id_idx on public.pagamentos (site_id);
create index if not exists pagamentos_mp_payment_id_idx on public.pagamentos (mp_payment_id);

-- RLS
alter table public.pagamentos enable row level security;

create policy "pagamentos: select own"
  on public.pagamentos for select
  using (auth.uid() = user_id);

-- ── analises ─────────────────────────────────────────────────────────────────

create table if not exists public.analises (
  id              uuid primary key default uuid_generate_v4(),
  pagamento_id    uuid not null references public.pagamentos (id) on delete cascade,
  site_id         uuid not null references public.sites (id) on delete cascade,
  user_id         uuid not null references public.users (id) on delete cascade,
  status          status_analise_enum not null default 'aguardando',
  resultado       jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists analises_user_id_idx       on public.analises (user_id);
create index if not exists analises_pagamento_id_idx  on public.analises (pagamento_id);
create index if not exists analises_site_id_idx       on public.analises (site_id);
create index if not exists analises_status_idx        on public.analises (status);

-- RLS
alter table public.analises enable row level security;

create policy "analises: select own"
  on public.analises for select
  using (auth.uid() = user_id);

-- ── tarefas ───────────────────────────────────────────────────────────────────

create table if not exists public.tarefas (
  id              uuid primary key default uuid_generate_v4(),
  analise_id      uuid not null references public.analises (id) on delete cascade,
  titulo          text not null,
  descricao       text not null default '',
  categoria       categoria_tarefa_enum not null default 'outro',
  prioridade      smallint not null default 5 check (prioridade between 1 and 10),
  tempo_estimado  text not null default '',
  concluida       boolean not null default false,
  created_at      timestamptz not null default now()
);

create index if not exists tarefas_analise_id_idx on public.tarefas (analise_id);
create index if not exists tarefas_concluida_idx  on public.tarefas (concluida);

-- RLS
alter table public.tarefas enable row level security;

create policy "tarefas: select via analise ownership"
  on public.tarefas for select
  using (
    exists (
      select 1 from public.analises a
      where a.id = tarefas.analise_id
        and a.user_id = auth.uid()
    )
  );

create policy "tarefas: update via analise ownership"
  on public.tarefas for update
  using (
    exists (
      select 1 from public.analises a
      where a.id = tarefas.analise_id
        and a.user_id = auth.uid()
    )
  );

-- ── updated_at trigger ────────────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger pagamentos_updated_at
  before update on public.pagamentos
  for each row execute function public.set_updated_at();

create or replace trigger analises_updated_at
  before update on public.analises
  for each row execute function public.set_updated_at();

-- ── Service role bypasses RLS ─────────────────────────────────────────────────
-- The application uses SUPABASE_SERVICE_KEY (service role) for all writes
-- from server-side routes. Service role bypasses RLS automatically.
-- The policies above govern direct client-side access only.

-- ============================================================
--  Done! Tables: users, sites, pagamentos, analises, tarefas
-- ============================================================
