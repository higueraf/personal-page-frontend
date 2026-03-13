import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpen, FileText } from "lucide-react";
import { getCurriculum, type Curriculum } from "../api";

export default function CourseDetail() {
  const { courseSlug } = useParams();

  // GET /api/public/courses/:course_slug/curriculum
  const q = useQuery({
    queryKey: ["curriculum", courseSlug],
    queryFn: () => getCurriculum(courseSlug!),
    enabled: !!courseSlug,
  });

  if (q.isLoading)
    return (
      <div className="section">
        <div className="section-inner" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)", fontSize: ".85rem" }}>
          Cargando curriculum…
        </div>
      </div>
    );

  if (q.isError || !q.data)
    return (
      <div className="section">
        <div className="section-inner" style={{ color: "#DC2626" }}>
          No se encontró el curso.
        </div>
      </div>
    );

  const { course, curriculum } = q.data as Curriculum;

  return (
    <div>
      {/* Cabecera */}
      <div className="page-header">
        <div className="page-header-inner">
          <div style={{ fontSize: ".8rem", color: "var(--color-text-sub)", marginBottom: 6, fontFamily: "var(--font-mono)" }}>
            <Link to="/courses" style={{ color: "var(--color-primary)" }}>← Cursos</Link>
            {" / "}{course.title}
          </div>
          <h1 className="page-title">{course.title}</h1>
          <p className="page-subtitle">
            {curriculum.reduce((acc, s) => acc + s.lessons.length, 0)} lecciones
            · {curriculum.length} secciones
          </p>
        </div>
      </div>

      {/* Curriculum */}
      <div className="section">
        <div className="section-inner" style={{ maxWidth: 860 }}>
          {curriculum.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "var(--color-text-muted)" }}>
              <BookOpen size={40} style={{ margin: "0 auto 12px", opacity: .4 }} />
              <p>Este curso todavía no tiene lecciones publicadas.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {curriculum.map((s) => (
                <div
                  key={s.section.id}
                  style={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-lg)",
                    overflow: "hidden",
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  {/* Cabecera sección */}
                  <div style={{
                    background: "var(--color-bg-muted)",
                    borderBottom: "1px solid var(--color-border)",
                    padding: "14px 20px",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}>
                    <BookOpen size={15} style={{ color: "var(--color-primary)", flexShrink: 0 }} />
                    <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem", color: "var(--color-text)" }}>
                      {s.section.title}
                    </span>
                    <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: ".72rem", color: "var(--color-text-sub)" }}>
                      {s.lessons.length} lección{s.lessons.length !== 1 ? "es" : ""}
                    </span>
                  </div>

                  {/* Lecciones */}
                  <div style={{ padding: "6px 0" }}>
                    {s.lessons.map((l, idx) => (
                      <div
                        key={l.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "11px 20px",
                          borderBottom: idx < s.lessons.length - 1 ? "1px solid var(--color-border)" : "none",
                          gap: 12,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                          <span style={{
                            width: 26, height: 26, borderRadius: "50%",
                            background: "var(--color-bg-muted)",
                            border: "1.5px solid var(--color-border)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: ".72rem", fontFamily: "var(--font-mono)",
                            color: "var(--color-text-muted)", flexShrink: 0,
                          }}>
                            {l.order}
                          </span>
                          <span style={{ fontSize: ".92rem", color: "var(--color-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {l.title}
                          </span>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                          {l.pages_count > 0 && (
                            <span style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: "var(--font-mono)", fontSize: ".72rem", color: "var(--color-text-sub)" }}>
                              <FileText size={11} /> {l.pages_count} {l.pages_count === 1 ? "página" : "páginas"}
                            </span>
                          )}
                          {l.pages_count > 0 && (
                            <Link
                              to={`/learn/${course.slug}/${l.slug}/1`}
                              className="nav-pill"
                            >
                              Empezar <ArrowRight size={13} />
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
