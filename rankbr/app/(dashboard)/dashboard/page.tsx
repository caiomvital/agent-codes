import { redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { createServerSupabaseClient, createServiceSupabaseClient } from "@/lib/supabase";
import { EstadoVazio } from "@/components/dashboard/EstadoVazio";
import { EstadoProcessando } from "@/components/dashboard/EstadoProcessando";
import { RelatorioCompleto } from "@/components/dashboard/RelatorioCompleto";
import type { ResultadoAnalise, CategoriaTarefa } from "@/types";

const GREEN = "#00A651";

interface PageProps {
  searchParams: { analise?: string; pagamento?: string };
}

interface TarefaRow {
  id: string;
  titulo: string;
  descricao: string;
  categoria: CategoriaTarefa;
  prioridade: number;
  tempo_estimado: string;
  concluida: boolean;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  /* Auth */
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const service = createServiceSupabaseClient();

  /* Fetch most recent analise with its site */
  const { data: analise } = await service
    .from("analises")
    .select("id, status, resultado, site:sites(nome, url)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  /* ── Estado vazio ── */
  if (!analise) {
    return <EstadoVazio />;
  }

  /* Resolve site data (Supabase returns it as object or array) */
  const siteRaw = analise.site;
  const site = Array.isArray(siteRaw) ? siteRaw[0] : siteRaw;
  const nomeSite = site?.nome ?? "Seu site";
  const urlSite  = site?.url  ?? "";

  /* ── Estado processando / aguardando ── */
  if (analise.status === "aguardando" || analise.status === "processando") {
    return (
      <EstadoProcessando
        analiseId={analise.id}
        aguardando={analise.status === "aguardando"}
      />
    );
  }

  /* ── Estado erro ── */
  if (analise.status === "erro") {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] lg:min-h-screen items-center justify-center p-6">
        <div className="mx-auto max-w-sm text-center">
          <p className="text-4xl mb-4">⚠️</p>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Análise com erro
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Ocorreu um problema ao analisar seu site. Entre em contato com o
            suporte e mencione o ID:{" "}
            <code className="rounded bg-gray-100 px-1">{analise.id}</code>.
          </p>
        </div>
      </div>
    );
  }

  /* ── Estado concluída ── */
  const resultado = analise.resultado as ResultadoAnalise | null;
  if (!resultado) {
    return <EstadoVazio />;
  }

  /* Fetch tarefas */
  const { data: tarefasRaw } = await service
    .from("tarefas")
    .select("id, titulo, descricao, categoria, prioridade, tempo_estimado, concluida")
    .eq("analise_id", analise.id)
    .order("prioridade", { ascending: true });

  const tarefas: TarefaRow[] = tarefasRaw ?? [];

  return (
    <>
      {/* Pagamento aprovado banner */}
      {searchParams.pagamento === "aprovado" && (
        <div
          className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-white"
          style={{ backgroundColor: GREEN }}
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Pagamento confirmado! Sua análise foi iniciada.
        </div>
      )}

      <RelatorioCompleto
        resultado={resultado}
        tarefas={tarefas}
        nomeSite={nomeSite}
        urlSite={urlSite}
      />
    </>
  );
}
