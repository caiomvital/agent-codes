import Link from "next/link";
import {
  Globe,
  BarChart3,
  Plus,
  ExternalLink,
  FileText,
  Calendar,
  MapPin,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { StatusAnalise, CategoriaTarefa } from "@/types";

const GREEN = "#00A651";
const BLUE  = "#003087";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SiteComAnalise {
  id: string;
  url: string;
  nome: string;
  segmento: string;
  cidade?: string | null;
  estado?: string | null;
  created_at: string;
  analise?: {
    id: string;
    status: StatusAnalise;
    score_geral?: number;
    created_at: string;
  } | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function scoreColor(score: number): string {
  if (score >= 70) return GREEN;
  if (score >= 40) return "#D97706";
  return "#DC2626";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const STATUS_CONFIG: Record<StatusAnalise, { label: string; variant: "success" | "info" | "warning" | "error" }> = {
  concluida:   { label: "Concluída",   variant: "success"  },
  processando: { label: "Processando", variant: "info"     },
  aguardando:  { label: "Aguardando",  variant: "warning"  },
  erro:        { label: "Com erro",    variant: "error"    },
};

// ─── Component ───────────────────────────────────────────────────────────────

interface ListaSitesProps {
  sites: SiteComAnalise[];
}

export function ListaSites({ sites }: ListaSitesProps) {
  if (sites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 py-16 text-center">
        <div
          className="mb-4 flex h-14 w-14 items-center justify-center rounded-full"
          style={{ backgroundColor: `${BLUE}12` }}
        >
          <Globe className="h-7 w-7" style={{ color: BLUE }} />
        </div>
        <h3 className="mb-1 font-semibold text-gray-900">Nenhum site analisado ainda</h3>
        <p className="mb-5 text-sm text-gray-500">
          Faça seu primeiro diagnóstico e descubra o que está travando seu crescimento.
        </p>
        <Link
          href="/nova-analise"
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white"
          style={{ backgroundColor: GREEN }}
        >
          <Plus className="h-4 w-4" />
          Nova análise — R$10
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sites.map((site) => {
        const analise    = site.analise;
        const score      = analise?.score_geral;
        const statusCfg  = analise ? STATUS_CONFIG[analise.status] : null;
        const relatorioHref = analise ? `/analises/${analise.id}` : null;

        return (
          <div
            key={site.id}
            className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
          >
            {/* Header row */}
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                    style={{ backgroundColor: BLUE }}
                  >
                    {site.nome[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{site.nome}</p>
                    <a
                      href={site.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {site.url}
                    </a>
                  </div>
                </div>
              </div>

              {/* Score pill */}
              {score !== undefined && (
                <div
                  className="flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold text-white"
                  style={{ backgroundColor: scoreColor(score) }}
                >
                  <BarChart3 className="h-3.5 w-3.5" />
                  {score}/100
                </div>
              )}
            </div>

            {/* Meta row */}
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-400">
              {(site.cidade || site.estado) && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {[site.cidade, site.estado].filter(Boolean).join(", ")}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Cadastrado em {formatDate(site.created_at)}
              </span>
              {analise && statusCfg && (
                <Badge variant={statusCfg.variant} className="text-xs">
                  {statusCfg.label}
                </Badge>
              )}
              {analise && (
                <span className="flex items-center gap-1">
                  Análise em {formatDate(analise.created_at)}
                </span>
              )}
            </div>

            {/* Action buttons */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {relatorioHref && analise?.status === "concluida" && (
                <Link
                  href={relatorioHref}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Ver relatório
                </Link>
              )}
              {relatorioHref && analise?.status !== "concluida" && (
                <Link
                  href={relatorioHref}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Acompanhar
                </Link>
              )}
              <Link
                href="/nova-analise"
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: GREEN }}
              >
                <Plus className="h-3.5 w-3.5" />
                Nova análise
              </Link>
            </div>
          </div>
        );
      })}

      {/* CTA footer */}
      <div className="pt-2 text-center">
        <Link
          href="/nova-analise"
          className="inline-flex items-center gap-2 text-sm font-medium"
          style={{ color: GREEN }}
        >
          <Plus className="h-4 w-4" />
          Analisar outro site
        </Link>
      </div>
    </div>
  );
}
