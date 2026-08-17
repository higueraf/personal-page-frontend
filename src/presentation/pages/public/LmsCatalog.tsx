/**
 * LmsCatalog.tsx
 * Catálogo público de cursos académicos del LMS — acceso libre, sin login.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, GraduationCap, Search } from "lucide-react";
import { lmsUseCases } from "../../../infrastructure/factories/lms-module.factory";
import Pagination from "../../components/Pagination";
import PageHeader from "@/presentation/components/patterns/PageHeader";
import CourseCard from "@/presentation/components/patterns/CourseCard";
import EmptyState from "@/presentation/components/patterns/EmptyState";
import { Input } from "@/presentation/components/ui/input";
import { Button } from "@/presentation/components/ui/button";
import { Card } from "@/presentation/components/ui/card";
import { Skeleton } from "@/presentation/components/ui/skeleton";

export default function LmsCatalog() {
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["lms-catalog", q, page],
    queryFn: () => lmsUseCases.catalog({ search: q || undefined, page, page_size: 12 }),
    placeholderData: (prev) => prev,
  });

  const courses = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta ? Math.ceil(meta.total_records / meta.page_size) : 1;

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <PageHeader
        icon={GraduationCap}
        title="Academia"
        subtitle="Cursos con unidades, actividades, tareas y evaluaciones. Inscríbete para llevar tu progreso."
      />

      <form onSubmit={(e) => { e.preventDefault(); setQ(search); setPage(1); }} className="mb-8 flex gap-3">
        <div className="relative flex-1">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input type="text" placeholder="Buscar cursos…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button type="submit">Buscar</Button>
      </form>

      {isLoading && (
        <div className="mb-2 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-32 w-full rounded-none" />
              <div className="space-y-2 p-5">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && courses.length === 0 && (
        <EmptyState icon={GraduationCap} title="No se encontraron cursos." description="Prueba con otra búsqueda o vuelve más tarde." />
      )}

      {!isLoading && courses.length > 0 && (
        <div className="mb-2 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <CourseCard
              key={c.id}
              to={`/lms/${c.slug}`}
              title={c.title}
              description={c.description ?? undefined}
              badge="Curso"
              accent="purple"
              icon={GraduationCap}
              meta={
                <div className="flex w-full items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {c.teacher ? `${c.teacher.first_name} ${c.teacher.last_name}` : ""}
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

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} total={meta?.total_records} itemLabel="cursos" />
    </div>
  );
}
