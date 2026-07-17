import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle, AlertCircle, Loader2, UserPlus } from "lucide-react";
import http from "../../shared/api/http";
import FormCard from "@/components/patterns/FormCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function Register() {
  const [firstName, setFirstName]           = useState("");
  const [lastName,  setLastName]            = useState("");
  const [email,     setEmail]               = useState("");
  const [password,  setPassword]            = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [busy,      setBusy]                = useState(false);
  const [error,     setError]               = useState<string | null>(null);
  const [success,   setSuccess]             = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== passwordConfirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setBusy(true);
    setError(null);

    try {
      await http.post("/register", {
        first_name:       firstName,
        last_name:        lastName,
        email,
        password,
        password_confirm: passwordConfirm,
      });
      setSuccess(true);
    } catch (err: any) {
      const data = err?.response?.data;
      const msg =
        data?.message ?? data?.detail ??
        (typeof data === "object" ? Object.values(data).flat().join(" · ") : null) ??
        "No fue posible completar el registro. Intenta nuevamente.";
      setError(Array.isArray(msg) ? msg.join(" · ") : msg);
    } finally {
      setBusy(false);
    }
  }

  // ── Pantalla de éxito ──────────────────────────────────────────────────────
  if (success) {
    return (
      <FormCard
        icon={<CheckCircle size={22} className="text-green-500" />}
        title="¡Solicitud enviada!"
        description="Tu cuenta ha sido creada exitosamente. Un administrador revisará tu solicitud y recibirás acceso una vez que sea aprobada."
      >
        <div className="rounded-md border border-border bg-muted p-4 text-center text-sm text-muted-foreground">
          Mientras tanto, puedes explorar el contenido público del sitio.
        </div>

        <div className="flex justify-center gap-3">
          <Button asChild>
            <Link to="/">Ir al inicio</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/login">Iniciar sesión</Link>
          </Button>
        </div>
      </FormCard>
    );
  }

  // ── Formulario ─────────────────────────────────────────────────────────────
  return (
    <FormCard
      icon={<UserPlus size={22} />}
      title="Crear cuenta"
      description="Completa el formulario. Tu solicitud será revisada por el administrador antes de activarse."
      footer={
        <>
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Iniciar sesión
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="firstName">Nombre</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Francisco"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lastName">Apellido</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Higuera"
              required
            />
          </div>
        </div>

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

        <div className="space-y-1.5">
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            minLength={6}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="passwordConfirm">Confirmar contraseña</Label>
          <Input
            id="passwordConfirm"
            type="password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            autoComplete="new-password"
            minLength={6}
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
          {busy ? "Enviando solicitud…" : "Crear cuenta"}
        </Button>
      </form>
    </FormCard>
  );
}
