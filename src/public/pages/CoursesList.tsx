import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Clock, Search } from "lucide-react";
import { useState } from "react";
import { getPublicCourses, type Course } from "../api";

const LEVEL_BADGE: Record<string, string> = {
  Básico: "badge--green",
  Intermedio: "badge--blue",
  Avanzado: "badge--yellow",
};

export default function CoursesList() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const q = useQuery({
    queryKey: ["public-courses", search, page],
    queryFn: () => getPublicCourses({ search: search || undefined, page }),
    placeholderData: (prev) => prev,
  });

  const courses: Course[] = q.data?.data ?? [];
  const meta = q.data?.meta;

  return (
    <div>
      {/* Cabecera */}
      <div className="page-header">
        <div className="page-header-inner">
          <h1 className="page-title">Cursos</h1>
          <p className="page-subtitle">
            Aprende a tu ritmo — cursos paginados con código copiable y ejercicios reales.
          </p>
        </div>
      </div>

      {/* Buscador */}
      <div className="section" style={{ paddingBottom: 0 }}>
        <div className="section-inner">
          <div style={{ position: "relative", maxWidth: 420 }}>
            <Search
              size={16}
              style={{
                position: "absolute", left: 12, top: "50%",
                transform: "translateY(-50%)",
                color: "var(--color-text-sub)", pointerEvents: "none",
              }}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Buscar curso…"
              style={{
                width: "100%",
                padding: "9px 12px 9px 36px",
                background: "var(--color-surface)",
                border: "1.5px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                color: "var(--color-text)",
                fontSize: ".9rem",
                fontFamily: "var(--font-body)",
                outline: "none",
              }}
            />
          </div>
        </div>
      </div>

      {/* Listado */}
      <div className="section">
        <div className="section-inner">
          {q.isLoading ? (
            <div style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)", fontSize: ".85rem" }}>
              Cargando cursos…
            </div>
          ) : q.isError ? (
            <div style={{ color: "#DC2626" }}>Error al cargar los cursos.</div>
          ) : courses.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "var(--color-text-muted)" }}>
              <BookOpen size={48} style={{ margin: "0 auto 16px", opacity: .4 }} />
              <p>{search ? `Sin resultados para "${search}"` : "Pronto habrá cursos disponibles."}</p>
            </div>
          ) : (
            <>
              <div className="courses-grid">
                {courses.map((c) => (
                  <Link key={c.id} to={`/courses/${c.slug}`} className="course-card">
                    <div className="course-card-header" />
                    <div className="course-card-body">
                      {c.level && (
                        <span className={`badge ${LEVEL_BADGE[c.level] ?? "badge--blue"} course-level`}>
                          {c.level}
                        </span>
                      )}
                      <h2 className="course-title">{c.title}</h2>
                      {c.description && <p className="course-desc">{c.description}</p>}
                    </div>
                    <div className="course-footer">
                      <span style={{ fontSize: ".82rem", color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: 5 }}>
                        <Clock size={13} /> Paginado
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--color-primary)", fontSize: ".85rem", fontWeight: 600 }}>
                        Empezar <ArrowRight size={14} />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Paginación */}
              {meta && meta.page_size > 1 && (
                <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 40 }}>
                  <button
                    className="nav-pill"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    style={{ opacity: page <= 1 ? .4 : 1 }}
                  >
                    ← Anterior
                  </button>
                  <span style={{
                    display: "flex", alignItems: "center",
                    fontFamily: "var(--font-mono)", fontSize: ".8rem",
                    color: "var(--color-text-muted)", padding: "0 12px",
                  }}>
                    Página {page} / {meta.page_size}
                  </span>
                  <button
                    className="nav-pill"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= meta.page_size}
                    style={{ opacity: page >= meta.page_size ? .4 : 1 }}
                  >
                    Siguiente →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
