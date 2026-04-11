# RankBR

Plataforma de diagnóstico de marketing digital para pequenas empresas brasileiras. Por R$10, o cliente recebe um relatório completo com score de performance, SEO, Google Business e palavras-chave priorizadas, além de um plano de ação gerado por IA.

---

## Pré-requisitos

| Ferramenta | Versão mínima |
|---|---|
| Node.js | 18 |
| npm | 9 |
| Supabase CLI | 1.x (`npm install -g supabase`) |
| Conta Supabase | — |
| Conta Mercado Pago | Vendedor verificado |
| Conta Anthropic | Chave de API com acesso ao Claude |

---

## Variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto (`rankbr/.env.local`):

```env
# ── Supabase ─────────────────────────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...          # Service role key (nunca expor no cliente)

# ── Mercado Pago ─────────────────────────────────────────────────────────────
MERCADOPAGO_ACCESS_TOKEN=APP_USR-...
MERCADOPAGO_WEBHOOK_SECRET=         # Segredo definido ao criar o webhook no painel MP

# ── Anthropic ────────────────────────────────────────────────────────────────
ANTHROPIC_API_KEY=sk-ant-...

# ── Google Places (opcional) ─────────────────────────────────────────────────
# Se ausente, o módulo Google Business é pulado graciosamente.
GOOGLE_PLACES_API_KEY=AIza...

# ── DataForSEO (opcional) ────────────────────────────────────────────────────
# Se ausente, as palavras-chave são geradas pela IA.
DATAFORSEO_LOGIN=email@exemplo.com
DATAFORSEO_PASSWORD=senha

# ── Resend (opcional) ────────────────────────────────────────────────────────
# Se ausente, os e-mails transacionais são silenciosamente ignorados.
RESEND_API_KEY=re_...

# ── App ──────────────────────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=https://rankbr.com.br
```

> Copie `.env.local.example` para `.env.local` e preencha os valores:
> ```bash
> cp .env.local.example .env.local
> ```

---

## Como rodar localmente

```bash
# 1. Instalar dependências
npm install

# 2. Configurar banco de dados (Supabase CLI deve estar logado e vinculado)
npx tsx scripts/setup-supabase.ts

# 3. Iniciar o servidor de desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

### Comandos úteis

```bash
npm run dev        # Servidor de desenvolvimento (hot reload)
npm run build      # Build de produção
npm run start      # Servidor de produção local
npm run lint       # ESLint
npm run type-check # Verificação de tipos TypeScript
```

---

## Configurar o banco de dados (Supabase)

### Opção 1 — Script automatizado (recomendado)

```bash
# Pré-requisito: Supabase CLI instalado e projeto vinculado
supabase login
supabase link --project-ref <seu-project-ref>

# Aplicar schema + seed
npx tsx scripts/setup-supabase.ts

# Apenas schema (produção)
npx tsx scripts/setup-supabase.ts --schema

# Apenas seed (desenvolvimento)
npx tsx scripts/setup-supabase.ts --seed
```

### Opção 2 — Dashboard Supabase

1. Acesse **SQL Editor** no dashboard do seu projeto
2. Cole o conteúdo de `supabase/schema.sql` e execute
3. Para dados de teste, execute `supabase/seed.sql`

### RLS (Row Level Security)

O schema cria políticas RLS para todas as tabelas. Os usuários só acessam seus próprios dados. A `SUPABASE_SERVICE_KEY` (service role) no servidor bypassa o RLS — **nunca exponha essa chave no cliente**.

---

## Deploy na Vercel

### 1. Importar o projeto

1. Acesse [vercel.com/new](https://vercel.com/new) e importe o repositório
2. Defina o **Root Directory** como `rankbr`
3. O framework será detectado automaticamente como Next.js

### 2. Variáveis de ambiente

No painel da Vercel → **Settings → Environment Variables**, adicione todas as variáveis listadas em [Variáveis de ambiente](#variáveis-de-ambiente).

### 3. Deploy

```bash
# Via CLI (opcional)
npm install -g vercel
vercel --prod
```

### 4. Configurar domínio personalizado

Em **Settings → Domains**, adicione `rankbr.com.br` e `www.rankbr.com.br`. O redirect `www → apex` já está configurado em `vercel.json`.

### 5. Verificar saúde da aplicação

```bash
curl https://rankbr.com.br/api/health
# → {"status":"ok","timestamp":"2025-..."}
```

---

## Configurar webhook do Mercado Pago

O Mercado Pago envia notificações assíncronas quando um pagamento é aprovado, recusado ou expirado.

### 1. Criar o webhook no painel do Mercado Pago

1. Acesse **Seu negócio → Configurações → Notificações webhook**
2. URL da notificação: `https://rankbr.com.br/api/pagamento/webhook`
3. Eventos: marque **Payments** (`payment`)
4. Copie o **Segredo** gerado

### 2. Configurar a variável de ambiente

```env
MERCADOPAGO_WEBHOOK_SECRET=<segredo-copiado-acima>
```

### 3. Verificação de assinatura

O endpoint `POST /api/pagamento/webhook` valida a assinatura HMAC-SHA256 em cada requisição. Requisições sem assinatura válida retornam `401`.

### Fluxo completo de pagamento

```
Cliente → /nova-analise → POST /api/pagamento/criar
       → Redirecionamento para checkout Mercado Pago
       → Aprovação → GET /api/pagamento/sucesso (redirect MP)
       → Webhook → POST /api/pagamento/webhook
                → Avança analise para "processando"
                → rodarAnalise() fire-and-forget
                → POST /api/analise/iniciar (PageSpeed + SEO + Claude)
                → Analise "concluida" → E-mail de notificação
```

---

## Arquitetura

```
rankbr/
├── app/
│   ├── (public)/           # Landing page (sem autenticação)
│   ├── (auth)/             # Login, cadastro, callback OAuth
│   │   ├── login/
│   │   ├── cadastro/
│   │   └── api/auth/callback/
│   └── (dashboard)/        # Área autenticada (middleware protege)
│       ├── dashboard/       # Visão geral + lista de análises
│       ├── nova-analise/    # Formulário + checkout
│       ├── analises/[id]/   # Relatório detalhado
│       └── configuracoes/   # Conta, sites, pagamentos
│
├── app/api/
│   ├── health/             # GET  — liveness check
│   ├── analise/iniciar/    # POST — orquestrador de análise (30 s)
│   ├── auth/callback/      # GET  — callback OAuth Supabase
│   ├── pagamento/
│   │   ├── criar/          # POST — cria preferência Mercado Pago
│   │   ├── sucesso/        # GET  — redirect pós-pagamento
│   │   └── webhook/        # POST — notificação Mercado Pago (30 s)
│   ├── usuario/            # PATCH — atualiza nome
│   ├── usuario/senha/      # POST  — troca de senha
│   └── user/delete/        # DELETE — exclui conta
│
├── components/
│   ├── ui/                 # Primitivos (Button, Input, Badge, Tabs…)
│   ├── dashboard/          # ListaSites, HistoricoPagamentos, tabs/
│   └── shared/             # Header, Sidebar, etc.
│
├── lib/
│   ├── supabase.ts         # Clientes Supabase (browser, server, service)
│   ├── analise.ts          # Orquestrador: PageSpeed + SEO + Claude + Tarefas
│   ├── pagespeed.ts        # Google PageSpeed Insights
│   ├── seo.ts              # Checagem SEO on-page
│   ├── google-business.ts  # Google Places API
│   ├── palavras-chave.ts   # DataForSEO ou Claude fallback
│   ├── claude.ts           # Relatório IA (resumo + tarefas)
│   ├── mercadopago.ts      # Cliente Mercado Pago
│   ├── email.ts            # Resend (e-mails transacionais)
│   ├── logger.ts           # Logs estruturados (JSON em produção)
│   └── env.ts              # Validação de variáveis de ambiente
│
├── types/index.ts          # Tipos globais (User, Site, Analise, etc.)
├── supabase/
│   ├── schema.sql          # DDL completo: tabelas, enums, RLS, índices
│   └── seed.sql            # Dados de desenvolvimento
├── scripts/
│   └── setup-supabase.ts   # Aplica schema/seed via Supabase CLI
├── middleware.ts            # Protege rotas autenticadas
└── vercel.json             # Headers de segurança, redirects, timeouts
```

### Modelo de dados

| Tabela | Descrição |
|---|---|
| `users` | Espelho de `auth.users` com campos extras (name, role) |
| `sites` | Sites cadastrados pelo usuário para análise |
| `pagamentos` | Transações Mercado Pago vinculadas a um site |
| `analises` | Resultado completo de cada diagnóstico (JSONB) |
| `tarefas` | Plano de ação priorizado gerado pela IA |

### Pipeline de análise

Cada análise executa em paralelo:

1. **PageSpeed Insights** — performance, LCP, CLS, TBT, FCP, TTFB
2. **SEO on-page** — HTTPS, title, meta description, H1, canonical, OG, sitemap
3. **Google Business** — rating, avaliações, horários, fotos
4. **Palavras-chave** — DataForSEO ou Claude (fallback)

Depois Claude sintetiza tudo em:
- Score geral (0–100) ponderado por área
- Resumo executivo + pontos fortes + problemas críticos
- 10 tarefas priorizadas com tempo estimado

---

## Health check

```
GET /api/health
```

Retorna `200 { status: "ok", timestamp }` se o Supabase responder, ou `503` se houver degradação.

Ideal para configurar como **health check** no painel da Vercel ou em serviços de uptime monitoring (UptimeRobot, BetterStack, etc.).
