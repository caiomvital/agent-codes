"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase";

/* ─── brand ──────────────────────────────────────────────────────────────── */
const GREEN = "#00A651";
const BLUE  = "#003087";

/* ─── schema ─────────────────────────────────────────────────────────────── */
const schema = z
  .object({
    senha: z.string().min(8, "A senha deve ter pelo menos 8 caracteres."),
    confirmar: z.string().min(1, "Confirme a nova senha."),
  })
  .refine((data) => data.senha === data.confirmar, {
    message: "As senhas não coincidem.",
    path: ["confirmar"],
  });

type FormData = z.infer<typeof schema>;

/* ─── component ──────────────────────────────────────────────────────────── */
export default function RedefinirSenhaPage() {
  const router = useRouter();
  const [showSenha, setShowSenha] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

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
      const { error } = await supabase.auth.updateUser({
        password: data.senha,
      });

      if (error) {
        const m = error.message.toLowerCase();
        if (
          m.includes("expired") ||
          m.includes("invalid") ||
          m.includes("not found") ||
          m.includes("session")
        ) {
          setServerError("expired");
        } else {
          setServerError(
            "Não foi possível alterar a senha. Tente novamente."
          );
        }
        return;
      }

      setSucesso(true);
      // Redirect after a short delay so the user reads the success message.
      setTimeout(() => router.push("/dashboard"), 2500);
    } catch {
      setServerError("Ocorreu um erro inesperado. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Success state ─────────────────────────────────────────────────────── */
  if (sucesso) {
    return (
      <div className="w-full max-w-md text-center">
        <div
          className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full"
          style={{ backgroundColor: `${GREEN}18` }}
        >
          <CheckCircle2 className="h-8 w-8" style={{ color: GREEN }} />
        </div>
        <h1 className="text-2xl font-black" style={{ color: BLUE }}>
          Senha alterada com sucesso!
        </h1>
        <p className="mt-3 text-sm text-gray-500">
          Redirecionando para o seu painel…
        </p>
      </div>
    );
  }

  /* ── Expired / invalid token state ────────────────────────────────────── */
  if (serverError === "expired") {
    return (
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-black" style={{ color: BLUE }}>
          Link expirado
        </h1>
        <p className="mt-3 text-sm text-gray-500 leading-relaxed">
          Este link de redefinição de senha expirou ou já foi utilizado.
          Solicite um novo link para continuar.
        </p>
        <Link
          href="/esqueci-senha"
          className="mt-6 inline-block rounded-lg px-6 py-3 text-sm font-bold text-white"
          style={{ backgroundColor: GREEN }}
        >
          Solicitar novo link
        </Link>
        <p className="mt-4 text-sm text-gray-400">
          ou{" "}
          <Link href="/login" className="font-semibold" style={{ color: GREEN }}>
            voltar para o login
          </Link>
        </p>
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
        <Lock className="h-7 w-7" style={{ color: BLUE }} />
      </div>

      <h1 className="text-center text-2xl font-black" style={{ color: BLUE }}>
        Nova senha
      </h1>
      <p className="mt-2 text-center text-sm text-gray-500">
        Escolha uma senha segura para sua conta.
      </p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="mt-8 space-y-4"
      >
        {/* Nova senha */}
        <div className="space-y-1.5">
          <Label htmlFor="senha" className="text-gray-700">
            Nova senha
          </Label>
          <div className="relative">
            <Input
              id="senha"
              type={showSenha ? "text" : "password"}
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
              autoFocus
              disabled={isLoading}
              aria-invalid={!!errors.senha}
              className="pr-10"
              {...register("senha")}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              onClick={() => setShowSenha((v) => !v)}
              aria-label={showSenha ? "Ocultar senha" : "Mostrar senha"}
              tabIndex={-1}
            >
              {showSenha ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.senha && (
            <p className="flex items-center gap-1 text-xs text-red-500">
              <AlertCircle className="h-3 w-3" />
              {errors.senha.message}
            </p>
          )}
        </div>

        {/* Confirmar senha */}
        <div className="space-y-1.5">
          <Label htmlFor="confirmar" className="text-gray-700">
            Confirmar nova senha
          </Label>
          <div className="relative">
            <Input
              id="confirmar"
              type={showConfirmar ? "text" : "password"}
              placeholder="Repita a nova senha"
              autoComplete="new-password"
              disabled={isLoading}
              aria-invalid={!!errors.confirmar}
              className="pr-10"
              {...register("confirmar")}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              onClick={() => setShowConfirmar((v) => !v)}
              aria-label={showConfirmar ? "Ocultar senha" : "Mostrar senha"}
              tabIndex={-1}
            >
              {showConfirmar ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.confirmar && (
            <p className="flex items-center gap-1 text-xs text-red-500">
              <AlertCircle className="h-3 w-3" />
              {errors.confirmar.message}
            </p>
          )}
        </div>

        {serverError && serverError !== "expired" && (
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
              Salvando…
            </>
          ) : (
            "Salvar nova senha"
          )}
        </Button>
      </form>
    </div>
  );
}
