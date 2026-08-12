import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Eye, EyeOff, GraduationCap, Loader2, Lock, Mail } from "lucide-react";
import { useAuth } from "../../../store/auth.store";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";
import { Button } from "@/presentation/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/presentation/components/ui/card";

/**
 * Minimal, standalone login screen used exclusively for the Safe Exam Browser
 * (SEB) exam flow. Deliberately NOT rendered inside `PublicLayout`: no nav
 * links to any other section of the platform, only a bare header/footer.
 * Uses the same credentials/`login()` action as the regular Login page, but
 * on success redirects straight into the student's active exam (never to
 * `/playground` or `/admin`). If the account has no active exam, the login
 * is rolled back (logout) so this screen can't be used as a side door into
 * the rest of the platform.
 */
export default function ExamLogin() {
  const nav = useNavigate();
  const { login, logout } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login({ email, password });
      const activeExam = useAuth.getState().activeExam;
      if (!activeExam) {
        await logout();
        setError("No tienes un examen activo asignado en este momento.");
        return;
      }
      nav(`/playground/${activeExam.id}`, { replace: true });
    } catch (err: any) {
      const msg =
        err?.message ??
        err?.response?.data?.message ??
        "Credenciales incorrectas.";
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex items-center gap-2 px-6 py-4 border-b border-border">
        <GraduationCap size={20} className="text-primary" />
        <span className="font-display font-semibold">Acceso al examen</span>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="items-center text-center">
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <GraduationCap size={22} />
            </div>
            <CardTitle className="font-display text-xl">Iniciar examen</CardTitle>
            <CardDescription>Ingresa con tu cuenta para comenzar tu examen.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={onSubmit} className="flex flex-col gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Correo electrónico</Label>
                <div className="relative">
                  <Mail size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    placeholder="correo@dominio.com"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Lock size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-10"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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
                {busy ? "Verificando…" : "Entrar al examen"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>

      <footer className="px-6 py-4 text-center text-xs text-muted-foreground border-t border-border">
        Acceso exclusivo para rendir tu examen.
      </footer>
    </div>
  );
}
