import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpen, Clock, Search } from "lucide-react";
import { useState } from "react";
import { getPublicCourses, type Course } from "../api";
import Pagination from "../../shared/components/Pagination";
import PageHeader from "@/components/patterns/PageHeader";
import CourseCard, { type CardAccent } from "@/components/patterns/CourseCard";
import EmptyState from "@/components/patterns/EmptyState";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

/** Mapea el nivel del curso a un color de acento consistente para la card. */
const LEVEL_ACCENT: Record<string, CardAccent> = {
  Principiante: "green",
  Intermedio: "blue",
  Avanzado: "purple",
};

function levelAccent(level?: string | null): CardAccent {
  return (level && LEVEL_ACCENT[level]) || "blue";
}

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
  const totalPages = meta ? Math.ceil(meta.total_records / meta.page_size) : 1;

  return (
    <div>
      {/* Cabecera */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <PageHeader
            icon={BookOpen}
            title="Cursos"
            subtitle="Aprende a tu ritmo — cursos paginados con código copiable y ejercicios reales."
          />
        </div>
      </div>

      {/* Buscador */}
      <div className="mx-auto max-w-6xl px-6 pt-8">
        <div className="relative max-w-[420px]">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Buscar curso…"
            className="pl-9"
          />
        </div>
      </div>

      {/* Listado */}
      <div className="mx-auto max-w-6xl px-6 py-8">
        {q.isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-xl border border-border bg-card">
                <Skeleton className="h-32 w-full rounded-none" />
                <div className="space-y-3 p-5">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : q.isError ? (
          <div className="text-destructive">Error al cargar los cursos.</div>
        ) : courses.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title={search ? `Sin resultados para "${search}"` : "Pronto habrá cursos disponibles."}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((c) => (
                <CourseCard
                  key={c.id}
                  to={`/courses/${c.slug}`}
                  title={c.title}
                  description={c.description ?? undefined}
                  badge={c.level ?? undefined}
                  accent={levelAccent(c.level)}
                  icon={BookOpen}
                  meta={
                    <div className="flex w-full items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Clock size={13} /> Paginado
                      </span>
                      <span className="flex items-center gap-1.5 font-medium text-primary">
                        Empezar <ArrowRight size={14} />
                      </span>
                    </div>
                  }
                />
              ))}
            </div>

            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              total={meta?.total_records}
              itemLabel="cursos"
            />
          </>
        )}
      </div>
    </div>
  );
}
