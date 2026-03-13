import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle, AlertCircle, Loader2, UserPlus } from "lucide-react";
import http from "../../shared/api/http";

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
      <div style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        <div style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          padding: "52px 44px",
          maxWidth: 460,
          width: "100%",
          textAlign: "center",
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: "rgba(34,197,94,.12)",
            border: "1.5px solid rgba(34,197,94,.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 24px",
          }}>
            <CheckCircle size={30} style={{ color: "#22c55e" }} />
          </div>

          <h2 style={{
            fontFamily: "var(--font-display)", fontWeight: 700,
            fontSize: "1.45rem", color: "var(--color-text)", marginBottom: 12,
          }}>
            ¡Solicitud enviada!
          </h2>

          <p style={{
            color: "var(--color-text-muted)", lineHeight: 1.7,
            fontSize: ".93rem", marginBottom: 28, maxWidth: 360, margin: "0 auto 28px",
          }}>
            Tu cuenta ha sido creada exitosamente. Un administrador revisará tu
            solicitud y recibirás acceso una vez que sea aprobada.
          </p>

          <div style={{
            background: "var(--color-bg-muted)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            padding: "14px 18px",
            fontSize: ".85rem",
            color: "var(--color-text-muted)",
            lineHeight: 1.6,
            marginBottom: 28,
          }}>
            Mientras tanto, puedes explorar el contenido público del sitio.
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <Link
              to="/"
              style={{
                background: "var(--color-primary)", color: "#fff",
                borderRadius: "var(--radius-md)", padding: "10px 22px",
                fontWeight: 600, fontSize: ".9rem", textDecoration: "none",
              }}
            >
              Ir al inicio
            </Link>
            <Link
              to="/login"
              style={{
                background: "var(--color-bg-muted)", color: "var(--color-text)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)", padding: "10px 22px",
                fontSize: ".9rem", textDecoration: "none",
              }}
            >
              Iniciar sesión
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Formulario ─────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        padding: "40px 36px",
        maxWidth: 460,
        width: "100%",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <UserPlus size={22} style={{ color: "var(--color-primary)" }} />
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.4rem", color: "var(--color-text)" }}>
            Crear cuenta
          </h1>
        </div>
        <p style={{ color: "var(--color-text-muted)", fontSize: ".88rem", marginBottom: 28, lineHeight: 1.5 }}>
          Completa el formulario. Tu solicitud será revisada por el administrador antes de activarse.
        </p>

        <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Nombre</label>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                style={inputStyle}
                placeholder="Francisco"
                required
              />
            </div>
            <div>
              <label style={labelStyle}>Apellido</label>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                style={inputStyle}
                placeholder="Higuera"
                required
              />
            </div>
          </div>

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
              autoComplete="new-password"
              minLength={6}
              required
            />
          </div>

          <div>
            <label style={labelStyle}>Confirmar contraseña</label>
            <input
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              style={inputStyle}
              autoComplete="new-password"
              minLength={6}
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
            {busy ? "Enviando solicitud…" : "Crear cuenta"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: ".85rem", color: "var(--color-text-muted)" }}>
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" style={{ color: "var(--color-primary)", fontWeight: 600, textDecoration: "none" }}>
            Iniciar sesión
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
