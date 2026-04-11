import { NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceSupabaseClient } from "@/lib/supabase";

/**
 * DELETE /api/user/delete
 *
 * Deletes the authenticated user's account:
 * 1. Verify identity via getUser()
 * 2. Delete all user data via service client (cascade via FK or explicit deletes)
 * 3. Delete the auth.users record via Supabase Admin API
 * 4. Sign out
 *
 * Note: Supabase does not expose deleteUser() on the client SDK.
 * We call the Admin REST API directly using SUPABASE_SERVICE_KEY.
 */
export async function DELETE() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const db = createServiceSupabaseClient();

  // Delete public data (tarefas → analises → pagamentos → sites → users)
  // If FK cascades are set up in the schema this single call is enough;
  // otherwise we delete in dependency order.
  await db.from("tarefas").delete().eq("analise_id",
    // subquery via RLS-bypass: delete tarefas belonging to user's analises
    (await db.from("analises").select("id").eq("user_id", user.id)).data?.map((a) => a.id) ?? []
  );
  await db.from("analises").delete().eq("user_id", user.id);
  await db.from("pagamentos").delete().eq("user_id", user.id);
  await db.from("sites").delete().eq("user_id", user.id);
  await db.from("users").delete().eq("id", user.id);

  // Delete from auth.users via Admin REST API
  const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey      = process.env.SUPABASE_SERVICE_KEY!;

  const adminRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${user.id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
    },
  });

  if (!adminRes.ok) {
    const body = await adminRes.text().catch(() => "");
    console.error("[user/delete] Admin API error:", adminRes.status, body);
    // Non-fatal: public data is already deleted.
  }

  await supabase.auth.signOut();

  return NextResponse.json({ success: true });
}
