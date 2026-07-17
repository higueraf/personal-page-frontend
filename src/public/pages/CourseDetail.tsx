import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpen, FileText } from "lucide-react";
import { getCurriculum, type Curriculum } from "../api";
import EmptyState from "@/components/patterns/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
      <div className="mx-auto max-w-3xl px-6 py-10">
        <Skeleton className="mb-6 h-8 w-2/3" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );

  if (q.isError || !q.data)
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-destructive">No se encontró el curso.</p>
      </div>
    );

  const { course, curriculum } = q.data as Curriculum;

  return (
    <div>
      {/* Cabecera */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-3xl px-6 py-10">
          <div className="mb-1.5 font-mono text-xs text-muted-foreground">
            <Link to="/courses" className="text-primary hover:underline">← Cursos</Link>
            {" / "}{course.title}
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">{course.title}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {curriculum.reduce((acc, s) => acc + s.lessons.length, 0)} lecciones
            · {curriculum.length} secciones
          </p>
        </div>
      </div>

      {/* Curriculum */}
      <div className="mx-auto max-w-3xl px-6 py-8">
        {curriculum.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="Este curso todavía no tiene lecciones publicadas."
          />
        ) : (
          <div className="flex flex-col gap-5">
            {curriculum.map((s) => (
              <Card key={s.section.id} className="overflow-hidden py-0">
                {/* Cabecera sección */}
                <div className="flex items-center gap-2.5 border-b border-border bg-muted/50 px-5 py-3.5">
                  <BookOpen size={15} className="shrink-0 text-primary" />
                  <span className="font-display text-base font-bold text-foreground">
                    {s.section.title}
                  </span>
                  <span className="ml-auto font-mono text-xs text-muted-foreground">
                    {s.lessons.length} lección{s.lessons.length !== 1 ? "es" : ""}
                  </span>
                </div>

                {/* Lecciones */}
                <CardContent className="divide-y divide-border p-0">
                  {s.lessons.map((l) => (
                    <div
                      key={l.id}
                      className="flex items-center justify-between gap-3 px-5 py-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-muted font-mono text-xs text-muted-foreground">
                          {l.order}
                        </span>
                        <span className="truncate text-sm text-foreground">
                          {l.title}
                        </span>
                      </div>

                      <div className="flex shrink-0 items-center gap-3">
                        {l.pages_count > 0 && (
                          <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
                            <FileText size={11} /> {l.pages_count} {l.pages_count === 1 ? "página" : "páginas"}
                          </span>
                        )}
                        {l.pages_count > 0 && (
                          <Link
                            to={`/learn/${course.slug}/${l.slug}/1`}
                            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
                          >
                            Empezar <ArrowRight size={13} />
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
