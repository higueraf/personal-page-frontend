import { useState } from "react";
import { Lock, Save, RefreshCw, AlertCircle } from "lucide-react";
import http from "../../shared/api/http";

export default function UserSettings() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    if (form.new_password !== form.confirm_password) {
      setError("Las contraseñas nuevas no coinciden");
      setLoading(false);
      return;
    }

    try {
      await http.post("/auth/change-password", {
        current_password: form.current_password,
        new_password: form.new_password,
      });
      setSuccess(true);
      setForm({ current_password: "", new_password: "", confirm_password: "" });
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Error al cambiar la contraseña. Verifica tu contraseña actual.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: 600, margin: "0 auto", padding: "40px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
        <div style={{ background: "var(--color-primary-soft)", color: "var(--color-primary)", padding: 10, borderRadius: 12 }}>
          <Lock size={24} />
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", fontWeight: 700, margin: 0 }}>
          Configuración de Seguridad
        </h1>
      </div>

      <section style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: 32 }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: 24 }}>
          Cambiar Contraseña
        </h2>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="form-group">
            <label style={labelStyle}>Contraseña Actual</label>
            <input
              type="password"
              value={form.current_password}
              onChange={(e) => setForm({ ...form, current_password: e.target.value })}
              style={inputStyle}
              placeholder="••••••••"
              required
            />
          </div>

          <hr style={{ border: 0, borderTop: "1px solid var(--color-border)", margin: "8px 0" }} />

          <div className="form-group">
            <label style={labelStyle}>Nueva Contraseña</label>
            <input
              type="password"
              value={form.new_password}
              onChange={(e) => setForm({ ...form, new_password: e.target.value })}
              style={inputStyle}
              placeholder="Mínimo 8 caracteres"
              required
              minLength={8}
            />
          </div>

          <div className="form-group">
            <label style={labelStyle}>Confirmar Nueva Contraseña</label>
            <input
              type="password"
              value={form.confirm_password}
              onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
              style={inputStyle}
              placeholder="Repite tu nueva contraseña"
              required
            />
          </div>

          {error && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 12, borderRadius: 8, background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", fontSize: "0.85rem" }}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {success && (
            <div style={{ padding: 12, borderRadius: 8, background: "rgba(34, 197, 94, 0.1)", color: "#22c55e", fontSize: "0.85rem" }}>
              ✓ Tu contraseña ha sido cambiada con éxito.
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn--primary"
            style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}
          >
            {loading ? <RefreshCw size={18} className="spin" /> : <Save size={18} />}
            {loading ? "Procesando..." : "Actualizar Contraseña"}
          </button>
        </form>
      </section>

      <div style={{ marginTop: 24, padding: 20, background: "var(--color-bg-muted)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)" }}>
        <h4 style={{ margin: "0 0 8px 0", fontSize: "0.9rem", fontWeight: 600 }}>Consejos de seguridad</h4>
        <ul style={{ margin: 0, paddingLeft: 20, fontSize: "0.85rem", color: "var(--color-text-muted)", display: "flex", flexDirection: "column", gap: 4 }}>
          <li>Usa una mezcla de letras, números y símbolos.</li>
          <li>No uses contraseñas fáciles de adivinar (como "123456").</li>
          <li>Asegúrate de que sea diferente a la que usas en otros sitios.</li>
        </ul>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.85rem",
  fontWeight: 600,
  color: "var(--color-text-muted)",
  marginBottom: 8,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--color-border)",
  background: "var(--color-bg)",
  color: "var(--color-text)",
  fontSize: "0.95rem",
  outline: "none",
};
