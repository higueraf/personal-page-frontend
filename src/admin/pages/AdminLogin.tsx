import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Terminal, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../shared/auth/useAuth";

export default function AdminLogin() {
  const nav = useNavigate();
  const loc = useLocation();
  const { login, status, error } = useAuth();
  const from = (loc.state as any)?.from ?? "/admin";

  const [emailOrUser, setEmailOrUser] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = emailOrUser.includes("@")
      ? { email: emailOrUser, password }
      : { username: emailOrUser, password };
    try {
      await login(payload);
      nav(from, { replace: true });
    } catch {
      // error ya está en store
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--color-bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-xl)",
          overflow: "hidden",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        {/* Banner superior */}
        <div
          style={{
            background: "var(--color-primary)",
            padding: "28px 32px",
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div className="brand-icon">
            <Terminal size={20} />
          </div>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.2rem", color: "#fff" }}>
              Admin
            </div>
            <div style={{ fontSize: ".78rem", color: "rgba(255,255,255,.65)" }}>
              Acceso restringido
            </div>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={onSubmit} style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <label style={{ display: "block", fontSize: ".82rem", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: 6 }}>
              Usuario o correo
            </label>
            <input
              type="text"
              value={emailOrUser}
              onChange={(e) => setEmailOrUser(e.target.value)}
              placeholder="admin@correo.com"
              required
              style={{
                width: "100%", padding: "10px 14px",
                background: "var(--color-bg-muted)",
                border: "1.5px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                color: "var(--color-text)",
                fontSize: ".9rem",
                outline: "none",
                fontFamily: "var(--font-body)",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: ".82rem", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: 6 }}>
              Contraseña
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: "100%", padding: "10px 40px 10px 14px",
                  background: "var(--color-bg-muted)",
                  border: "1.5px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--color-text)",
                  fontSize: ".9rem",
                  outline: "none",
                  fontFamily: "var(--font-body)",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{
                  position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer",
                  color: "var(--color-text-muted)",
                }}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.25)",
              borderRadius: "var(--radius-md)", padding: "9px 14px",
              fontSize: ".83rem", color: "#DC2626",
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={status === "loading"}
            className="btn btn--primary"
            style={{ justifyContent: "center", width: "100%", padding: "11px" }}
          >
            {status === "loading" ? "Ingresando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
