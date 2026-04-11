#!/usr/bin/env tsx
/**
 * scripts/setup-supabase.ts
 *
 * Aplica o schema e o seed do banco de dados no projeto Supabase via CLI.
 *
 * Pré-requisitos:
 *   1. Supabase CLI instalado: npm install -g supabase
 *   2. Login na CLI:           supabase login
 *   3. Projeto vinculado:      supabase link --project-ref <seu-project-ref>
 *
 * Uso:
 *   npx tsx scripts/setup-supabase.ts          # aplica schema + seed
 *   npx tsx scripts/setup-supabase.ts --schema  # apenas schema
 *   npx tsx scripts/setup-supabase.ts --seed    # apenas seed
 */

import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve, join } from "node:path";

const ROOT        = resolve(__dirname, "..");
const SCHEMA_PATH = join(ROOT, "supabase", "schema.sql");
const SEED_PATH   = join(ROOT, "supabase", "seed.sql");

const args        = process.argv.slice(2);
const onlySchema  = args.includes("--schema");
const onlySeed    = args.includes("--seed");
const runSchema   = !onlySeed  || onlySchema;
const runSeed     = !onlySchema || onlySeed;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function checkCli(): void {
  try {
    execSync("supabase --version", { stdio: "pipe" });
  } catch {
    console.error(
      "\n❌  Supabase CLI não encontrado.\n" +
      "    Instale com: npm install -g supabase\n" +
      "    Depois faça login: supabase login\n"
    );
    process.exit(1);
  }
}

function run(label: string, cmd: string): void {
  console.log(`\n▶  ${label}`);
  try {
    execSync(cmd, { stdio: "inherit", cwd: ROOT });
    console.log(`✓  ${label} concluído.`);
  } catch {
    console.error(`\n✗  Falha em: ${label}`);
    process.exit(1);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

checkCli();

console.log("═══════════════════════════════════════════════");
console.log("  RankBR — Configuração do banco de dados");
console.log("═══════════════════════════════════════════════");

if (runSchema) {
  if (!existsSync(SCHEMA_PATH)) {
    console.error(`❌  Arquivo não encontrado: ${SCHEMA_PATH}`);
    process.exit(1);
  }
  run(
    "Aplicando schema.sql",
    `supabase db execute --file "${SCHEMA_PATH}"`
  );
}

if (runSeed) {
  if (!existsSync(SEED_PATH)) {
    console.warn(`⚠   Arquivo de seed não encontrado: ${SEED_PATH} — pulando.`);
  } else {
    run(
      "Aplicando seed.sql (dados de desenvolvimento)",
      `supabase db execute --file "${SEED_PATH}"`
    );
  }
}

console.log("\n✅  Banco de dados configurado com sucesso!\n");
