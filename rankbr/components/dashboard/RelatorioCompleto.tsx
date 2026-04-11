"use client";

import { CheckCircle2, XCircle, TrendingUp, Globe, Search, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TarefaCard } from "@/components/dashboard/TarefaCard";
import type { ResultadoAnalise, CategoriaTarefa } from "@/types";

const GREEN = "#00A651";
const BLUE  = "#003087";

/* ── Score ring SVG ─────────────────────────────────────────────── */
function ScoreCircle({ score }: { score: number }) {
  const radius      = 54;
  const circumf     = 2 * Math.PI * radius;
  const strokeDash  = (score / 100) * circumf;
  const color       = score >= 70 ? GREEN : score >= 40 ? "#F59E0B" : "#EF4444";

  return (
    <svg width={140} height={140} viewBox="0 0 140 140" className="mx-auto">
      {/* Track */}
      <circle cx={70} cy={70} r={radius} fill="none" stroke="#E5E7EB" strokeWidth={12} />
      {/* Progress */}
      <circle
        cx={70} cy={70} r={radius}
        fill="none"
        stroke={color}
        strokeWidth={12}
        strokeLinecap="round"
        strokeDasharray={`${strokeDash} ${circumf}`}
        transform="rotate(-90 70 70)"
      />
      {/* Label */}
      <text x={70} y={64} textAnchor="middle" fontSize={32} fontWeight={700} fill={color}>
        {score}
      </text>
      <text x={70} y={84} textAnchor="middle" fontSize={12} fill="#6B7280">
        /100
      </text>
    </svg>
  );
}

/* ── Module score card ───────────────────────────────────────────── */
function ModuleScore({
  icon: Icon,
  label,
  score,
  color,
}: {
  icon: React.ElementType;
  label: string;
  score: number;
  color: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" style={{ color }} />
          <span className="text-sm font-medium text-gray-700">{label}</span>
        </div>
        <span className="text-sm font-bold" style={{ color }}>{score}</span>
      </div>
      <Progress value={score} className="h-1.5" />
    </div>
  );
}

/* ── DB Tarefa row type ──────────────────────────────────────────── */
interface TarefaRow {
  id: string;
  titulo: string;
  descricao: string;
  categoria: CategoriaTarefa;
  prioridade: number;
  tempo_estimado: string;
  concluida: boolean;
}

interface RelatorioCompletoProps {
  resultado: ResultadoAnalise;
  tarefas: TarefaRow[];
  nomeSite: string;
  urlSite: string;
}

export function RelatorioCompleto({
  resultado,
  tarefas,
  nomeSite,
  urlSite,
}: RelatorioCompletoProps) {
  const { score_geral, score_performance, score_seo, score_business, relatorio } = resultado;

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Relatório de diagnóstico</h1>
        <p className="mt-1 text-sm text-gray-500">
          {nomeSite} &mdash;{" "}
          <a
            href={urlSite}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-gray-700"
          >
            {urlSite}
          </a>
        </p>
      </div>

      {/* ── Score geral + módulos ── */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Score circle */}
        <Card className="flex flex-col items-center justify-center py-8">
          <CardHeader className="pb-2 text-center">
            <CardTitle className="text-base">Score Geral</CardTitle>
          </CardHeader>
          <CardContent>
            <ScoreCircle score={score_geral} />
            <p className="mt-4 text-center text-sm text-gray-500 leading-relaxed px-4">
              {relatorio.resumo_executivo}
            </p>
          </CardContent>
        </Card>

        {/* Module scores */}
        <div className="space-y-3">
          <ModuleScore
            icon={Globe}
            label="Performance"
            score={score_performance}
            color="#3B82F6"
          />
          <ModuleScore
            icon={Search}
            label="SEO"
            score={score_seo}
            color={GREEN}
          />
          <ModuleScore
            icon={Star}
            label="Google Business"
            score={score_business}
            color="#F59E0B"
          />
        </div>
      </div>

      {/* ── Strengths & problems ── */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Pontos fortes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="h-4 w-4" style={{ color: GREEN }} />
              Pontos fortes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {relatorio.pontos_fortes.map((ponto, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span
                    className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                    style={{ backgroundColor: GREEN }}
                  >
                    {i + 1}
                  </span>
                  {ponto}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Problemas críticos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <XCircle className="h-4 w-4 text-red-500" />
              Problemas críticos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {relatorio.problemas_criticos.map((problema, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-red-100 text-[10px] font-bold text-red-600">
                    {i + 1}
                  </span>
                  {problema}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* ── Plano de ação ── */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5" style={{ color: BLUE }} />
          <h2 className="text-lg font-bold text-gray-900">Plano de ação</h2>
          <span className="ml-auto text-sm text-gray-400">
            {tarefas.filter((t) => t.concluida).length}/{tarefas.length} concluídas
          </span>
        </div>

        <div className="space-y-3">
          {tarefas.map((tarefa) => (
            <TarefaCard key={tarefa.id} {...tarefa} />
          ))}
        </div>
      </div>
    </div>
  );
}
