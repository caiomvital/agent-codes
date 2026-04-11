"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, CheckCircle2, ArrowLeft, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase";
import type { Metadata } from "next";

/* ─── brand ──────────────────────────────────────────────────────────────── */
const GREEN = "#00A651";
const BLUE  = "#003087";

/* ─── schema ─────────────────────────────────────────────────────────────── */
const schema = z.object({
  email: z
    .string()
    .min(1, "O e-mail é obrigatório.")
    .email("Informe um e-mail válido."),
});

type FormData = z.infer<typeof schema>;

/* ─── component ──────────────────────────────────────────────────────────── */
export default function EsqueciSenhaPage() {
  const [emailEnviado, setEmailEnviado] = useState(false);
  const [emailUsado, setEmailUsado] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setServerError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/api/auth/callback?next=/redefinir-senha`,
      });

      // Only surface rate-limit errors; never reveal whether an email exists.
      if (error) {
        const m = error.message.toLowerCase();
        if (m.includes("rate limit") || m.includes("too many")) {
          setServerError(
            "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente."
          );
          return;
        }
      }

      setEmailUsado(data.email);
      setEmailEnviado(true);
    } catch {
      setServerError("Ocorreu um erro inesperado. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Success state ─────────────────────────────────────────────────────── */
  if (emailEnviado) {
    return (
      <div className="w-full max-w-md text-center">
        <div
          className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full"
          style={{ backgroundColor: `${GREEN}18` }}
        >
          <CheckCircle2 className="h-8 w-8" style={{ color: GREEN }} />
        </div>

        <h1 className="text-2xl font-black" style={{ color: BLUE }}>
          E-mail enviado!
        </h1>
        <p className="mt-3 text-sm text-gray-600 leading-relaxed">
          Enviamos um link para{" "}
          <strong className="text-gray-900">{emailUsado}</strong>. Verifique
          sua caixa de entrada e a pasta de spam.
        </p>
        <p className="mt-2 text-xs text-gray-400">
          O link expira em 1 hora. Se não chegar, aguarde alguns minutos e
          tente novamente.
        </p>

        <Link
          href="/login"
          className="mt-8 inline-flex items-center gap-1.5 text-sm font-semibold"
          style={{ color: GREEN }}
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para o login
        </Link>
      </div>
    );
  }

  /* ── Form ──────────────────────────────────────────────────────────────── */
  return (
    <div className="w-full max-w-md">
      {/* Icon */}
      <div
        className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full"
        style={{ backgroundColor: `${BLUE}12` }}
      >
        <Mail className="h-7 w-7" style={{ color: BLUE }} />
      </div>

      <h1 className="text-center text-2xl font-black" style={{ color: BLUE }}>
        Recuperar senha
      </h1>
      <p className="mt-2 text-center text-sm text-gray-500 leading-relaxed">
        Informe o e-mail da sua conta. Enviaremos um link para você
        criar uma nova senha.
      </p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="mt-8 space-y-4"
      >
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-gray-700">
            E-mail
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="maria@empresa.com.br"
            autoComplete="email"
            autoFocus
            disabled={isLoading}
            aria-invalid={!!errors.email}
            {...register("email")}
          />
          {errors.email && (
            <p className="flex items-center gap-1 text-xs text-red-500">
              <AlertCircle className="h-3 w-3" />
              {errors.email.message}
            </p>
          )}
        </div>

        {serverError && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {serverError}
          </div>
        )}

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full font-bold text-white"
          style={{ backgroundColor: GREEN }}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Enviando…
            </>
          ) : (
            "Enviar link de recuperação"
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Lembrou sua senha?{" "}
        <Link href="/login" className="font-semibold" style={{ color: GREEN }}>
          Voltar para o login
        </Link>
      </p>
    </div>
  );
}
