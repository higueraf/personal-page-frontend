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
import { Button } from "@/presentation/components/ui/button";

export default function LmsMyCourses() {
  const { data, isLoading } = useQuery({
    queryKey: ["lms-my-courses"],
    queryFn: () => lmsUseCases.myCourses(),
  });

  const enrollments = data ?? [];

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <PageHeader icon={GraduationCap} title="Mis cursos" subtitle="Tu progreso en los cursos académicos en los que estás inscrito." />

      {!isLoading && enrollments.length === 0 && (
        <EmptyState
          icon={GraduationCap}
          title="Todavía no estás inscrito en ningún curso."
          description="Explora el catálogo y encuentra un curso para empezar."
          action={<Button asChild><Link to="/lms">Ver catálogo</Link></Button>}
        />
      )}

      {enrollments.length > 0 && (
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
    </div>
  );
}
