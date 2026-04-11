import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";
import { Sidebar } from "@/components/dashboard/Sidebar";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const rawName: string =
    user.user_metadata?.name ??
    user.user_metadata?.full_name ??
    user.email ??
    "Usuário";

  const userName  = rawName;
  const userEmail = user.email ?? "";
  const initials  = getInitials(rawName);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar userName={userName} userEmail={userEmail} initials={initials} />
      <main className="lg:ml-56 pt-14 lg:pt-0 min-h-screen">
        {children}
      </main>
    </div>
  );
}
