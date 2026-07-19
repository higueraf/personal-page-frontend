/**
 * TutorialsList.tsx
 * Lista pública de tutoriales — acceso libre, sin login.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpen, Search } from "lucide-react";
import { tutorialUseCases, studyCourseUseCases } from "../../../infrastructure/factories/tutorial-module.factory";
import Pagination from "../../components/Pagination";
import PageHeader from "@/presentation/components/patterns/PageHeader";
import CourseCard, { type CardAccent } from "@/presentation/components/patterns/CourseCard";
import EmptyState from "@/presentation/components/patterns/EmptyState";
import { Input } from "@/presentation/components/ui/input";
import { Button } from "@/presentation/components/ui/button";
import { Card } from "@/presentation/components/ui/card";
import { Skeleton } from "@/presentation/components/ui/skeleton";

/** Mapea el nivel del tutorial a un color de acento consistente para la card. */
const LEVEL_ACCENT: Record<string, CardAccent> = {
  Principiante: "green",
  Intermedio: "blue",
  Avanzado: "purple",
};

function levelAccent(level?: string): CardAccent {
  return (level && LEVEL_ACCENT[level]) || "blue";
}

export default function TutorialsList() {
  const [search, setSearch]           = useState("");
  const [q, setQ]                     = useState("");
  const [page, setPage]               = useState(1);

  const { data, isLoading } = useQuery({
    queryKey:        ["public-tutorials", q, page],
    queryFn:         () => tutorialUseCases.listPublic({ search: q || undefined, page, page_size: 12 }),
    placeholderData: (prev) => prev,
  });

  const { data: studyCourses = [] } = useQuery({
    queryKey: ["public-study-courses"],
    queryFn:  () => studyCourseUseCases.listPublic(),
    staleTime: 5 * 60 * 1000,
  });

  const tutorials  = data?.data ?? [];
  const meta       = data?.meta;
  const totalPages = meta ? Math.ceil(meta.total_records / meta.page_size) : 1;

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">

      {/* Encabezado */}
      <PageHeader
        icon={BookOpen}
        title="Tutoriales"
        subtitle="Guías técnicas paso a paso. El contenido completo está disponible para usuarios registrados."
      />

      {/* Buscador */}
      <form
        onSubmit={e => { e.preventDefault(); setQ(search); setPage(1); }}
        className="mb-8 flex gap-3"
      >
        <div className="relative flex-1">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar tutoriales…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button type="submit">Buscar</Button>
      </form>

      {/* Estado carga */}
      {isLoading && (
        <div className="mb-2 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-32 w-full rounded-none" />
              <div className="space-y-2 p-5">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Vacío */}
      {!isLoading && tutorials.length === 0 && (
        <EmptyState
          icon={BookOpen}
          title="No se encontraron tutoriales."
          description="Prueba con otra búsqueda o revisa más tarde."
        />
      )}

      {/* Grid de tutoriales */}
      {!isLoading && tutorials.length > 0 && (
        <div className="mb-2 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tutorials.map(t => (
            <CourseCard
              key={t.id}
              to={`/tutorials/${t.slug}`}
              title={t.title}
              description={t.description ?? undefined}
              badge={t.level ?? undefined}
              accent={levelAccent(t.level ?? undefined)}
              icon={BookOpen}
              meta={
                <div className="flex w-full items-center justify-between">
                  <span className="flex flex-wrap items-center gap-1.5">
                    {t.is_public && (
                      <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-700 dark:text-emerald-400">
                        Público
                      </span>
                    )}
                    {t.study_courses?.slice(0, 2).map(sc => (
                      <span key={sc.id} className="rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs text-primary">
                        {sc.name}
                      </span>
                    ))}
                  </span>
                  <span className="flex items-center gap-1.5 font-medium text-primary">
                    Ver <ArrowRight size={14} />
                  </span>
                </div>
              }
            />
          ))}
        </div>
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        total={meta?.total_records}
        itemLabel="tutoriales"
      />
    </div>
  );
}
