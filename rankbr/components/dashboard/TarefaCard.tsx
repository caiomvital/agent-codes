"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Circle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CategoriaTarefa } from "@/types";

const GREEN = "#00A651";

const CATEGORIA_LABEL: Record<CategoriaTarefa, string> = {
  seo:              "SEO",
  performance:      "Performance",
  google_business:  "Google Business",
  conteudo:         "Conteúdo",
  outro:            "Outro",
};

const PRIORIDADE_CONFIG: Record<string, { label: string; variant: "error" | "warning" | "info" | "secondary" }> = {
  alta:   { label: "Alta",   variant: "error"     },
  media:  { label: "Média",  variant: "warning"   },
  baixa:  { label: "Baixa",  variant: "info"      },
};

function getPrioridadeKey(prioridade: number): string {
  if (prioridade <= 3) return "alta";
  if (prioridade <= 6) return "media";
  return "baixa";
}

interface TarefaCardProps {
  id: string;
  titulo: string;
  descricao: string;
  categoria: CategoriaTarefa;
  prioridade: number;
  tempo_estimado: string;
  concluida: boolean;
}

export function TarefaCard({
  id,
  titulo,
  descricao,
  categoria,
  prioridade,
  tempo_estimado,
  concluida: initialConcluida,
}: TarefaCardProps) {
  const [concluida, setConcluida] = useState(initialConcluida);
  const [isPending, startTransition] = useTransition();

  const prioKey    = getPrioridadeKey(prioridade);
  const prioCfg    = PRIORIDADE_CONFIG[prioKey];

  function handleToggle() {
    const next = !concluida;
    // Optimistic update
    setConcluida(next);

    startTransition(async () => {
      const res = await fetch(`/api/tarefas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concluida: next }),
      });
      // Roll back on failure
      if (!res.ok) setConcluida(!next);
    });
  }

  return (
    <div
      className={cn(
        "rounded-xl border bg-white p-4 shadow-sm transition-opacity",
        concluida && "opacity-60",
        isPending && "pointer-events-none"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox toggle */}
        <button
          onClick={handleToggle}
          className="mt-0.5 shrink-0 transition-colors"
          aria-label={concluida ? "Marcar como não concluída" : "Marcar como concluída"}
        >
          {concluida ? (
            <CheckCircle2 className="h-5 w-5" style={{ color: GREEN }} />
          ) : (
            <Circle className="h-5 w-5 text-gray-300 hover:text-gray-400" />
          )}
        </button>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "text-sm font-semibold text-gray-900",
              concluida && "line-through text-gray-500"
            )}
          >
            {titulo}
          </p>
          <p className="mt-1 text-sm text-gray-500 leading-relaxed">{descricao}</p>

          {/* Meta badges */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {CATEGORIA_LABEL[categoria]}
            </Badge>
            <Badge variant={prioCfg.variant} className="text-xs">
              {prioCfg.label} prioridade
            </Badge>
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Clock className="h-3 w-3" />
              {tempo_estimado}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
