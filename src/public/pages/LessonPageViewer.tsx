import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { ArrowLeft, ArrowRight, Home, Clock, FileText } from "lucide-react";
import { getLessonPage, type LessonPage } from "../api";
import BlockRenderer from "../../components/blocks/BlockRenderer";

export default function LessonPageViewer() {
  const { courseSlug, lessonSlug, pageOrder } = useParams();
  const order = Number(pageOrder ?? "1");
  const navigate = useNavigate();

  // GET /api/public/lessons/:course_slug/:lesson_slug/pages/:page_order
  const q = useQuery({
    queryKey: ["lesson-page", courseSlug, lessonSlug, order],
    queryFn: () => getLessonPage(courseSlug!, lessonSlug!, order),
    enabled: !!courseSlug && !!lessonSlug && Number.isFinite(order),
  });

  // Scroll al inicio al cambiar de página
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [order]);

  if (q.isLoading)
    return (
      <div className="lesson-viewer" style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)", fontSize: ".85rem" }}>
        Cargando…
      </div>
    );

  if (q.isError || !q.data)
    return (
      <div className="lesson-viewer" style={{ color: "#DC2626" }}>
        No se encontró esta página.
      </div>
    );

  const { course, lesson, page, blocks, nav } = q.data as LessonPage;

  const goTo = (o: number) =>
    navigate(`/learn/${course.slug}/${lesson.slug}/${o}`);

  const NavButtons = () => (
    <div className="lesson-nav-btns">
      {nav.prev !== null && (
        <button className="nav-pill" onClick={() => goTo(nav.prev!)}>
          <ArrowLeft size={13} /> Anterior
        </button>
      )}
      <Link className="nav-pill" to={`/courses/${course.slug}`}>
        <Home size={13} /> Volver al curso
      </Link>
      {nav.next !== null && (
        <button className="nav-pill" onClick={() => goTo(nav.next!)}>
          Siguiente <ArrowRight size={13} />
        </button>
      )}
    </div>
  );

  return (
    <div className="lesson-viewer">
      {/* Navegación superior */}
      <div className="lesson-nav">
        <div className="lesson-meta">
          <div className="lesson-breadcrumb">
            <Link to="/courses" style={{ color: "var(--color-primary)" }}>Cursos</Link>
            {" / "}
            <Link to={`/courses/${course.slug}`} style={{ color: "var(--color-primary)" }}>{course.title}</Link>
          </div>
          <h1 className="lesson-title">{lesson.title}</h1>
          <div className="lesson-info" style={{ display: "flex", gap: 16 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <FileText size={12} />
              Página {page.order} de {page.total_pages}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Clock size={12} />
              ~{page.estimated_minutes} min
            </span>
          </div>
        </div>
        <NavButtons />
      </div>

      {/* Título de página (si existe) */}
      {page.title && (
        <h2 style={{
          fontFamily: "var(--font-display)", fontWeight: 700,
          fontSize: "1.35rem", color: "var(--color-text)",
          marginBottom: 24,
        }}>
          {page.title}
        </h2>
      )}

      {/* Bloques de contenido */}
      <div className="lesson-content">
        {blocks.length === 0 ? (
          <p style={{ color: "var(--color-text-muted)", fontStyle: "italic" }}>
            Esta página todavía no tiene contenido.
          </p>
        ) : (
          <BlockRenderer blocks={blocks} />
        )}
      </div>

      {/* Navegación inferior */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 32 }}>
        <NavButtons />
      </div>
    </div>
  );
}
