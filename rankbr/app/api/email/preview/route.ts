/**
 * GET /api/email/preview?template=<name>
 *
 * Development-only route to render email templates as HTML in the browser.
 * Returns 404 in production.
 *
 * Templates available:
 *   ?template=bem-vindo          (alias: bemvindo)
 *   ?template=pagamento-confirmado
 *   ?template=analise-completa
 *   ?template=redefinir-senha
 */

import { NextRequest, NextResponse } from "next/server";
import { createElement } from "react";
import { render } from "@react-email/components";
import { BemVindo }              from "@/emails/BemVindo";
import { PagamentoConfirmado }   from "@/emails/PagamentoConfirmado";
import { AnaliseCompleta }       from "@/emails/AnaliseCompleta";
import { RedefinirSenha }        from "@/emails/RedefinirSenha";

/* ── Sample data for each template ── */

const APP_URL = "http://localhost:3000";

const SAMPLES = {
  "bem-vindo": () =>
    createElement(BemVindo, {
      nome:   "João Silva",
      appUrl: APP_URL,
    }),

  // Alias without hyphen for convenience
  "bemvindo": () =>
    createElement(BemVindo, {
      nome:   "João Silva",
      appUrl: APP_URL,
    }),

  "pagamento-confirmado": () =>
    createElement(PagamentoConfirmado, {
      nome:          "Maria Oliveira",
      nomeSite:      "Salão da Maria",
      urlSite:       "https://salaodamaria.com.br",
      valor:         10,
      pagamentoId:   "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      dataAprovacao: new Date().toISOString(),
      appUrl:        APP_URL,
    }),

  "analise-completa": () =>
    createElement(AnaliseCompleta, {
      nome:             "Carlos Mendes",
      nomeSite:         "Restaurante Sabor & Arte",
      urlSite:          "https://saborearte.com.br",
      scoreGeral:       67,
      scorePerformance: 58,
      scoreSeo:         72,
      scoreBusiness:    70,
      top3Tarefas: [
        {
          titulo:     "Adicionar meta description em todas as páginas",
          categoria:  "seo",
          prioridade: 1,
        },
        {
          titulo:     "Otimizar imagens para reduzir o tempo de carregamento",
          categoria:  "performance",
          prioridade: 2,
        },
        {
          titulo:     "Responder avaliações no Google Business Profile",
          categoria:  "google_business",
          prioridade: 3,
        },
      ],
      analiseId: "f1e2d3c4-b5a6-7890-1234-abcdef567890",
      appUrl:    APP_URL,
    }),
  "redefinir-senha": () =>
    createElement(RedefinirSenha, {
      resetUrl: `${APP_URL}/redefinir-senha?code=sample-token`,
      appUrl:   APP_URL,
    }),
} as const;

type TemplateName = keyof typeof SAMPLES;

export async function GET(request: NextRequest) {
  /* Block in production */
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Preview disponível apenas em desenvolvimento." },
      { status: 404 }
    );
  }

  const template = (
    request.nextUrl.searchParams.get("template") ?? "bem-vindo"
  ) as TemplateName;

  const factory = SAMPLES[template];

  if (!factory) {
    const available = Object.keys(SAMPLES).join(", ");
    return NextResponse.json(
      { error: `Template "${template}" não encontrado. Disponíveis: ${available}` },
      { status: 400 }
    );
  }

  const html = await render(factory());

  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
