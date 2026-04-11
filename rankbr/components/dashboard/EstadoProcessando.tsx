"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, BarChart3, Search, Globe, Star, Brain } from "lucide-react";

const GREEN = "#00A651";
const BLUE  = "#003087";

const STEPS = [
  { icon: Globe,    label: "Verificando performance do site…" },
  { icon: Search,   label: "Analisando SEO básico…" },
  { icon: Star,     label: "Consultando Google Business…" },
  { icon: BarChart3,label: "Pesquisando palavras-chave…" },
  { icon: Brain,    label: "Gerando relatório com IA…" },
];

interface EstadoProcessandoProps {
  analiseId: string;
  /** When true, the API route /api/analise/iniciar must be called first */
  aguardando?: boolean;
}

export function EstadoProcessando({ analiseId, aguardando }: EstadoProcessandoProps) {
  const router       = useRouter();
  const initialized  = useRef(false);

  /* If status === "aguardando", kick off the analysis once */
  useEffect(() => {
    if (!aguardando || initialized.current) return;
    initialized.current = true;

    fetch("/api/analise/iniciar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ analiseId }),
    }).catch((err) => console.error("Erro ao iniciar análise:", err));
  }, [analiseId, aguardando]);

  /* Poll every 5 s by refreshing server component data */
  useEffect(() => {
    const id = setInterval(() => router.refresh(), 5000);
    return () => clearInterval(id);
  }, [router]);

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] lg:min-h-screen items-center justify-center p-6">
      <div className="mx-auto max-w-sm text-center">
        {/* Spinner */}
        <div
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full"
          style={{ backgroundColor: `${BLUE}15` }}
        >
          <Loader2 className="h-10 w-10 animate-spin" style={{ color: BLUE }} />
        </div>

        <h2 className="mb-1 text-xl font-bold text-gray-900">
          Analisando seu site
        </h2>
        <p className="mb-8 text-sm text-gray-500">
          Isso leva cerca de 2 minutos. Você pode fechar esta janela — vamos
          notificar quando estiver pronto.
        </p>

        {/* Steps list */}
        <ul className="space-y-3 text-left">
          {STEPS.map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="flex items-center gap-3 rounded-lg border border-gray-100 bg-white px-4 py-3 text-sm text-gray-600 shadow-sm"
            >
              <Icon className="h-4 w-4 shrink-0" style={{ color: GREEN }} />
              {label}
            </li>
          ))}
        </ul>

        <p className="mt-6 text-xs text-gray-400">
          Atualizando automaticamente…
        </p>
      </div>
    </div>
  );
}
