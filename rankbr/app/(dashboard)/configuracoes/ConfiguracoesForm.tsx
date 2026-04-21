"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { User, Mail, Save, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase";

const GREEN = "#00A651";

interface ConfiguracoesFormProps {
  userId: string;
  currentName: string;
  currentEmail: string;
}

type AlertState = { type: "success" | "error"; message: string } | null;

export function ConfiguracoesForm({
  userId,
  currentName,
  currentEmail,
}: ConfiguracoesFormProps) {
  const router = useRouter();

  /* ── Name update ── */
  const [name, setName]           = useState(currentName);
  const [nameAlert, setNameAlert] = useState<AlertState>(null);
  const [savingName, setSavingName] = useState(false);

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || name.trim() === currentName) return;
    setSavingName(true);
    setNameAlert(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        data: { name: name.trim() },
      });

      if (error) throw error;

      // Also update our public users table
      await fetch("/api/user/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      setNameAlert({ type: "success", message: "Nome atualizado com sucesso!" });
      router.refresh();
    } catch (err) {
      setNameAlert({
        type: "error",
        message: err instanceof Error ? err.message : "Erro ao atualizar nome.",
      });
    } finally {
      setSavingName(false);
    }
  }

  /* ── Password update ── */
  const [newPassword, setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwAlert, setPwAlert]             = useState<AlertState>(null);
  const [savingPw, setSavingPw]           = useState(false);

  async function handleSavePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwAlert(null);

    if (newPassword.length < 8) {
      setPwAlert({ type: "error", message: "A senha deve ter no mínimo 8 caracteres." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwAlert({ type: "error", message: "As senhas não coincidem." });
      return;
    }

    setSavingPw(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setNewPassword("");
      setConfirmPassword("");
      setPwAlert({ type: "success", message: "Senha alterada com sucesso!" });
    } catch (err) {
      setPwAlert({
        type: "error",
        message: err instanceof Error ? err.message : "Erro ao alterar senha.",
      });
    } finally {
      setSavingPw(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* ── Profile section ── */}
      <section>
        <h2 className="mb-1 text-base font-semibold text-gray-900">Perfil</h2>
        <p className="mb-4 text-sm text-gray-500">
          Seus dados de identificação na plataforma.
        </p>

        <form onSubmit={handleSaveName} className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name" className="flex items-center gap-1.5 text-gray-700">
              <User className="h-3.5 w-3.5" style={{ color: GREEN }} />
              Nome
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome completo"
              maxLength={200}
              disabled={savingName}
            />
          </div>

          {/* Email (read-only) */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-gray-700">
              <Mail className="h-3.5 w-3.5" style={{ color: GREEN }} />
              Email
            </Label>
            <Input value={currentEmail} readOnly disabled className="cursor-default bg-gray-50" />
            <p className="text-xs text-gray-400">
              O email não pode ser alterado diretamente. Entre em contato com o suporte.
            </p>
          </div>

          <Alert state={nameAlert} />

          <Button
            type="submit"
            disabled={savingName || !name.trim() || name.trim() === currentName}
            className="flex items-center gap-2 text-white"
            style={{ backgroundColor: GREEN }}
          >
            {savingName ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Salvar nome
          </Button>
        </form>
      </section>

      <Separator />

      {/* ── Password section ── */}
      <section>
        <h2 className="mb-1 text-base font-semibold text-gray-900">Alterar senha</h2>
        <p className="mb-4 text-sm text-gray-500">
          Deixe em branco caso não queira alterar.
        </p>

        <form onSubmit={handleSavePassword} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="newPassword" className="text-gray-700">Nova senha</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              disabled={savingPw}
              autoComplete="new-password"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword" className="text-gray-700">Confirmar senha</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita a nova senha"
              disabled={savingPw}
              autoComplete="new-password"
            />
          </div>

          <Alert state={pwAlert} />

          <Button
            type="submit"
            disabled={savingPw || !newPassword}
            variant="outline"
            className="flex items-center gap-2"
          >
            {savingPw ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Alterar senha
          </Button>
        </form>
      </section>

      <Separator />

      {/* ── Danger zone ── */}
      <section>
        <h2 className="mb-1 text-base font-semibold text-red-600">Zona de perigo</h2>
        <p className="mb-4 text-sm text-gray-500">
          Ações irreversíveis. Prossiga com cuidado.
        </p>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="mb-3 text-sm font-medium text-red-700">Excluir conta</p>
          <p className="mb-4 text-xs text-red-600 leading-relaxed">
            Ao excluir sua conta, todos os seus dados, análises e relatórios
            serão permanentemente removidos. Esta ação não pode ser desfeita.
          </p>
          <DeleteAccountButton />
        </div>
      </section>
    </div>
  );
}

/* ── Alert banner ─────────────────────────────────────────────────────────── */
function Alert({ state }: { state: AlertState }) {
  if (!state) return null;
  const isSuccess = state.type === "success";
  return (
    <div
      className={`flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm ${
        isSuccess
          ? "border-green-200 bg-green-50 text-green-700"
          : "border-red-200 bg-red-50 text-red-700"
      }`}
    >
      {isSuccess ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
      ) : (
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      )}
      {state.message}
    </div>
  );
}

/* ── Delete account button (confirm dialog) ───────────────────────────────── */
function DeleteAccountButton() {
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
        toast.error("Erro ao excluir conta", json.error ?? "Entre em contato com o suporte.");
      }
    } catch {
      toast.error("Erro de conexão", "Verifique sua internet e tente novamente.");
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
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
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setConfirming(false)}
          disabled={loading}
        >
          Cancelar
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={() => setConfirming(true)}
    >
      Excluir minha conta
    </Button>
  );
}
