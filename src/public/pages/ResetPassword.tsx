import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AlertCircle, CheckCircle2, Eye, EyeOff, KeyRound, Loader2, XCircle } from "lucide-react";
import http from "../../shared/api/http";
import FormCard from "@/components/patterns/FormCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function ResetPassword() {
  const [searchParams]  = useSearchParams();
  const navigate        = useNavigate();
  const token           = searchParams.get("token") ?? "";

  const [password,        setPassword]        = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword,    setShowPassword]     = useState(false);
  const [showConfirm,     setShowConfirm]      = useState(false);
  const [busy,            setBusy]             = useState(false);
  const [done,            setDone]             = useState(false);
  const [error,           setError]            = useState<string | null>(null);

  // Si no hay token en la URL, mostrar error inmediato
  const missingToken = !token;

  // Redirigir al login automáticamente tras el éxito
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => navigate("/login"), 4000);
    return () => clearTimeout(t);
  }, [done, navigate]);

  function validate(): string | null {
    if (password.length < 6) return "La contraseña debe tener al menos 6 caracteres.";
    if (password !== passwordConfirm) return "Las contraseñas no coinciden.";
    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setBusy(true);
    setError(null);
    try {
      await http.post("/auth/reset-password", {
        token,
        password,
        password_confirm: passwordConfirm,
      });
      setDone(true);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
        "Ocurrió un error. El enlace puede haber expirado."
      );
    } finally {
      setBusy(false);
    }
  }

  // ── Token ausente ──────────────────────────────────────────────────────────
  if (missingToken) {
    return (
      <FormCard
        icon={<XCircle size={22} className="text-destructive" />}
        title="Enlace inválido"
        description="El enlace de restablecimiento no es válido o ya fue utilizado."
      >
        <div className="flex justify-center">
          <Link to="/forgot-password" className="text-sm font-semibold text-primary hover:underline">
            Solicitar un nuevo enlace
          </Link>
        </div>
      </FormCard>
    );
  }

  // ── Éxito ─────────────────────────────────────────────────────────────────
  if (done) {
    return (
      <FormCard
        icon={<CheckCircle2 size={22} className="text-green-500" />}
        title="¡Contraseña actualizada!"
        description="Tu contraseña fue cambiada exitosamente. Hemos enviado una confirmación a tu correo. Serás redirigido al inicio de sesión en unos segundos…"
      >
        <div className="flex justify-center">
          <Link to="/login" className="text-sm font-semibold text-primary hover:underline">
            Ir al inicio de sesión →
          </Link>
        </div>
      </FormCard>
    );
  }

  // ── Formulario ─────────────────────────────────────────────────────────────
  return (
    <FormCard
      icon={<KeyRound size={22} />}
      title="Nueva contraseña"
      description="Elige una contraseña segura para tu cuenta."
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        {/* Nueva contraseña */}
        <div className="space-y-1.5">
          <Label htmlFor="password">Nueva contraseña</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-10"
              placeholder="Mínimo 6 caracteres"
              autoComplete="new-password"
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setShowPassword((v) => !v)}
              title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </Button>
          </div>
        </div>

        {/* Confirmar contraseña */}
        <div className="space-y-1.5">
          <Label htmlFor="passwordConfirm">Confirmar contraseña</Label>
          <div className="relative">
            <Input
              id="passwordConfirm"
              type={showConfirm ? "text" : "password"}
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              className="pr-10"
              placeholder="Repite la contraseña"
              autoComplete="new-password"
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setShowConfirm((v) => !v)}
              title={showConfirm ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </Button>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle size={15} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={busy}>
          {busy && <Loader2 size={15} className="animate-spin" />}
          {busy ? "Actualizando…" : "Cambiar contraseña"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          <Link to="/login" className="font-semibold text-primary hover:underline">
            ← Volver al inicio de sesión
          </Link>
        </p>
      </form>
    </FormCard>
  );
}
