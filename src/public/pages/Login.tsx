import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AlertCircle, Loader2, LogIn } from "lucide-react";
import { useAuth } from "../../shared/auth/useAuth";

export default function Login() {
  const nav = useNavigate();
  const loc = useLocation();
  const { login } = useAuth();

  const from = (loc.state as any)?.from ?? "/admin";

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [busy,     setBusy]     = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login({ email, password });
      nav(from, { replace: true });
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
    <div style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        padding: "40px 36px",
        maxWidth: 420,
        width: "100%",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <LogIn size={22} style={{ color: "var(--color-primary)" }} />
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.4rem", color: "var(--color-text)" }}>
            Iniciar sesión
          </h1>
        </div>
        <p style={{ color: "var(--color-text-muted)", fontSize: ".88rem", marginBottom: 28 }}>
          Accede con tu cuenta para ver el contenido exclusivo.
        </p>

        <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={labelStyle}>Correo electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              placeholder="correo@dominio.com"
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label style={labelStyle}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
              autoComplete="current-password"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div style={{
              display: "flex", alignItems: "flex-start", gap: 8,
              background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.25)",
              borderRadius: "var(--radius-md)", padding: "10px 14px",
              color: "#ef4444", fontSize: ".85rem", lineHeight: 1.5,
            }}>
              <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            style={{
              background: "var(--color-primary)", color: "#fff",
              border: "none", borderRadius: "var(--radius-md)",
              padding: "11px 0", fontWeight: 600, fontSize: ".92rem",
              cursor: busy ? "not-allowed" : "pointer",
              opacity: busy ? .7 : 1,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "opacity .15s",
            }}
          >
            {busy && <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />}
            {busy ? "Verificando…" : "Entrar"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: ".85rem", color: "var(--color-text-muted)" }}>
          ¿No tienes cuenta?{" "}
          <Link to="/register" style={{ color: "var(--color-primary)", fontWeight: 600, textDecoration: "none" }}>
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: ".82rem",
  fontWeight: 600,
  color: "var(--color-text-muted)",
  marginBottom: 5,
  letterSpacing: ".01em",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  background: "var(--color-bg-muted)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-md)",
  padding: "9px 12px",
  fontSize: ".9rem",
  color: "var(--color-text)",
  fontFamily: "var(--font-body)",
  outline: "none",
};
