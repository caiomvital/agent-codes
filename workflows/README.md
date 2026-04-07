# WhatsApp Debounce + Conversation Memory — n8n Workflows

## Arquitetura

```
Evolution API (webhook POST)
        │
        ▼
┌─────────────────────────────────────────────┐
│         WA Debounce — Main                  │
│                                             │
│  Normalize → Skip Bot → Define Keys         │
│       │                                     │
│   RPUSH buffer_key  ←── cada mensagem       │
│   SET last_ts (TTL) ←── atualiza timestamp  │
│       │                                     │
│   WAIT 120s (debounce window)               │
│       │                                     │
│   GET last_ts → mesma? → WINNER             │
│                  → diferente? → STOP        │
│       │                                     │
│   LRANGE buffer → DEL buffer                │
│       │                                     │
│   Execute Sub-workflow ──────────────────►  │
└─────────────────────────────────────────────┘
                                              │
                                              ▼
                        ┌────────────────────────────────────────┐
                        │   WA Chat Memory & Reply — Sub-workflow │
                        │                                        │
                        │  Load chat_threads (Postgres)          │
                        │       │                                │
                        │  Build Progressive Summary Prompt      │
                        │       │                                │
                        │  LLM → new rolling_summary             │
                        │       │                                │
                        │  Size > threshold?                     │
                        │   YES → LLM → new meta_summary         │
                        │         reset rolling_summary          │
                        │   NO  → keep meta_summary              │
                        │       │                                │
                        │  Upsert chat_threads                   │
                        │       │                                │
                        │  Build Reply (memory_context + batch)  │
                        │  LLM → reply_text                      │
                        │       │                                │
                        │  POST → Evolution API (sendText)       │
                        └────────────────────────────────────────┘
```

## Pré-requisitos

### Banco de dados (Postgres)

```sql
CREATE TABLE chat_threads (
    chat_id          TEXT PRIMARY KEY,
    rolling_summary  TEXT    NOT NULL DEFAULT '',
    meta_summary     TEXT    NOT NULL DEFAULT '',
    summary_version  INTEGER NOT NULL DEFAULT 0,
    last_summary_at  BIGINT  NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_threads_chat_id ON chat_threads (chat_id);
```

### Credenciais no n8n

| Nome no JSON     | Tipo           | O que configurar                                |
|-----------------|----------------|-------------------------------------------------|
| `Redis_Main`    | Redis          | Host, porta, senha do Redis                     |
| `Postgres_Main` | PostgreSQL     | Host, porta, banco, usuário, senha              |
| `OpenAI_Main`   | OpenAI API     | API Key da OpenAI                               |

### Variáveis de ambiente do n8n (`$vars`)

Configure em **Settings → Variables**:

| Variável                  | Exemplo                              |
|--------------------------|--------------------------------------|
| `MEMORY_SUBWORKFLOW_ID`  | ID do workflow 2 após importar       |
| `EVOLUTION_API_URL`      | `https://evolution.seudominio.com`   |
| `EVOLUTION_INSTANCE`     | `minha-instancia`                    |
| `EVOLUTION_API_KEY`      | `sua-api-key`                        |

## Como importar

1. No n8n: **Workflows → Import from File**
2. Importe `wa_memory_subworkflow.json` primeiro
3. Copie o ID gerado (URL: `/workflow/XXXXXXX`)
4. Crie a variável `MEMORY_SUBWORKFLOW_ID = XXXXXXX`
5. Importe `wa_debounce_main.json`
6. Configure as credenciais Redis, Postgres e OpenAI
7. Ative ambos os workflows
8. Aponte o webhook da Evolution API para:
   `https://SEU_N8N/webhook/whatsapp-evolution`

## Parâmetros configuráveis

| Parâmetro               | Localização                          | Padrão |
|------------------------|--------------------------------------|--------|
| Janela de debounce      | `Define Redis Keys` → `DEBOUNCE_TTL_SEC` | 120s |
| TTL do last_ts no Redis | `Update Last TS with TTL` → `ttl`    | igual ao debounce |
| Threshold meta-resumo   | `Extract New Rolling Summary` → `META_SUMMARY_CHAR_THRESHOLD` | 1200 chars |
| Mensagens brutas no prompt | `Build Reply Prompt` → `MAX_RAW_MESSAGES` | 10 |
| Modelo LLM (resumo)     | `Call LLM — Update Rolling Summary`  | gpt-4o-mini |
| Modelo LLM (resposta)   | `Call LLM — Generate Reply`          | gpt-4o |
| max_tokens rolling      | `Call LLM — Update Rolling Summary`  | 600 |
| max_tokens meta         | `Call LLM — Generate Meta Summary`   | 350 |
| max_tokens reply        | `Call LLM — Generate Reply`          | 400 |
