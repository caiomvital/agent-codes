import Link from "next/link";
import { BarChart3, Home } from "lucide-react";

const GREEN = "#00A651";
const BLUE  = "#003087";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6 text-center">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ backgroundColor: GREEN }}
        >
          <BarChart3 className="h-5 w-5 text-white" />
        </div>
        <span className="text-xl font-bold" style={{ color: BLUE }}>
          Rank<span style={{ color: GREEN }}>BR</span>
        </span>
      </Link>

      <p className="mb-2 text-6xl font-black" style={{ color: BLUE }}>404</p>
      <h1 className="mb-2 text-2xl font-bold text-gray-900">Página não encontrada</h1>
      <p className="mb-8 max-w-sm text-gray-500">
        O endereço que você tentou acessar não existe ou foi movido.
      </p>

      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        style={{ backgroundColor: GREEN }}
      >
        <Home className="h-4 w-4" />
        Ir para o dashboard
      </Link>
    </div>
  );
}
