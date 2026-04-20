import { useState, useEffect, useRef } from "react";
import { useAuth, avatarUrl } from "../../shared/auth/authStore";
import { User, Save, Mail, Shield, RefreshCw, Camera } from "lucide-react";
import http from "../../shared/api/http";

export default function UserProfile() {
  const { user, bootstrap } = useAuth();
  const [loading, setLoading]     = useState(false);
  const [success, setSuccess]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [preview, setPreview]     = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({ first_name: "", last_name: "" });

  useEffect(() => {
    if (user) setForm({ first_name: user.first_name || "", last_name: user.last_name || "" });
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await http.patch("/user", form);
      await bootstrap();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Error al actualizar el perfil");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Local preview immediately
    setPreview(URL.createObjectURL(file));

    const formData = new FormData();
    formData.append("avatar", file);
    setAvatarLoading(true);
    try {
      await http.post("/user/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await bootstrap();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Error al subir la foto");
      setPreview(null);
    } finally {
      setAvatarLoading(false);
      // Reset so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (!user) return null;

  const currentAvatar = preview ?? avatarUrl(user.avatar);
  const initials = (user.first_name ? user.first_name.charAt(0) : user.email.charAt(0)).toUpperCase();

  return (
    <div className="page-container" style={{ maxWidth: 800, margin: "0 auto", padding: "40px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
        <div style={{ background: "var(--color-primary-soft)", color: "var(--color-primary)", padding: 10, borderRadius: 12 }}>
          <User size={24} />
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", fontWeight: 700, margin: 0 }}>
          Mi Perfil
        </h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 32 }}>
        {/* Lado izquierdo: Datos básicos */}
        <section style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: 28 }}>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: 24, display: "flex", alignItems: "center", gap: 8, color: "var(--color-primary)" }}>
            Información Personal
          </h2>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div className="form-group">
                <label style={labelStyle}>Nombre</label>
                <input
                  type="text"
                  value={form.first_name}
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                  style={inputStyle}
                  placeholder="Tu nombre"
                  required
                />
              </div>
              <div className="form-group">
                <label style={labelStyle}>Apellido</label>
                <input
                  type="text"
                  value={form.last_name}
                  onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                  style={inputStyle}
                  placeholder="Tu apellido"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label style={labelStyle}>Email (No editable)</label>
              <div style={{ ...inputStyle, background: "var(--color-bg-muted)", display: "flex", alignItems: "center", gap: 10, cursor: "not-allowed" }}>
                <Mail size={16} style={{ opacity: 0.5 }} />
                <span style={{ opacity: 0.7 }}>{user.email}</span>
              </div>
            </div>

            <div className="form-group">
              <label style={labelStyle}>Rol actual</label>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "4px 12px", borderRadius: 99, background: "var(--color-bg-muted)", border: "1px solid var(--color-border)", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                <Shield size={14} />
                {user.role?.name || "Usuario"}
              </div>
            </div>

            {error && (
              <div style={{ padding: 12, borderRadius: 8, background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", fontSize: "0.85rem" }}>
                {error}
              </div>
            )}

            {success && (
              <div style={{ padding: 12, borderRadius: 8, background: "rgba(34, 197, 94, 0.1)", color: "#22c55e", fontSize: "0.85rem" }}>
                ¡Perfil actualizado correctamente!
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn--primary"
              style={{ alignSelf: "flex-start", marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}
            >
              {loading ? <RefreshCw size={18} className="spin" /> : <Save size={18} />}
              {loading ? "Guardando..." : "Guardar cambios"}
            </button>
          </form>
        </section>

        {/* Lado derecho: Avatar + resumen */}
        <section style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: 28, textAlign: "center" }}>

            {/* Avatar clickeable */}
            <div style={{ position: "relative", width: 100, margin: "0 auto 16px" }}>
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: 100, height: 100, borderRadius: "50%",
                  background: "var(--color-bg-muted)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "2rem", fontWeight: 700, color: "var(--color-primary)",
                  border: "4px solid var(--color-surface)",
                  boxShadow: "0 0 0 1px var(--color-border)",
                  cursor: "pointer", overflow: "hidden",
                  position: "relative",
                }}
                title="Haz clic para cambiar tu foto"
              >
                {currentAvatar ? (
                  <img
                    src={currentAvatar}
                    alt="Avatar"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={() => setPreview(null)}
                  />
                ) : (
                  <span>{initials}</span>
                )}

                {/* Overlay on hover */}
                <div style={{
                  position: "absolute", inset: 0,
                  background: "rgba(0,0,0,0.45)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  opacity: avatarLoading ? 1 : 0,
                  transition: "opacity 0.2s",
                }}
                  className="avatar-overlay"
                >
                  {avatarLoading
                    ? <RefreshCw size={22} color="white" className="spin" />
                    : <Camera size={22} color="white" />
                  }
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleAvatarChange}
              />
            </div>

            <h3 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 700, color: "var(--color-primary)" }}>
              {user.first_name} {user.last_name}
            </h3>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", marginTop: 4 }}>{user.email}</p>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.78rem", marginTop: 8 }}>
              Haz clic en la foto para cambiarla (máx. 5 MB)
            </p>
          </div>

          <div style={{ background: "rgba(var(--color-primary-rgb), 0.05)", border: "1px dashed var(--color-primary)", borderRadius: "var(--radius-lg)", padding: 20 }}>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
              <strong>Nota:</strong> Los cambios realizados aquí se verán reflejados en todo el sitio, incluyendo tus comentarios en tutoriales y tu perfil de estudiante.
            </p>
          </div>
        </section>
      </div>

      <style>{`
        .avatar-overlay { opacity: 0 !important; }
        div:hover > .avatar-overlay { opacity: 1 !important; }
      `}</style>
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
  transition: "border-color 0.2s",
};
