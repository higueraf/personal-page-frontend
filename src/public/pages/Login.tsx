import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AlertCircle, Loader2, LogIn, Eye, EyeOff } from "lucide-react";
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
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

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

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    setError(null);
    try {
      // Redirigir a Google OAuth
      window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
    } catch (err: any) {
      setError("Error al iniciar sesión con Google");
      setGoogleLoading(false);
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

        {/* Botón de Google */}
        <button
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          style={{
            width: "100%",
            background: "#fff",
            color: "#000",
            border: "1px solid #dadce0",
            borderRadius: "var(--radius-md)",
            padding: "10px 0",
            fontWeight: 500,
            fontSize: ".9rem",
            cursor: googleLoading ? "not-allowed" : "pointer",
            opacity: googleLoading ? 0.7 : 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            marginBottom: 20,
            transition: "all 0.2s",
          }}
          onMouseOver={(e) => {
            if (!googleLoading) {
              e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
              e.currentTarget.style.backgroundColor = "#f8f9fa";
            }
          }}
          onMouseOut={(e) => {
            if (!googleLoading) {
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.backgroundColor = "#fff";
            }
          }}
        >
          {googleLoading ? (
            <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          {googleLoading ? "Conectando con Google..." : "Continuar con Google"}
        </button>

        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          margin: "20px 0",
          color: "var(--color-text-muted)",
          fontSize: ".85rem"
        }}>
          <div style={{ flex: 1, height: "1px", background: "var(--color-border)" }}></div>
          <span style={{ padding: "0 12px" }}>O</span>
          <div style={{ flex: 1, height: "1px", background: "var(--color-border)" }}></div>
        </div>

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
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  ...inputStyle,
                  paddingRight: "40px"
                }}
                autoComplete="current-password"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "var(--color-text-muted)",
                  cursor: "pointer",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
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
