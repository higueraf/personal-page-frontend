/**
 * LmsMyCourses.tsx
 * "Mis cursos" — cursos del LMS en los que el alumno está inscrito, con progreso.
 */

import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowRight, GraduationCap } from "lucide-react";
import { lmsUseCases } from "../../../infrastructure/factories/lms-module.factory";
import PageHeader from "@/presentation/components/patterns/PageHeader";
import EmptyState from "@/presentation/components/patterns/EmptyState";
import CourseCard from "@/presentation/components/patterns/CourseCard";
import { pickCardImage } from "@/presentation/components/patterns/cardImages";
import ViewToggle, { usePersistedViewMode } from "@/presentation/components/patterns/ViewToggle";
import { Button } from "@/presentation/components/ui/button";
import { Badge } from "@/presentation/components/ui/badge";

export default function LmsMyCourses() {
  const [viewMode, setViewMode] = usePersistedViewMode("lms-my-courses-view");

  const { data, isLoading } = useQuery({
    queryKey: ["lms-my-courses"],
    queryFn: () => lmsUseCases.myCourses(),
  });

  const enrollments = data ?? [];

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <PageHeader
        icon={GraduationCap}
        title="Mis cursos"
        subtitle="Tu progreso en los cursos académicos en los que estás inscrito."
        actions={enrollments.length > 0 ? <ViewToggle value={viewMode} onChange={setViewMode} /> : undefined}
      />

      {!isLoading && enrollments.length === 0 && (
        <EmptyState
          icon={GraduationCap}
          title="Todavía no estás inscrito en ningún curso."
          description="Explora el catálogo y encuentra un curso para empezar."
          action={<Button asChild><Link to="/lms">Ver catálogo</Link></Button>}
        />
      )}

      {enrollments.length > 0 && viewMode === "grid" && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {enrollments.map((e) => (
            <CourseCard
              key={e.enrollment_id}
              to={`/lms/${e.course.slug}`}
              title={e.course.title}
              description={e.course.description ?? undefined}
              badge={e.status === "COMPLETED" ? "Completado" : "En curso"}
              accent={e.status === "COMPLETED" ? "green" : "blue"}
              icon={GraduationCap}
              image={e.course.cover_image}
              meta={
                <div className="flex w-full flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${e.progress_percent}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground">{e.progress_percent}%</span>
                  </div>
                  <span className="flex items-center gap-1.5 self-end text-xs font-medium text-primary">
                    Continuar <ArrowRight size={13} />
                  </span>
                </div>
              }
            />
          ))}
        </div>
      )}

      {enrollments.length > 0 && viewMode === "list" && (
        <div className="flex flex-col divide-y divide-border overflow-hidden rounded-lg border border-border">
          {enrollments.map((e) => (
            <Link
              key={e.enrollment_id}
              to={`/lms/${e.course.slug}`}
              className="group flex items-center gap-4 bg-card p-3 transition-colors hover:bg-muted/50"
            >
              <img
                src={e.course.cover_image || pickCardImage(e.course.title || e.course.slug)}
                alt=""
                loading="lazy"
                className="h-14 w-20 shrink-0 rounded-md object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate font-display font-semibold text-foreground group-hover:text-primary">{e.course.title}</h3>
                  <Badge variant={e.status === "COMPLETED" ? "default" : "secondary"} className="shrink-0">
                    {e.status === "COMPLETED" ? "Completado" : "En curso"}
                  </Badge>
                </div>
                {e.course.description && (
                  <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">{e.course.description}</p>
                )}
              </div>
              <div className="hidden w-32 shrink-0 items-center gap-2 sm:flex">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${e.progress_percent}%` }} />
                </div>
                <span className="text-xs text-muted-foreground">{e.progress_percent}%</span>
              </div>
              <ArrowRight size={16} className="shrink-0 text-muted-foreground group-hover:text-primary" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
