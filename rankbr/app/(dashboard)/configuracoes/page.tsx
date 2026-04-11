import { redirect } from "next/navigation";
import { Settings } from "lucide-react";
import { createServerSupabaseClient, createServiceSupabaseClient } from "@/lib/supabase";
import { ConfiguracoesForm } from "./ConfiguracoesForm";

const BLUE = "#003087";

export default async function ConfiguracoesPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch name from our public users table (may be richer than auth metadata)
  const db = createServiceSupabaseClient();
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

  return (
    <div className="mx-auto max-w-2xl p-6">
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
          <p className="text-sm text-gray-500">Gerencie sua conta e preferências</p>
        </div>
      </div>

      {/* Form card */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <ConfiguracoesForm
          userId={user.id}
          currentName={displayName}
          currentEmail={email}
        />
      </div>
    </div>
  );
}
