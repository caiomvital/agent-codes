import Link from "next/link";
import { BarChart3 } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Acesse sua conta | RankBR",
    template: "%s | RankBR",
  },
};

const GREEN = "#00A651";
const BLUE  = "#003087";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Top bar */}
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex h-14 max-w-screen-xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-lg"
              style={{ backgroundColor: GREEN }}
            >
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold" style={{ color: BLUE }}>
              Rank<span style={{ color: GREEN }}>BR</span>
            </span>
          </Link>

          <p className="text-xs text-gray-400">
            Diagnóstico de marketing digital por R$10
          </p>
        </div>
      </header>

      {/* Page content */}
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-4 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} RankBR · Todos os direitos reservados
      </footer>
    </div>
  );
}
