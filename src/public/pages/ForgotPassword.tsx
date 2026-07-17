import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, CheckCircle2, KeyRound, Loader2 } from "lucide-react";
import http from "../../shared/api/http";
import FormCard from "@/components/patterns/FormCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function ForgotPassword() {
  const [email, setEmail]   = useState("");
  const [busy,  setBusy]    = useState(false);
  const [sent,  setSent]    = useState(false);
  const [error, setError]   = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await http.post("/auth/forgot-password", { email });
      setSent(true);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
        "Ocurrió un error. Intenta de nuevo más tarde."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <FormCard
      icon={<KeyRound size={22} />}
      title="Recuperar contraseña"
      description="Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña."
    >
      {sent ? (
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <CheckCircle2 size={52} className="text-green-500" />
          <p className="text-base font-semibold text-foreground">¡Correo enviado!</p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Si tu correo está registrado, recibirás un enlace para restablecer tu contraseña.
            Revisa también tu carpeta de spam.
          </p>
          <Link
            to="/login"
            className="mt-2 text-sm font-semibold text-primary hover:underline"
          >
            ← Volver al inicio de sesión
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@dominio.com"
              autoComplete="email"
              required
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={busy}>
            {busy && <Loader2 size={15} className="animate-spin" />}
            {busy ? "Enviando…" : "Enviar enlace de recuperación"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            <Link to="/login" className="font-semibold text-primary hover:underline">
              ← Volver al inicio de sesión
            </Link>
          </p>
        </form>
      )}
    </FormCard>
  );
}
