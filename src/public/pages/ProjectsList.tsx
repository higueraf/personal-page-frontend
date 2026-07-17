import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FolderGit2, Search, RefreshCw } from "lucide-react";
import http from "../../shared/api/http";
import Pagination from "../../shared/components/Pagination";
import PageHeader from "@/components/patterns/PageHeader";
import EmptyState from "@/components/patterns/EmptyState";
import CourseCard, { type CardAccent } from "@/components/patterns/CourseCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Project {
  id: string; title: string; slug: string;
  description?: string; long_description?: string;
  tech_stack?: string[]; url?: string; repo_url?: string;
  thumbnail?: string; status: string;
}

interface Meta { total_records: number; page: number; page_size: number; }

const ACCENTS: CardAccent[] = ["blue", "green", "purple", "orange", "pink"];

async function fetchProjects(search: string, page: number) {
  const r = await http.get("/public/projects", { params: { search: search || undefined, page, page_size: 9 } });
  return r.data as { data: Project[]; meta: Meta };
}

export default function ProjectsList() {
  const [search, setSearch] = useState("");
  const [q, setQ]           = useState("");
  const [page, setPage]     = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["public-projects", q, page],
    queryFn:  () => fetchProjects(q, page),
  });

  const projects    = data?.data ?? [];
  const meta        = data?.meta;
  const totalPages  = meta ? Math.ceil(meta.total_records / meta.page_size) : 1;

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setQ(search);
    setPage(1);
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">

      {/* Encabezado */}
      <PageHeader
        icon={FolderGit2}
        title="Proyectos"
        subtitle="Proyectos de software que he construido — desde plataformas educativas hasta APIs de producción."
      />

      {/* Búsqueda */}
      <form onSubmit={handleSearch} className="mb-8 flex gap-2.5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar proyectos…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button type="submit">Buscar</Button>
      </form>

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <RefreshCw size={14} className="animate-spin" /> Cargando…
        </div>
      )}

      {!isLoading && projects.length === 0 && (
        <EmptyState icon={FolderGit2} title="No se encontraron proyectos." />
      )}

      {/* Grid */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(290px,1fr))] gap-5">
        {projects.map((p, idx) => (
          <CourseCard
            key={p.id}
            to={`/projects/${p.slug}`}
            title={p.title}
            description={p.description}
            image={p.thumbnail}
            badge={p.tech_stack?.[0]}
            accent={ACCENTS[idx % ACCENTS.length]}
            icon={FolderGit2}
            meta={
              p.tech_stack && p.tech_stack.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {p.tech_stack.slice(0, 5).map(t => (
                    <Badge key={t} variant="secondary" className="font-normal">
                      {t}
                    </Badge>
                  ))}
                </div>
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
        itemLabel="proyectos"
      />
    </div>
  );
}
