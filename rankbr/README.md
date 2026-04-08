# RankBR

Plataforma de ranking e análise construída com Next.js 14, Supabase e integração com Claude AI.

## Stack

- **Next.js 14** — App Router + TypeScript
- **Tailwind CSS** — estilização
- **shadcn/ui** — componentes de UI
- **Supabase** — banco de dados e autenticação
- **Mercado Pago** — pagamentos
- **Anthropic Claude** — IA
- **React Hook Form + Zod** — formulários e validação
- **Axios** — requisições HTTP

## Pré-requisitos

- Node.js >= 18
- npm, yarn ou pnpm

## Como rodar

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

Copie o arquivo `.env.local` e preencha as variáveis:

```bash
cp .env.local .env.local
```

| Variável                       | Descrição                            |
| ------------------------------ | ------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`     | URL do projeto Supabase              |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`| Chave anônima do Supabase            |
| `SUPABASE_SERVICE_KEY`         | Chave de serviço do Supabase (server)|
| `MERCADOPAGO_ACCESS_TOKEN`     | Token de acesso do Mercado Pago      |
| `ANTHROPIC_API_KEY`            | Chave da API da Anthropic (Claude)   |
| `NEXT_PUBLIC_APP_URL`          | URL base da aplicação                |

### 3. Rodar em desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

### 4. Build de produção

```bash
npm run build
npm start
```

## Estrutura do projeto

```
rankbr/
├── app/
│   ├── api/                  # API Routes
│   ├── (public)/             # Rotas públicas (landing page)
│   ├── (auth)/               # Login e cadastro
│   │   ├── login/
│   │   └── cadastro/
│   └── (dashboard)/          # Área autenticada
│       └── dashboard/
├── components/
│   ├── ui/                   # Componentes shadcn/ui
│   └── shared/               # Componentes reutilizáveis
├── lib/
│   ├── supabase.ts           # Cliente Supabase
│   ├── mercadopago.ts        # Cliente Mercado Pago
│   ├── claude.ts             # Cliente Anthropic
│   └── utils.ts              # Utilitários (cn, etc.)
├── types/
│   └── index.ts              # Tipos e interfaces globais
├── .env.local                # Variáveis de ambiente (não versionado)
└── components.json           # Configuração shadcn/ui
```

## Adicionar componentes shadcn/ui

```bash
npx shadcn@latest add button
npx shadcn@latest add input
# etc.
```
