import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, BarChart3, Clock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { createServerSupabaseClient, createServiceSupabaseClient } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import type { StatusAnalise } from "@/types";

const GREEN = "#00A651";
const BLUE  = "#003087";

// ─── helpers ─────────────────────────────────────────────────────────────────

function statusConfig(status: StatusAnalise): {
  label: string;
  variant: "success" | "info" | "warning" | "error" | "secondary";
  icon: React.ElementType;
} {
  switch (status) {
    case "concluida":
      return { label: "Concluída",    variant: "success",   icon: CheckCircle2 };
    case "processando":
      return { label: "Processando",  variant: "info",      icon: Loader2      };
    case "aguardando":
      return { label: "Aguardando",   variant: "warning",   icon: Clock        };
    case "erro":
      return { label: "Erro",         variant: "error",     icon: AlertCircle  };
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function ScorePill({ score }: { score: number }) {
  const color =
    score >= 70 ? GREEN :
    score >= 40 ? "#D97706" :
    "#DC2626";

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold text-white"
      style={{ backgroundColor: color }}
    >
      <BarChart3 className="h-3 w-3" />
      {score}/100
    </span>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default async function AnalisesPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const db = createServiceSupabaseClient();

  const { data: analises } = await db
    .from("analises")
    .select(`
      id,
      status,
      resultado,
      created_at,
      updated_at,
      sites (nome, url, segmento)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const rows = analises ?? [];

  return (
    <div className="mx-auto max-w-4xl p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Minhas análises</h1>
          <p className="mt-1 text-sm text-gray-500">
            {rows.length === 0
              ? "Nenhuma análise realizada ainda."
              : `${rows.length} análise${rows.length > 1 ? "s" : ""} no total`}
          </p>
        </div>

        <Link
          href="/nova-analise"
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: GREEN }}
        >
          <Plus className="h-4 w-4" />
          Nova análise
        </Link>
      </div>

      {/* Empty state */}
      {rows.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-20 text-center">
          <div
            className="mb-4 flex h-16 w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: `${BLUE}12` }}
          >
            <BarChart3 className="h-8 w-8" style={{ color: BLUE }} />
          </div>
          <h2 className="mb-1 text-lg font-semibold text-gray-900">
            Nenhuma análise ainda
          </h2>
          <p className="mb-6 max-w-xs text-sm text-gray-500">
            Faça seu primeiro diagnóstico de marketing digital por apenas R$10.
          </p>
          <Link
            href="/nova-analise"
            className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white"
            style={{ backgroundColor: GREEN }}
          >
            <Plus className="h-4 w-4" />
            Iniciar análise
          </Link>
        </div>
      )}

      {/* Analysis list */}
      {rows.length > 0 && (
        <div className="space-y-3">
          {rows.map((analise) => {
            const siteRaw = analise.sites;
            const site    = Array.isArray(siteRaw) ? siteRaw[0] : siteRaw;
            const cfg     = statusConfig(analise.status as StatusAnalise);
            const Icon    = cfg.icon;
            const score   = (analise.resultado as { score_geral?: number } | null)?.score_geral;
            const isActive = analise.status === "aguardando" || analise.status === "processando";
            const href    = analise.status === "concluida"
              ? `/dashboard`
              : isActive
                ? `/dashboard`
                : undefined;

            return (
              <div
                key={analise.id}
                className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                {/* Site initial avatar */}
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
                  style={{ backgroundColor: BLUE }}
                >
                  {(site?.nome ?? "?")[0].toUpperCase()}
                </div>

                {/* Main info */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-semibold text-gray-900">
                      {site?.nome ?? "Site sem nome"}
                    </p>
                    <Badge variant={cfg.variant} className="flex items-center gap-1 text-xs">
                      <Icon className="h-3 w-3" />
                      {cfg.label}
                    </Badge>
                    {score !== undefined && <ScorePill score={score} />}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-gray-400">
                    {site?.url ?? ""} · {formatDate(analise.created_at)}
                  </p>
                </div>

                {/* Action */}
                {href && (
                  <Link
                    href={href}
                    className="shrink-0 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
                  >
                    {analise.status === "concluida" ? "Ver relatório" : "Acompanhar"}
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Info footer */}
      <p className="mt-8 text-center text-xs text-gray-400">
        Cada análise é realizada por um pagamento único de R$10 · Sem renovação automática
      </p>
    </div>
  );
}
