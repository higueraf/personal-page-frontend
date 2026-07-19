import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Video, Search, RefreshCw, Lock } from "lucide-react";
import { videoCourseUseCases } from "../../../infrastructure/factories/video-course-module.factory";
import { useAuth } from "../../auth/useAuth";
import Pagination from "../../components/Pagination";
import PageHeader from "@/presentation/components/patterns/PageHeader";
import EmptyState from "@/presentation/components/patterns/EmptyState";
import CourseCard, { type CardAccent } from "@/presentation/components/patterns/CourseCard";
import { Input } from "@/presentation/components/ui/input";
import { Button } from "@/presentation/components/ui/button";

const ACCENTS: CardAccent[] = ["blue", "green", "purple", "orange", "pink"];

export default function PublicCoursesList() {
  const [search, setSearch] = useState("");
  const [q, setQ]           = useState("");
  const [page, setPage]     = useState(1);
  const { user }            = useAuth();

  const { data, isLoading } = useQuery({
    queryKey:        ["public-vcourses", q, page],
    queryFn:         () => videoCourseUseCases.listPublicCourses({ search: q || undefined, page, page_size: 12 }),
    placeholderData: (prev) => prev,
  });

  const courses    = data?.data ?? [];
  const meta       = data?.meta;
  const totalPages = meta ? Math.ceil(meta.total_records / meta.page_size) : 1;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">

      {/* Encabezado */}
      <PageHeader icon={Video} title="Cursos" />
      <p className="-mt-4 mb-8 text-sm leading-relaxed text-muted-foreground">
        Aprende con video + contenido estructurado.{" "}
        {!user && (
          <>
            El contenido completo requiere{" "}
            <Link to="/register" className="font-semibold text-primary hover:underline">
              registro
            </Link>.
          </>
        )}
      </p>

      {/* Banner de acceso si no está logueado */}
      {!user && (
        <div className="mb-6 flex items-center gap-3.5 rounded-md border border-primary/20 bg-primary/5 px-4 py-3.5">
          <Lock size={18} className="shrink-0 text-primary" />
          <p className="text-sm leading-relaxed text-foreground">
            Accede a todo el contenido de los cursos.{" "}
            <Link to="/register" className="font-semibold text-primary hover:underline">
              Crear cuenta
            </Link>{" "}·{" "}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Iniciar sesión
            </Link>
          </p>
        </div>
      )}

      {/* Búsqueda */}
      <form onSubmit={e => { e.preventDefault(); setQ(search); setPage(1); }} className="mb-7 flex gap-2.5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar cursos…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button type="submit">Buscar</Button>
      </form>

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <RefreshCw size={14} className="animate-spin" /> Cargando…
        </div>
      )}

      {!isLoading && courses.length === 0 && (
        <EmptyState icon={Video} title="No se encontraron cursos." />
      )}

      <div className="mb-2 grid grid-cols-[repeat(auto-fill,minmax(290px,1fr))] gap-5">
        {courses.map((c, idx) => (
          <CourseCard
            key={c.id}
            to={`/courses/${c.slug}`}
            title={c.title}
            description={c.description ?? undefined}
            image={c.thumbnail ?? undefined}
            badge={c.level ?? undefined}
            accent={ACCENTS[idx % ACCENTS.length]}
            icon={Video}
            meta={
              !user ? (
                <span className="flex items-center gap-1.5">
                  <Lock size={13} className="opacity-60" /> Requiere registro
                </span>
              ) : undefined
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
    </div>
  );
}
