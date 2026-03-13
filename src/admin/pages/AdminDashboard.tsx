import { Link } from "react-router-dom";
import { BookOpen, ArrowRight, LayoutDashboard } from "lucide-react";

export default function AdminDashboard() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <LayoutDashboard size={20} style={{ color: "var(--color-primary)" }} />
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", fontWeight: 700, color: "var(--color-text)" }}>
          Dashboard
        </h1>
      </div>

      <p style={{ color: "var(--color-text-muted)", fontSize: ".9rem" }}>
        Bienvenido al panel de administración. Gestiona cursos, lecciones, páginas y bloques de contenido.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
        <Link
          to="/admin/courses"
          style={{
            background: "rgba(26,63,168,.06)",
            border: "1.5px solid rgba(26,63,168,.15)",
            borderRadius: "var(--radius-lg)",
            padding: "22px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            cursor: "pointer",
            transition: "all .2s",
            textDecoration: "none",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
        >
          <BookOpen size={26} style={{ color: "var(--color-primary)" }} />
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--color-text)", fontSize: "1rem" }}>
            Cursos
          </div>
          <div style={{ fontSize: ".8rem", color: "var(--color-text-muted)" }}>
            Gestionar cursos, lecciones y páginas
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: ".82rem", color: "var(--color-primary)", fontWeight: 600, marginTop: 4 }}>
            Gestionar <ArrowRight size={13} />
          </div>
        </Link>
      </div>
    </div>
  );
}
