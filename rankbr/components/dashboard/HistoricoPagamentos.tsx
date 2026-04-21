"use client";

import { useState } from "react";
import { Receipt, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { StatusPagamento } from "@/types";

const BLUE = "#003087";
const PER_PAGE = 10;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PagamentoRow {
  id: string;
  valor: number;
  status: StatusPagamento;
  created_at: string;
  mp_payment_id?: string | null;
  site: {
    nome: string;
    url: string;
  } | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<StatusPagamento, { label: string; variant: "success" | "warning" | "error" | "secondary" | "info" }> = {
  aprovado:  { label: "Aprovado",  variant: "success"   },
  pendente:  { label: "Pendente",  variant: "warning"   },
  recusado:  { label: "Recusado",  variant: "error"     },
  cancelado: { label: "Cancelado", variant: "secondary" },
  expirado:  { label: "Expirado",  variant: "secondary" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// ─── Component ───────────────────────────────────────────────────────────────

interface HistoricoPagamentosProps {
  pagamentos: PagamentoRow[];
}

export function HistoricoPagamentos({ pagamentos }: HistoricoPagamentosProps) {
  const [page, setPage] = useState(0);

  const totalPages = Math.ceil(pagamentos.length / PER_PAGE);
  const slice      = pagamentos.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  if (pagamentos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 py-16 text-center">
        <div
          className="mb-4 flex h-14 w-14 items-center justify-center rounded-full"
          style={{ backgroundColor: `${BLUE}12` }}
        >
          <Receipt className="h-7 w-7" style={{ color: BLUE }} />
        </div>
        <h3 className="mb-1 font-semibold text-gray-900">Nenhum pagamento realizado</h3>
        <p className="text-sm text-gray-500">
          Seu histórico de transações aparecerá aqui após a primeira compra.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-xl border border-gray-100 md:block">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">Data</th>
              <th className="px-4 py-3 text-left">Site analisado</th>
              <th className="px-4 py-3 text-left">Valor</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">ID do pagamento</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 bg-white">
            {slice.map((p) => {
              const cfg = STATUS_CONFIG[p.status];
              return (
                <tr key={p.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 text-gray-600">{formatDate(p.created_at)}</td>
                  <td className="px-4 py-3">
                    {p.site ? (
                      <div>
                        <p className="font-medium text-gray-900">{p.site.nome}</p>
                        <a
                          href={p.site.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
                        >
                          <ExternalLink className="h-3 w-3" />
                          {p.site.url}
                        </a>
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    {formatCurrency(p.valor)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={cfg.variant}>{cfg.label}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    {p.mp_payment_id ? (
                      <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
                        {p.mp_payment_id}
                      </code>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {slice.map((p) => {
          const cfg = STATUS_CONFIG[p.status];
          return (
            <div
              key={p.id}
              className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-900">
                    {p.site?.nome ?? "Site removido"}
                  </p>
                  <p className="text-xs text-gray-400">{formatDate(p.created_at)}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{formatCurrency(p.valor)}</p>
                  <Badge variant={cfg.variant} className="mt-1">{cfg.label}</Badge>
                </div>
              </div>
              {p.mp_payment_id && (
                <p className="mt-2 text-xs text-gray-400">
                  ID: <code className="rounded bg-gray-100 px-1">{p.mp_payment_id}</code>
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-100 pt-4">
          <p className="text-xs text-gray-400">
            {page * PER_PAGE + 1}–{Math.min((page + 1) * PER_PAGE, pagamentos.length)} de{" "}
            {pagamentos.length} registros
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-gray-50"
              aria-label="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                  i === page
                    ? "text-white"
                    : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
                style={i === page ? { backgroundColor: BLUE } : undefined}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-gray-50"
              aria-label="Próxima página"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
