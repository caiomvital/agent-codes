"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw, AlertTriangle } from "lucide-react";

const GREEN = "#00A651";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("[DashboardError]", error);
  }, [error]);

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] lg:min-h-screen items-center justify-center p-6">
      <div className="mx-auto max-w-sm text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <AlertTriangle className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="mb-2 text-xl font-bold text-gray-900">Erro inesperado</h2>
        <p className="mb-6 text-sm text-gray-500 leading-relaxed">
          Ocorreu um problema ao carregar esta página. Você pode tentar novamente
          ou navegar para outra seção.
        </p>
        {error.digest && (
          <p className="mb-4 text-xs text-gray-400">
            ID: <code className="rounded bg-gray-100 px-1">{error.digest}</code>
          </p>
        )}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white"
            style={{ backgroundColor: GREEN }}
          >
            <RefreshCw className="h-4 w-4" />
            Tentar novamente
          </button>
          <Link
            href="/dashboard"
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
