"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  User, Mail, Lock, Save, Loader2, Eye, EyeOff, AlertTriangle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase";

const GREEN = "#00A651";

// ─── Schemas ─────────────────────────────────────────────────────────────────

const nomeSchema = z.object({
  nome: z
    .string({ required_error: "O nome é obrigatório." })
    .min(2, "Mínimo de 2 caracteres.")
    .max(200, "Máximo de 200 caracteres.")
    .trim(),
});

const senhaSchema = z
  .object({
    senhaAtual: z.string().min(1, "Informe a senha atual."),
    novaSenha: z
      .string()
      .min(8, "A nova senha deve ter no mínimo 8 caracteres.")
      .max(72, "Máximo de 72 caracteres."),
    confirmarSenha: z.string().min(1, "Confirme a nova senha."),
  })
  .refine((d) => d.novaSenha === d.confirmarSenha, {
    message: "As senhas não coincidem.",
    path: ["confirmarSenha"],
  })
  .refine((d) => d.senhaAtual !== d.novaSenha, {
    message: "A nova senha deve ser diferente da atual.",
    path: ["novaSenha"],
  });

type NomeForm  = z.infer<typeof nomeSchema>;
type SenhaForm = z.infer<typeof senhaSchema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface ContaTabProps {
  userId: string;
  currentName: string;
  currentEmail: string;
}

// ─── Nome section ─────────────────────────────────────────────────────────────

function NomeSection({ currentName }: { currentName: string }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<NomeForm>({
    resolver: zodResolver(nomeSchema),
    defaultValues: { nome: currentName },
  });

  async function onSubmit(data: NomeForm) {
    const res = await fetch("/api/usuario", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: data.nome }),
    });
    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      toast({ title: "Erro ao salvar", description: json.error, variant: "destructive" });
      return;
    }
    toast({ title: "Nome atualizado!", variant: "success" } as any);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="nome" className="flex items-center gap-1.5 text-gray-700">
          <User className="h-3.5 w-3.5" style={{ color: GREEN }} />
          Nome completo
        </Label>
        <Input
          id="nome"
          placeholder="Seu nome completo"
          disabled={isSubmitting}
          {...register("nome")}
        />
        {errors.nome && (
          <p className="text-xs text-red-500">{errors.nome.message}</p>
        )}
      </div>

      <Button
        type="submit"
        disabled={isSubmitting || !isDirty}
        className="flex items-center gap-2 text-white"
        style={{ backgroundColor: GREEN }}
      >
        {isSubmitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        Salvar nome
      </Button>
    </form>
  );
}

// ─── Email section (read-only — requires support) ─────────────────────────────

function EmailSection({ email }: { email: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5 text-gray-700">
        <Mail className="h-3.5 w-3.5" style={{ color: GREEN }} />
        Email
      </Label>
      <Input value={email} readOnly disabled className="cursor-default bg-gray-50" />
      <p className="text-xs text-gray-400">
        Para alterar o email, entre em contato com o suporte em{" "}
        <a href="mailto:suporte@rankbr.com.br" className="underline hover:text-gray-600">
          suporte@rankbr.com.br
        </a>
        .
      </p>
    </div>
  );
}

// ─── Senha section ────────────────────────────────────────────────────────────

function SenhaSection() {
  const [showAtual, setShowAtual] = useState(false);
  const [showNova,  setShowNova]  = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SenhaForm>({
    resolver: zodResolver(senhaSchema),
  });

  async function onSubmit(data: SenhaForm) {
    const res = await fetch("/api/usuario/senha", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        senhaAtual: data.senhaAtual,
        novaSenha:  data.novaSenha,
      }),
    });
    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      toast({ title: "Erro ao alterar senha", description: json.error, variant: "destructive" });
      return;
    }
    toast({ title: "Senha alterada com sucesso!", variant: "success" } as any);
    reset();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Senha atual */}
      <div className="space-y-1.5">
        <Label htmlFor="senhaAtual" className="flex items-center gap-1.5 text-gray-700">
          <Lock className="h-3.5 w-3.5" style={{ color: GREEN }} />
          Senha atual
        </Label>
        <div className="relative">
          <Input
            id="senhaAtual"
            type={showAtual ? "text" : "password"}
            placeholder="Sua senha atual"
            disabled={isSubmitting}
            autoComplete="current-password"
            className="pr-10"
            {...register("senhaAtual")}
          />
          <button
            type="button"
            onClick={() => setShowAtual((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            tabIndex={-1}
          >
            {showAtual ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.senhaAtual && (
          <p className="text-xs text-red-500">{errors.senhaAtual.message}</p>
        )}
      </div>

      {/* Nova senha */}
      <div className="space-y-1.5">
        <Label htmlFor="novaSenha" className="text-gray-700">Nova senha</Label>
        <div className="relative">
          <Input
            id="novaSenha"
            type={showNova ? "text" : "password"}
            placeholder="Mínimo 8 caracteres"
            disabled={isSubmitting}
            autoComplete="new-password"
            className="pr-10"
            {...register("novaSenha")}
          />
          <button
            type="button"
            onClick={() => setShowNova((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            tabIndex={-1}
          >
            {showNova ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.novaSenha && (
          <p className="text-xs text-red-500">{errors.novaSenha.message}</p>
        )}
      </div>

      {/* Confirmar nova senha */}
      <div className="space-y-1.5">
        <Label htmlFor="confirmarSenha" className="text-gray-700">Confirmar nova senha</Label>
        <Input
          id="confirmarSenha"
          type="password"
          placeholder="Repita a nova senha"
          disabled={isSubmitting}
          autoComplete="new-password"
          {...register("confirmarSenha")}
        />
        {errors.confirmarSenha && (
          <p className="text-xs text-red-500">{errors.confirmarSenha.message}</p>
        )}
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        variant="outline"
        className="flex items-center gap-2"
      >
        {isSubmitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Lock className="h-4 w-4" />
        )}
        Alterar senha
      </Button>
    </form>
  );
}

// ─── Delete account ───────────────────────────────────────────────────────────

function ExcluirContaSection() {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading]       = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setLoading(true);
    try {
      const res = await fetch("/api/user/delete", { method: "DELETE" });
      if (res.ok) {
        router.push("/login?message=conta-excluida");
      } else {
        const json = await res.json().catch(() => ({}));
        toast({ title: "Erro ao excluir conta", description: json.error ?? "Tente novamente ou contate o suporte.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erro de conexão", description: "Verifique sua internet e tente novamente.", variant: "destructive" });
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  }

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-5">
      <div className="mb-3 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <h3 className="text-sm font-semibold text-red-700">Excluir conta</h3>
      </div>
      <p className="mb-4 text-xs leading-relaxed text-red-600">
        Todos os seus dados, análises e relatórios serão permanentemente removidos.
        Esta ação <strong>não pode ser desfeita</strong>.
      </p>
      {confirming ? (
        <div className="flex items-center gap-3">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Confirmar exclusão
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setConfirming(false)} disabled={loading}>
            Cancelar
          </Button>
        </div>
      ) : (
        <Button variant="destructive" size="sm" onClick={() => setConfirming(true)}>
          Excluir minha conta
        </Button>
      )}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function ContaTab({ currentName, currentEmail }: ContaTabProps) {
  return (
    <div className="space-y-8">
      <section>
        <h3 className="mb-1 text-sm font-semibold text-gray-900">Informações pessoais</h3>
        <p className="mb-4 text-xs text-gray-500">Dados de identificação na plataforma.</p>
        <div className="space-y-5">
          <NomeSection currentName={currentName} />
          <EmailSection email={currentEmail} />
        </div>
      </section>

      <Separator />

      <section>
        <h3 className="mb-1 text-sm font-semibold text-gray-900">Segurança</h3>
        <p className="mb-4 text-xs text-gray-500">Altere sua senha de acesso.</p>
        <SenhaSection />
      </section>

      <Separator />

      <section>
        <h3 className="mb-1 text-sm font-semibold text-red-600">Zona de perigo</h3>
        <p className="mb-4 text-xs text-gray-500">Ações irreversíveis. Prossiga com cuidado.</p>
        <ExcluirContaSection />
      </section>
    </div>
  );
}
