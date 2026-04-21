import { redirect } from "next/navigation";
import { Settings } from "lucide-react";
import { createServerSupabaseClient, createServiceSupabaseClient } from "@/lib/supabase";
import { ConfiguracoesTabs } from "./ConfiguracoesTabs";
import type { SiteComAnalise } from "@/components/dashboard/ListaSites";
import type { PagamentoRow } from "@/components/dashboard/HistoricoPagamentos";
import type { StatusPagamento } from "@/types";

const BLUE = "#003087";

export default async function ConfiguracoesPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const db = createServiceSupabaseClient();

  // ─── Fetch user profile ───────────────────────────────────────────────────
  const { data: userRow } = await db
    .from("users")
    .select("name, email")
    .eq("id", user.id)
    .single();

  const displayName =
    userRow?.name ??
    user.user_metadata?.name ??
    user.user_metadata?.full_name ??
    user.email?.split("@")[0] ??
    "Usuário";

  const email = userRow?.email ?? user.email ?? "";

  // ─── Fetch sites with latest analise ─────────────────────────────────────
  const { data: sitesRaw } = await db
    .from("sites")
    .select(`
      id, url, nome, segmento, cidade, estado, created_at,
      analises (
        id, status, created_at,
        resultado
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const sites: SiteComAnalise[] = (sitesRaw ?? []).map((s: any) => {
    // Pick the most recent analise (array ordered by created_at DESC from DB,
    // but Supabase nested selects return unordered — sort client-side)
    const sorted = (s.analises ?? []).sort(
      (a: any, b: any) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    const latest = sorted[0] ?? null;
    return {
      id: s.id,
      url: s.url,
      nome: s.nome,
      segmento: s.segmento,
      cidade: s.cidade,
      estado: s.estado,
      created_at: s.created_at,
      analise: latest
        ? {
            id: latest.id,
            status: latest.status,
            score_geral: latest.resultado?.score_geral ?? undefined,
            created_at: latest.created_at,
          }
        : null,
    };
  });

  // ─── Fetch pagamentos with site info ─────────────────────────────────────
  const { data: pagamentosRaw } = await db
    .from("pagamentos")
    .select(`
      id, valor, status, created_at, mp_payment_id,
      sites ( nome, url )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const pagamentos: PagamentoRow[] = (pagamentosRaw ?? []).map((p: any) => ({
    id: p.id,
    valor: p.valor,
    status: p.status as StatusPagamento,
    created_at: p.created_at,
    mp_payment_id: p.mp_payment_id ?? null,
    site: p.sites
      ? { nome: p.sites.nome, url: p.sites.url }
      : null,
  }));

  return (
    <div className="mx-auto max-w-3xl p-6">
      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${BLUE}15` }}
        >
          <Settings className="h-5 w-5" style={{ color: BLUE }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
          <p className="text-sm text-gray-500">Gerencie sua conta, sites e pagamentos</p>
        </div>
      </div>

      {/* Tabs card */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <ConfiguracoesTabs
          userId={user.id}
          currentName={displayName}
          currentEmail={email}
          sites={sites}
          pagamentos={pagamentos}
        />
      </div>
    </div>
  );
}
