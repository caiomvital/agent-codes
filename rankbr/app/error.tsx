"use client";

import { useEffect } from "react";
import Link from "next/link";
import { BarChart3, RefreshCw } from "lucide-react";

const GREEN = "#00A651";
const BLUE  = "#003087";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    const payload = JSON.stringify({
      level: "error",
      message: error.message,
      context: "GlobalError",
      digest: error.digest,
      timestamp: new Date().toISOString(),
    });
    console.error(payload);
  }, [error]);

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

      <p className="mb-4 text-5xl">⚠️</p>
      <h1 className="mb-2 text-2xl font-bold text-gray-900">Algo deu errado</h1>
      <p className="mb-2 max-w-sm text-gray-500">
        Ocorreu um erro inesperado. Nossa equipe foi notificada. Você pode
        tentar novamente ou voltar ao início.
      </p>

      {error.digest && (
        <p className="mb-6 text-xs text-gray-400">
          Código: <code className="rounded bg-gray-100 px-1">{error.digest}</code>
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: GREEN }}
        >
          <RefreshCw className="h-4 w-4" />
          Tentar novamente
        </button>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
        >
          Ir ao dashboard
        </Link>
      </div>
    </div>
  );
}
