"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  LayoutDashboard,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  Plus,
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import { cn } from "@/lib/utils";

const GREEN = "#00A651";
const BLUE  = "#003087";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const NAV: NavItem[] = [
  { href: "/dashboard",    label: "Dashboard",        icon: LayoutDashboard },
  { href: "/analises",     label: "Minhas análises",  icon: FileText },
  { href: "/configuracoes",label: "Configurações",    icon: Settings },
];

interface SidebarProps {
  userName: string;
  userEmail: string;
  /** First letter(s) for the avatar initials */
  initials: string;
}

function NavLink({ item, onClick }: { item: NavItem; onClick?: () => void }) {
  const pathname = usePathname();
  const active   = pathname === item.href;
  const Icon     = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "text-white"
          : "text-gray-400 hover:bg-white/10 hover:text-white"
      )}
      style={active ? { backgroundColor: `${GREEN}30` } : undefined}
    >
      <Icon className="h-4 w-4 shrink-0" style={active ? { color: GREEN } : undefined} />
      {item.label}
    </Link>
  );
}

function SidebarContent({
  userName,
  userEmail,
  initials,
  onClose,
}: SidebarProps & { onClose?: () => void }) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div
      className="flex h-full flex-col"
      style={{ backgroundColor: BLUE }}
    >
      {/* Logo */}
      <div className="flex h-14 items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2" onClick={onClose}>
          <div
            className="flex h-7 w-7 items-center justify-center rounded-lg"
            style={{ backgroundColor: GREEN }}
          >
            <BarChart3 className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold text-white">
            Rank<span style={{ color: GREEN }}>BR</span>
          </span>
        </Link>
        {/* Close button — mobile only */}
        {onClose && (
          <button onClick={onClose} className="text-white/60 hover:text-white lg:hidden">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* New analysis CTA */}
      <div className="px-3 pb-2 pt-1">
        <Link
          href="/nova-analise"
          onClick={onClose}
          className="flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: GREEN }}
        >
          <Plus className="h-4 w-4" />
          Nova análise
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
        {NAV.map((item) => (
          <NavLink key={item.href} item={item} onClick={onClose} />
        ))}
      </nav>

      {/* User info + sign out */}
      <div className="border-t border-white/10 p-3">
        <div className="mb-2 flex items-center gap-3 rounded-lg px-2 py-2">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ backgroundColor: GREEN }}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">{userName}</p>
            <p className="truncate text-xs text-white/50">{userEmail}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </div>
  );
}

export function Sidebar(props: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* ── Desktop sidebar (always visible ≥ lg) ── */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 lg:block">
        <SidebarContent {...props} />
      </aside>

      {/* ── Mobile top bar ── */}
      <header
        className="fixed inset-x-0 top-0 z-20 flex h-14 items-center justify-between border-b border-white/10 px-4 lg:hidden"
        style={{ backgroundColor: BLUE }}
      >
        <Link href="/dashboard" className="flex items-center gap-2">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-lg"
            style={{ backgroundColor: GREEN }}
          >
            <BarChart3 className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold text-white">
            Rank<span style={{ color: GREEN }}>BR</span>
          </span>
        </Link>
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-md p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <aside className="absolute inset-y-0 left-0 w-64">
            <SidebarContent {...props} onClose={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}
    </>
  );
}
