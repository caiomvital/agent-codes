"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Eye,
  EyeOff,
  BarChart3,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase";

/* ─── brand ──────────────────────────────────────────────────────────── */
const GREEN = "#00A651";
const BLUE = "#003087";

/* ─── schemas ────────────────────────────────────────────────────────── */
const loginSchema = z.object({
  email: z
    .string()
    .min(1, "O e-mail é obrigatório.")
    .email("Informe um e-mail válido."),
  senha: z.string().min(1, "A senha é obrigatória."),
});

const resetSchema = z.object({
  email: z
    .string()
    .min(1, "O e-mail é obrigatório.")
    .email("Informe um e-mail válido."),
});

type LoginFormData = z.infer<typeof loginSchema>;
type ResetFormData = z.infer<typeof resetSchema>;

/* ─── error messages in Portuguese ──────────────────────────────────── */
function parseSupabaseError(message: string): string {
  const m = message.toLowerCase();
  if (
    m.includes("invalid login credentials") ||
    m.includes("invalid email or password") ||
    m.includes("email not confirmed")
  ) {
    return "E-mail ou senha incorretos. Verifique seus dados e tente novamente.";
  }
  if (m.includes("email rate limit") || m.includes("too many requests")) {
    return "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.";
  }
  if (m.includes("user not found")) {
    return "Não existe conta com esse e-mail. Que tal criar uma?";
  }
  if (m.includes("network") || m.includes("fetch")) {
    return "Erro de conexão. Verifique sua internet e tente novamente.";
  }
  return "Ocorreu um erro ao fazer login. Tente novamente.";
}

/* ─── component ──────────────────────────────────────────────────────── */
export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectTo = searchParams.get("redirectTo") ?? "/dashboard";
  const urlError = searchParams.get("error");

  const [view, setView] = useState<"login" | "reset">("login");
  const [showSenha, setShowSenha] = useState(false);
  const [serverError, setServerError] = useState<string | null>(urlError);
  const [resetSent, setResetSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  /* login form */
  const {
    register: loginRegister,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  /* reset form */
  const {
    register: resetRegister,
    handleSubmit: handleResetSubmit,
    formState: { errors: resetErrors },
    getValues: getResetValues,
  } = useForm<ResetFormData>({ resolver: zodResolver(resetSchema) });

  /* ── handlers ─────────────────────────────────────────────────────── */
  const onLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    setServerError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.senha,
      });

      if (error) {
        setServerError(parseSupabaseError(error.message));
        return;
      }

      router.push(redirectTo);
      router.refresh();
    } catch {
      setServerError("Ocorreu um erro inesperado. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const onReset = async (data: ResetFormData) => {
    setIsLoading(true);
    setServerError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/api/auth/callback?next=/dashboard`,
      });

      if (error) {
        setServerError(parseSupabaseError(error.message));
        return;
      }

      setResetSent(true);
    } catch {
      setServerError("Ocorreu um erro inesperado. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  /* ─── reset — success state ──────────────────────────────────────── */
  if (view === "reset" && resetSent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-lg">
          <div
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: `${GREEN}18` }}
          >
            <CheckCircle2 className="h-8 w-8" style={{ color: GREEN }} />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: BLUE }}>
            E-mail enviado
          </h1>
          <p className="mt-3 text-sm text-gray-500">
            Enviamos um link para{" "}
            <strong>{getResetValues("email")}</strong>. Clique no link para
            redefinir sua senha.
          </p>
          <button
            className="mt-6 flex items-center gap-1 text-sm font-semibold mx-auto"
            style={{ color: GREEN }}
            onClick={() => {
              setView("login");
              setResetSent(false);
            }}
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para o login
          </button>
        </div>
      </div>
    );
  }

  /* ─── main layout ────────────────────────────────────────────────── */
  return (
    <div className="flex min-h-screen">
      {/* Left panel — brand */}
      <div
        className="hidden flex-col justify-between p-10 lg:flex lg:w-5/12"
        style={{
          background: `linear-gradient(160deg, ${BLUE} 0%, #00527a 60%, ${GREEN} 100%)`,
        }}
      >
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">RankBR</span>
        </Link>

        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-white/60">
            Bem-vindo de volta
          </p>
          <h2 className="mt-2 text-3xl font-black text-white leading-tight">
            Continue sua jornada para o topo do Google
          </h2>
          <p className="mt-4 text-white/70 leading-relaxed">
            Acesse seus relatórios, acompanhe a evolução do seu negócio e
            execute seu plano de ação.
          </p>
        </div>

        <p className="text-xs text-white/40">
          © {new Date().getFullYear()} RankBR. Todos os direitos reservados.
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 flex-col items-center justify-center bg-white p-6 sm:p-10">
        {/* Mobile logo */}
        <Link href="/" className="mb-8 flex items-center gap-2 lg:hidden">
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

        <div className="w-full max-w-md">
          {/* ── LOGIN VIEW ──────────────────────────────────────────── */}
          {view === "login" && (
            <>
              <h1 className="text-2xl font-black" style={{ color: BLUE }}>
                Entrar
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Não tem conta?{" "}
                <Link
                  href="/cadastro"
                  className="font-semibold"
                  style={{ color: GREEN }}
                >
                  Criar conta grátis
                </Link>
              </p>

              <form
                onSubmit={handleLoginSubmit(onLogin)}
                noValidate
                className="mt-6 space-y-4"
              >
                {/* Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-gray-700">
                    E-mail
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="maria@empresa.com.br"
                    autoComplete="email"
                    disabled={isLoading}
                    aria-invalid={!!loginErrors.email}
                    {...loginRegister("email")}
                  />
                  {loginErrors.email && (
                    <p className="flex items-center gap-1 text-xs text-red-500">
                      <AlertCircle className="h-3 w-3" />
                      {loginErrors.email.message}
                    </p>
                  )}
                </div>

                {/* Senha */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="senha" className="text-gray-700">
                      Senha
                    </Label>
                    <button
                      type="button"
                      className="text-xs font-semibold"
                      style={{ color: GREEN }}
                      onClick={() => {
                        setView("reset");
                        setServerError(null);
                      }}
                    >
                      Esqueci minha senha
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      id="senha"
                      type={showSenha ? "text" : "password"}
                      placeholder="Sua senha"
                      autoComplete="current-password"
                      disabled={isLoading}
                      aria-invalid={!!loginErrors.senha}
                      className="pr-10"
                      {...loginRegister("senha")}
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
                  {loginErrors.senha && (
                    <p className="flex items-center gap-1 text-xs text-red-500">
                      <AlertCircle className="h-3 w-3" />
                      {loginErrors.senha.message}
                    </p>
                  )}
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
                  disabled={isLoading}
                  className="w-full font-bold text-white"
                  style={{ backgroundColor: GREEN }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Entrando…
                    </>
                  ) : (
                    "Entrar"
                  )}
                </Button>
              </form>
            </>
          )}

          {/* ── RESET PASSWORD VIEW ──────────────────────────────────── */}
          {view === "reset" && (
            <>
              <button
                className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                onClick={() => {
                  setView("login");
                  setServerError(null);
                }}
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar para o login
              </button>

              <h1 className="text-2xl font-black" style={{ color: BLUE }}>
                Recuperar senha
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Informe seu e-mail e enviaremos um link para você criar uma
                nova senha.
              </p>

              <form
                onSubmit={handleResetSubmit(onReset)}
                noValidate
                className="mt-6 space-y-4"
              >
                <div className="space-y-1.5">
                  <Label htmlFor="reset-email" className="text-gray-700">
                    E-mail
                  </Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="maria@empresa.com.br"
                    autoComplete="email"
                    disabled={isLoading}
                    aria-invalid={!!resetErrors.email}
                    {...resetRegister("email")}
                  />
                  {resetErrors.email && (
                    <p className="flex items-center gap-1 text-xs text-red-500">
                      <AlertCircle className="h-3 w-3" />
                      {resetErrors.email.message}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
