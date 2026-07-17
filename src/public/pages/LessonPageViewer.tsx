import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { ArrowLeft, ArrowRight, Home, Clock, FileText } from "lucide-react";
import { getLessonPage, type LessonPage } from "../api";
import BlockRenderer from "../../components/blocks/BlockRenderer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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
      <div className="mx-auto max-w-3xl px-6 py-10 font-mono text-sm text-muted-foreground">
        Cargando…
      </div>
    );

  if (q.isError || !q.data)
    return (
      <div className="mx-auto max-w-3xl px-6 py-10 text-destructive">
        No se encontró esta página.
      </div>
    );

  const { course, lesson, page, blocks, nav } = q.data as LessonPage;

  const goTo = (o: number) =>
    navigate(`/learn/${course.slug}/${lesson.slug}/${o}`);

  const NavButtons = () => (
    <div className="flex flex-wrap gap-2">
      {nav.prev !== null && (
        <Button variant="outline" size="sm" onClick={() => goTo(nav.prev!)}>
          <ArrowLeft size={13} /> Anterior
        </Button>
      )}
      <Button variant="outline" size="sm" asChild>
        <Link to={`/courses/${course.slug}`}>
          <Home size={13} /> Volver al curso
        </Link>
      </Button>
      {nav.next !== null && (
        <Button variant="outline" size="sm" onClick={() => goTo(nav.next!)}>
          Siguiente <ArrowRight size={13} />
        </Button>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      {/* Navegación superior */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-5">
        <div className="flex flex-col gap-1">
          <div className="font-mono text-xs text-muted-foreground">
            <Link to="/courses" className="text-primary hover:underline">Cursos</Link>
            {" / "}
            <Link to={`/courses/${course.slug}`} className="text-primary hover:underline">{course.title}</Link>
          </div>
          <h1 className="font-display text-2xl font-bold leading-tight tracking-tight text-foreground">
            {lesson.title}
          </h1>
          <div className="flex gap-4 font-mono text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <FileText size={12} />
              Página {page.order} de {page.total_pages}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} />
              ~{page.estimated_minutes} min
            </span>
          </div>
        </div>
        <NavButtons />
      </div>

      {/* Título de página (si existe) */}
      {page.title && (
        <h2 className="mb-6 font-display text-xl font-bold text-foreground">
          {page.title}
        </h2>
      )}

      {/* Bloques de contenido */}
      <Card>
        <CardContent className="p-9">
          {blocks.length === 0 ? (
            <p className="italic text-muted-foreground">
              Esta página todavía no tiene contenido.
            </p>
          ) : (
            <BlockRenderer blocks={blocks} />
          )}
        </CardContent>
      </Card>

      {/* Navegación inferior */}
      <Separator className="mt-8" />
      <div className="flex justify-end pt-8">
        <NavButtons />
      </div>
    </div>
  );
}
