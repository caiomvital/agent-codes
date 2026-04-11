import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createServerSupabaseClient, createServiceSupabaseClient } from "@/lib/supabase";
import { EstadoProcessando } from "@/components/dashboard/EstadoProcessando";
import { RelatorioCompleto } from "@/components/dashboard/RelatorioCompleto";
import type { ResultadoAnalise, CategoriaTarefa } from "@/types";

const BLUE = "#003087";

interface TarefaRow {
  id: string;
  titulo: string;
  descricao: string;
  categoria: CategoriaTarefa;
  prioridade: number;
  tempo_estimado: string;
  concluida: boolean;
}

interface PageProps {
  params: { id: string };
}

export default async function AnalisePage({ params }: PageProps) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const db = createServiceSupabaseClient();

  // Fetch the specific analise and verify ownership
  const { data: analise } = await db
    .from("analises")
    .select("id, status, resultado, user_id, created_at, sites(nome, url)")
    .eq("id", params.id)
    .single();

  if (!analise) notFound();
  if (analise.user_id !== user.id) notFound();

  const siteRaw = analise.sites;
  const site    = Array.isArray(siteRaw) ? siteRaw[0] : siteRaw;
  const nomeSite = site?.nome ?? "Seu site";
  const urlSite  = site?.url  ?? "";

  // Processing state
  if (analise.status === "aguardando" || analise.status === "processando") {
    return (
      <div>
        <BackLink />
        <EstadoProcessando
          analiseId={analise.id}
          aguardando={analise.status === "aguardando"}
        />
      </div>
    );
  }

  // Error state
  if (analise.status === "erro") {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] lg:min-h-screen flex-col items-center justify-center p-6">
        <BackLink />
        <p className="text-4xl mb-4">⚠️</p>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Análise com erro</h2>
        <p className="text-sm text-gray-500 mb-6 text-center max-w-sm">
          Ocorreu um problema ao analisar este site. Entre em contato com o suporte
          informando o ID:{" "}
          <code className="rounded bg-gray-100 px-1">{analise.id}</code>.
        </p>
      </div>
    );
  }

  // Completed state
  const resultado = analise.resultado as ResultadoAnalise | null;
  if (!resultado) notFound();

  const { data: tarefasRaw } = await db
    .from("tarefas")
    .select("id, titulo, descricao, categoria, prioridade, tempo_estimado, concluida")
    .eq("analise_id", analise.id)
    .order("prioridade", { ascending: true });

  const tarefas: TarefaRow[] = tarefasRaw ?? [];

  return (
    <div>
      <div className="mx-auto max-w-4xl px-6 pt-6">
        <BackLink />
      </div>
      <RelatorioCompleto
        resultado={resultado}
        tarefas={tarefas}
        nomeSite={nomeSite}
        urlSite={urlSite}
      />
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/analises"
      className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-2"
    >
      <ArrowLeft className="h-3.5 w-3.5" />
      Minhas análises
    </Link>
  );
}

export async function generateMetadata({ params }: PageProps) {
  return {
    title: `Análise ${params.id.slice(0, 8)}…`,
  };
}
