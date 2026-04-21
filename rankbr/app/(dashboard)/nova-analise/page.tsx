"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Globe,
  Building2,
  MapPin,
  Tag,
  AlertCircle,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SEGMENTOS, ESTADOS_BR, type Segmento } from "@/types";

/* ─── brand ──────────────────────────────────────────────────────────────── */
const GREEN = "#00A651";
const BLUE = "#003087";

/* ─── schema ─────────────────────────────────────────────────────────────── */
const novaAnaliseSchema = z.object({
  url: z
    .string()
    .min(1, "Informe a URL do site.")
    .url("URL inválida. Exemplo: https://meusite.com.br")
    .max(500),
  nomeNegocio: z
    .string()
    .min(2, "Informe o nome do negócio.")
    .max(200),
  segmento: z.enum(Object.keys(SEGMENTOS) as [Segmento, ...Segmento[]], {
    errorMap: () => ({ message: "Selecione um segmento." }),
  }),
  cidade: z.string().max(100).optional(),
  estado: z.string().length(2).optional(),
});

type NovaAnaliseFormData = z.infer<typeof novaAnaliseSchema>;

/* ─── helpers ────────────────────────────────────────────────────────────── */
function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="flex items-center gap-1 text-xs text-red-500">
      <AlertCircle className="h-3 w-3 shrink-0" />
      {message}
    </p>
  );
}

/* ─── page ───────────────────────────────────────────────────────────────── */
export default function NovaAnalisePage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NovaAnaliseFormData>({
    resolver: zodResolver(novaAnaliseSchema),
    defaultValues: { estado: "" },
  });

  const onSubmit = async (data: NovaAnaliseFormData) => {
    setIsLoading(true);
    setServerError(null);

    try {
      const res = await fetch("/api/pagamento/criar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok) {
        setServerError(
          json.error ?? "Erro ao iniciar o pagamento. Tente novamente."
        );
        return;
      }

      // Redirect the browser to Mercado Pago Checkout Pro.
      window.location.href = json.init_point;
    } catch {
      setServerError(
        "Erro de conexão. Verifique sua internet e tente novamente."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Content ──────────────────────────────────────────────────── */}
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {/* Back link — replaces the removed top bar */}
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao dashboard
        </Link>
        {/* Page header */}
        <div className="mb-8">
          <p
            className="mb-1 text-sm font-semibold uppercase tracking-widest"
            style={{ color: GREEN }}
          >
            Novo diagnóstico
          </p>
          <h1 className="text-2xl font-black sm:text-3xl" style={{ color: BLUE }}>
            Analise seu site por R$10
          </h1>
          <p className="mt-2 text-gray-500">
            Preencha os dados abaixo e você será redirecionado para o
            pagamento. Seu relatório chega em até 5 minutos.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* ── Form ───────────────────────────────────────────────── */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="space-y-5 lg:col-span-3"
          >
            {/* URL */}
            <div className="space-y-1.5">
              <Label htmlFor="url" className="flex items-center gap-1.5 text-gray-700">
                <Globe className="h-3.5 w-3.5" style={{ color: GREEN }} />
                URL do site
              </Label>
              <Input
                id="url"
                type="url"
                placeholder="https://meusite.com.br"
                disabled={isLoading}
                aria-invalid={!!errors.url}
                {...register("url")}
              />
              <FieldError message={errors.url?.message} />
            </div>

            {/* Nome do negócio */}
            <div className="space-y-1.5">
              <Label
                htmlFor="nomeNegocio"
                className="flex items-center gap-1.5 text-gray-700"
              >
                <Building2 className="h-3.5 w-3.5" style={{ color: GREEN }} />
                Nome do negócio
              </Label>
              <Input
                id="nomeNegocio"
                type="text"
                placeholder="Ex: Restaurante do João"
                disabled={isLoading}
                aria-invalid={!!errors.nomeNegocio}
                {...register("nomeNegocio")}
              />
              <FieldError message={errors.nomeNegocio?.message} />
            </div>

            {/* Segmento */}
            <div className="space-y-1.5">
              <Label
                htmlFor="segmento"
                className="flex items-center gap-1.5 text-gray-700"
              >
                <Tag className="h-3.5 w-3.5" style={{ color: GREEN }} />
                Segmento
              </Label>
              <select
                id="segmento"
                disabled={isLoading}
                aria-invalid={!!errors.segmento}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                {...register("segmento")}
              >
                <option value="">Selecione o segmento…</option>
                {(Object.entries(SEGMENTOS) as [Segmento, string][]).map(
                  ([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  )
                )}
              </select>
              <FieldError message={errors.segmento?.message} />
            </div>

            {/* Cidade + Estado */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label
                  htmlFor="cidade"
                  className="flex items-center gap-1.5 text-gray-700"
                >
                  <MapPin className="h-3.5 w-3.5" style={{ color: GREEN }} />
                  Cidade
                </Label>
                <Input
                  id="cidade"
                  type="text"
                  placeholder="São Paulo"
                  disabled={isLoading}
                  {...register("cidade")}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="estado" className="text-gray-700">
                  Estado (UF)
                </Label>
                <select
                  id="estado"
                  disabled={isLoading}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  {...register("estado")}
                >
                  <option value="">UF…</option>
                  {ESTADOS_BR.map(({ uf, nome }) => (
                    <option key={uf} value={uf}>
                      {uf} — {nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Server error */}
            {serverError && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {serverError}
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              disabled={isLoading}
              className="w-full text-base font-bold text-white"
              style={{ backgroundColor: GREEN }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Preparando pagamento…
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  Analisar por R$10
                </>
              )}
            </Button>

            <p className="text-center text-xs text-gray-400">
              Pagamento seguro via Mercado Pago · PIX ou cartão de crédito
            </p>
          </form>

          {/* ── Summary card ───────────────────────────────────────── */}
          <div className="lg:col-span-2">
            <div className="sticky top-20 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
                O que está incluído
              </p>

              <ul className="space-y-2.5">
                {[
                  "Análise de SEO (50+ critérios)",
                  "Velocidade e Core Web Vitals",
                  "Presença no Google Maps",
                  "Relatório de palavras-chave",
                  "Lista de ações priorizadas",
                  "Relatório em PDF",
                  "Entrega em até 5 minutos",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm">
                    <CheckCircle2
                      className="h-4 w-4 shrink-0"
                      style={{ color: GREEN }}
                    />
                    <span className="text-gray-600">{item}</span>
                  </li>
                ))}
              </ul>

              <div
                className="mt-5 rounded-xl p-4 text-center"
                style={{ backgroundColor: `${BLUE}08` }}
              >
                <p
                  className="text-3xl font-black"
                  style={{ color: BLUE }}
                >
                  R$10
                </p>
                <p className="text-xs text-gray-400">pagamento único</p>
              </div>

              <p className="mt-3 text-center text-xs text-gray-400">
                Sem assinatura · Sem renovação automática
              </p>
            </div>
          </div>
        </div>

        {/* ── Steps indicator ───────────────────────────────────────── */}
        <div className="mt-10 grid grid-cols-3 gap-2 text-center">
          {[
            { step: "1", label: "Preencha os dados", active: true },
            { step: "2", label: "Pague com segurança", active: false },
            { step: "3", label: "Receba o relatório", active: false },
          ].map(({ step, label, active }) => (
            <div key={step} className="flex flex-col items-center gap-1">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold"
                style={
                  active
                    ? { backgroundColor: GREEN, color: "white" }
                    : { backgroundColor: "#e5e7eb", color: "#9ca3af" }
                }
              >
                {step}
              </div>
              <p
                className="text-xs"
                style={{ color: active ? BLUE : "#9ca3af" }}
              >
                {label}
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
