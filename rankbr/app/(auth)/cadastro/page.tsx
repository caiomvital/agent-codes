"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, BarChart3, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase";

/* ─── brand ──────────────────────────────────────────────────────────── */
const GREEN = "#00A651";
const BLUE = "#003087";

/* ─── validation schema ──────────────────────────────────────────────── */
const cadastroSchema = z
  .object({
    nome: z
      .string()
      .min(2, "O nome deve ter pelo menos 2 caracteres.")
      .max(100, "O nome deve ter no máximo 100 caracteres."),
    email: z
      .string()
      .min(1, "O e-mail é obrigatório.")
      .email("Informe um e-mail válido."),
    senha: z
      .string()
      .min(8, "A senha deve ter pelo menos 8 caracteres.")
      .regex(/[0-9]/, "A senha deve conter pelo menos um número.")
      .regex(/[a-zA-Z]/, "A senha deve conter pelo menos uma letra."),
    confirmarSenha: z.string().min(1, "Confirme sua senha."),
  })
  .refine((data) => data.senha === data.confirmarSenha, {
    message: "As senhas não coincidem.",
    path: ["confirmarSenha"],
  });

type CadastroFormData = z.infer<typeof cadastroSchema>;

/* ─── error messages in Portuguese ──────────────────────────────────── */
function parseSupabaseError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("user already registered") || m.includes("already exists")) {
    return "Este e-mail já está cadastrado. Tente fazer login.";
  }
  if (m.includes("invalid email")) {
    return "E-mail inválido.";
  }
  if (m.includes("password should be at least")) {
    return "A senha deve ter pelo menos 6 caracteres.";
  }
  if (m.includes("signup is disabled")) {
    return "O cadastro está temporariamente desabilitado. Tente novamente mais tarde.";
  }
  if (m.includes("email rate limit")) {
    return "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.";
  }
  return "Ocorreu um erro ao criar sua conta. Tente novamente.";
}

/* ─── component ──────────────────────────────────────────────────────── */
export default function CadastroPage() {
  const router = useRouter();
  const [showSenha, setShowSenha] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CadastroFormData>({
    resolver: zodResolver(cadastroSchema),
  });

  const onSubmit = async (data: CadastroFormData) => {
    setIsLoading(true);
    setServerError(null);

    try {
      const supabase = createClient();

      // 1. Create auth user — name stored in metadata for the callback to use.
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.senha,
        options: {
          data: { name: data.nome, full_name: data.nome },
          // After email confirmation the browser lands on /api/auth/callback
          // which creates the users table record and redirects to /dashboard.
          emailRedirectTo: `${window.location.origin}/api/auth/callback?next=/dashboard`,
        },
      });

      if (signUpError) {
        setServerError(parseSupabaseError(signUpError.message));
        return;
      }

      if (!authData.user) {
        setServerError("Não foi possível criar a conta. Tente novamente.");
        return;
      }

      // 2a. Email confirmation DISABLED → user gets a session immediately.
      if (authData.session) {
        // Create the public.users record.
        // Requires RLS: CREATE POLICY "Users can insert own profile"
        //   ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
        await supabase.from("users").upsert(
          {
            id: authData.user.id,
            email: authData.user.email,
            name: data.nome,
            role: "user",
            created_at: new Date().toISOString(),
          },
          { onConflict: "id", ignoreDuplicates: true }
        );

        router.push("/dashboard");
        return;
      }

      // 2b. Email confirmation ENABLED → session is null, show instructions.
      setEmailSent(true);
    } catch {
      setServerError("Ocorreu um erro inesperado. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  /* ── email sent state ────────────────────────────────────────────── */
  if (emailSent) {
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
            Verifique seu e-mail
          </h1>
          <p className="mt-3 text-sm text-gray-500">
            Enviamos um link de confirmação para o seu e-mail. Clique no link
            para ativar sua conta e acessar o dashboard.
          </p>
          <p className="mt-4 text-xs text-gray-400">
            Não recebeu?{" "}
            <button
              className="font-semibold underline"
              style={{ color: GREEN }}
              onClick={() => setEmailSent(false)}
            >
              Tentar novamente
            </button>
          </p>
        </div>
      </div>
    );
  }

  /* ── main form ───────────────────────────────────────────────────── */
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
            Comece agora
          </p>
          <h2 className="mt-2 text-3xl font-black text-white leading-tight">
            Descubra o que seu negócio precisa para crescer online
          </h2>
          <p className="mt-4 text-white/70 leading-relaxed">
            Diagnóstico completo de marketing digital com IA. Em até 5 minutos
            você sabe exatamente o que fazer para aparecer no Google.
          </p>

          <div className="mt-8 space-y-3">
            {[
              "Análise de SEO em 50+ critérios",
              "Plano de ação priorizado por IA",
              "Relatório profissional em PDF",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-white/80" />
                <span className="text-sm text-white/80">{item}</span>
              </div>
            ))}
          </div>
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
          <h1 className="text-2xl font-black" style={{ color: BLUE }}>
            Criar conta
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Já tem conta?{" "}
            <Link
              href="/login"
              className="font-semibold"
              style={{ color: GREEN }}
            >
              Entrar
            </Link>
          </p>

          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="mt-6 space-y-4"
          >
            {/* Nome */}
            <div className="space-y-1.5">
              <Label htmlFor="nome" className="text-gray-700">
                Nome completo
              </Label>
              <Input
                id="nome"
                type="text"
                placeholder="Maria Silva"
                autoComplete="name"
                disabled={isLoading}
                aria-invalid={!!errors.nome}
                {...register("nome")}
              />
              {errors.nome && (
                <p className="flex items-center gap-1 text-xs text-red-500">
                  <AlertCircle className="h-3 w-3" />
                  {errors.nome.message}
                </p>
              )}
            </div>

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

            {/* Senha */}
            <div className="space-y-1.5">
              <Label htmlFor="senha" className="text-gray-700">
                Senha
              </Label>
              <div className="relative">
                <Input
                  id="senha"
                  type={showSenha ? "text" : "password"}
                  placeholder="Mínimo 8 caracteres"
                  autoComplete="new-password"
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
              <Label htmlFor="confirmarSenha" className="text-gray-700">
                Confirmar senha
              </Label>
              <div className="relative">
                <Input
                  id="confirmarSenha"
                  type={showConfirmar ? "text" : "password"}
                  placeholder="Repita a senha"
                  autoComplete="new-password"
                  disabled={isLoading}
                  aria-invalid={!!errors.confirmarSenha}
                  className="pr-10"
                  {...register("confirmarSenha")}
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
              {errors.confirmarSenha && (
                <p className="flex items-center gap-1 text-xs text-red-500">
                  <AlertCircle className="h-3 w-3" />
                  {errors.confirmarSenha.message}
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
                  Criando conta…
                </>
              ) : (
                "Criar conta grátis"
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-400">
            Ao criar uma conta você concorda com os{" "}
            <Link href="/termos" className="underline hover:text-gray-600">
              Termos de uso
            </Link>{" "}
            e a{" "}
            <Link href="/privacidade" className="underline hover:text-gray-600">
              Política de privacidade
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
