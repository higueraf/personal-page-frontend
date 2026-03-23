import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Video, Search, ChevronRight, RefreshCw, Lock } from "lucide-react";
import http from "../../shared/api/http";
import { useAuth } from "../../shared/auth/useAuth";
import Pagination from "../../shared/components/Pagination";

interface Course {
  id: string; title: string; slug: string;
  description?: string; level?: string; thumbnail?: string;
}

interface Meta { total_records: number; page: number; page_size: number; }

const fetchCourses = (search?: string, page = 1) =>
  http.get("/public/video-courses", { params: { ...(search ? { search } : {}), page, page_size: 12 } })
    .then(r => r.data as { data: Course[]; meta: Meta });

const LEVEL_COLOR: Record<string, string> = {
  Principiante: "#22c55e", Intermedio: "#3b6ef0", Avanzado: "#ef4444",
};

const inp: React.CSSProperties = {
  padding: "10px 12px 10px 36px",
  background: "var(--color-bg-muted)",
  border: "1.5px solid var(--color-border)",
  borderRadius: "var(--radius-md)",
  color: "var(--color-text)",
  fontFamily: "var(--font-body)",
  fontSize: ".9rem",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

export default function PublicCoursesList() {
  const [search, setSearch] = useState("");
  const [q, setQ]           = useState("");
  const [page, setPage]     = useState(1);
  const { user }            = useAuth();

  const { data, isLoading } = useQuery({
    queryKey:        ["public-vcourses", q, page],
    queryFn:         () => fetchCourses(q || undefined, page),
    placeholderData: (prev) => prev,
  });

  const courses    = data?.data ?? [];
  const meta       = data?.meta;
  const totalPages = meta ? Math.ceil(meta.total_records / meta.page_size) : 1;

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px" }}>

      {/* Encabezado */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <Video size={24} style={{ color: "var(--color-primary)" }} />
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.8rem", color: "var(--color-text)" }}>
            Cursos
          </h1>
        </div>
        <p style={{ color: "var(--color-text-muted)", fontSize: ".95rem", lineHeight: 1.6 }}>
          Aprende con video + contenido estructurado.{" "}
          {!user && (
            <>
              El contenido completo requiere{" "}
              <Link to="/register" style={{ color: "var(--color-primary)", fontWeight: 600, textDecoration: "none" }}>
                registro
              </Link>.
            </>
          )}
        </p>
      </div>

      {/* Banner de acceso si no está logueado */}
      {!user && (
        <div style={{
          display: "flex", alignItems: "center", gap: 14,
          background: "rgba(59,110,240,.07)",
          border: "1px solid rgba(59,110,240,.2)",
          borderRadius: "var(--radius-md)",
          padding: "14px 18px", marginBottom: 24,
        }}>
          <Lock size={18} style={{ color: "var(--color-primary)", flexShrink: 0 }} />
          <p style={{ color: "var(--color-text)", fontSize: ".88rem", lineHeight: 1.55, margin: 0 }}>
            Accede a todo el contenido de los cursos.{" "}
            <Link to="/register" style={{ color: "var(--color-primary)", fontWeight: 600, textDecoration: "none" }}>
              Crear cuenta
            </Link>{" "}·{" "}
            <Link to="/login" style={{ color: "var(--color-primary)", fontWeight: 600, textDecoration: "none" }}>
              Iniciar sesión
            </Link>
          </p>
        </div>
      )}

      {/* Búsqueda */}
      <form onSubmit={e => { e.preventDefault(); setQ(search); setPage(1); }} style={{ display: "flex", gap: 10, marginBottom: 28 }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
          <input placeholder="Buscar cursos…" value={search} onChange={e => setSearch(e.target.value)} style={inp} />
        </div>
        <button type="submit" style={{ background: "var(--color-primary)", color: "#fff", border: "none", borderRadius: "var(--radius-md)", padding: "10px 20px", fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)", fontSize: ".9rem" }}>
          Buscar
        </button>
      </form>

      {isLoading && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--color-text-muted)", fontSize: ".85rem" }}>
          <RefreshCw size={14} /> Cargando…
        </div>
      )}

      {!isLoading && courses.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--color-text-muted)" }}>
          <Video size={48} style={{ opacity: .15, display: "block", margin: "0 auto 16px" }} />
          <p>No se encontraron cursos.</p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 8 }}>
        {courses.map(c => (
          <Link key={c.id} to={`/courses/${c.slug}`} style={{ textDecoration: "none" }}>
            <div
              style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "18px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, transition: "border-color .15s, box-shadow .15s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--color-primary)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-md)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--color-border)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0, flex: 1 }}>
                {c.thumbnail ? (
                  <img src={c.thumbnail} alt={c.title} style={{ width: 72, height: 48, objectFit: "cover", borderRadius: 6, flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 72, height: 48, background: "var(--color-bg-muted)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "1px solid var(--color-border)" }}>
                    <Video size={20} style={{ color: "var(--color-primary)", opacity: .5 }} />
                  </div>
                )}
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 3 }}>
                    <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: ".97rem", color: "var(--color-text)" }}>{c.title}</span>
                    {c.level && (
                      <span style={{ fontSize: ".7rem", fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: (LEVEL_COLOR[c.level] ?? "#6b7280") + "22", color: LEVEL_COLOR[c.level] ?? "var(--color-text-muted)" }}>
                        {c.level}
                      </span>
                    )}
                  </div>
                  {c.description && (
                    <p style={{ color: "var(--color-text-muted)", fontSize: ".82rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 480 }}>{c.description}</p>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                {!user && <Lock size={14} style={{ color: "var(--color-text-muted)", opacity: .6 }} />}
                <ChevronRight size={18} style={{ color: "var(--color-primary)" }} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        total={meta?.total_records}
        itemLabel="cursos"
      />
    </div>
  );
}
