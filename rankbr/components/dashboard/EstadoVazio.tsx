import Link from "next/link";
import { BarChart3, Plus } from "lucide-react";

const GREEN = "#00A651";
const BLUE  = "#003087";

export function EstadoVazio() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] lg:min-h-screen items-center justify-center p-6">
      <div className="mx-auto max-w-md text-center">
        {/* Illustration */}
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-blue-50">
          <BarChart3 className="h-12 w-12" style={{ color: BLUE }} />
        </div>

        <h1 className="mb-2 text-2xl font-bold text-gray-900">
          Bem-vindo ao RankBR!
        </h1>
        <p className="mb-8 text-gray-500 leading-relaxed">
          Você ainda não realizou nenhuma análise. Faça seu diagnóstico de
          marketing digital e descubra o que está travando o crescimento do
          seu negócio.
        </p>

        {/* Stats teaser */}
        <div className="mb-8 grid grid-cols-3 gap-4">
          {[
            { value: "7", label: "módulos avaliados" },
            { value: "10+", label: "tarefas geradas" },
            { value: "~2 min", label: "para concluir" },
          ].map(({ value, label }) => (
            <div key={label} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <p className="text-xl font-bold" style={{ color: GREEN }}>{value}</p>
              <p className="mt-0.5 text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        <Link
          href="/nova-analise"
          className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: GREEN }}
        >
          <Plus className="h-4 w-4" />
          Iniciar minha análise — R$&nbsp;10
        </Link>
      </div>
    </div>
  );
}
