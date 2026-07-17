import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BookMarked, Search, RefreshCw, ExternalLink,
  Link2, BookOpen, Wrench, GraduationCap, Video, FileText, Package,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import http from "../../shared/api/http";
import Pagination from "../../shared/components/Pagination";
import PageHeader from "@/components/patterns/PageHeader";
import EmptyState from "@/components/patterns/EmptyState";
import CourseCard, { type CardAccent } from "@/components/patterns/CourseCard";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Resource {
  id: string; title: string; description?: string;
  type: string; url?: string; tags?: string[];
  is_free: boolean; created_at: string;
}

interface Meta { total_records: number; page: number; page_size: number; }

const TYPE_LABEL: Record<string, string> = {
  LINK: "Enlace", BOOK: "Libro", TOOL: "Herramienta",
  COURSE: "Curso", VIDEO: "Video", ARTICLE: "Artículo", OTHER: "Otro",
};

const TYPE_ACCENT: Record<string, CardAccent> = {
  LINK: "blue", BOOK: "purple", TOOL: "green",
  COURSE: "orange", VIDEO: "pink", ARTICLE: "blue", OTHER: "blue",
};

const TYPE_ICON: Record<string, LucideIcon> = {
  LINK: Link2, BOOK: BookOpen, TOOL: Wrench,
  COURSE: GraduationCap, VIDEO: Video, ARTICLE: FileText, OTHER: Package,
};

async function fetchResources(search: string, page: number) {
  const r = await http.get("/public/resources", { params: { search: search || undefined, page, page_size: 12 } });
  return r.data as { data: Resource[]; meta: Meta };
}

export default function Resources() {
  const [search, setSearch] = useState("");
  const [q, setQ]           = useState("");
  const [page, setPage]     = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["public-resources", q, page],
    queryFn: () => fetchResources(q, page),
  });

  const resources  = data?.data ?? [];
  const meta       = data?.meta;
  const totalPages = meta ? Math.ceil(meta.total_records / meta.page_size) : 1;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <PageHeader
        icon={BookMarked}
        title="Recursos"
        subtitle="Libros, herramientas, cursos y artículos que recomiendo para aprender desarrollo."
      />

      <form onSubmit={e => { e.preventDefault(); setQ(search); setPage(1); }} className="mb-7 flex gap-2.5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar recursos…"
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

      {!isLoading && resources.length === 0 && (
        <EmptyState icon={BookMarked} title="No se encontraron recursos." />
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {resources.map(r => (
          <CourseCard
            key={r.id}
            to={r.url}
            title={r.title}
            description={r.description}
            badge={TYPE_LABEL[r.type] ?? r.type}
            accent={TYPE_ACCENT[r.type] ?? "blue"}
            icon={TYPE_ICON[r.type] ?? Package}
            meta={
              <div className="flex w-full flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  {r.is_free && (
                    <Badge variant="outline" className="border-transparent bg-green-500/10 text-[10px] font-semibold text-green-600">
                      Gratis
                    </Badge>
                  )}
                  {r.tags?.slice(0, 3).map(t => (
                    <Badge key={t} variant="secondary" className="text-[10px] font-normal">{t}</Badge>
                  ))}
                </div>
                {r.url && (
                  <span className="flex shrink-0 items-center gap-1 font-medium text-primary">
                    Ver <ExternalLink size={12} />
                  </span>
                )}
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
        itemLabel="recursos"
      />
    </div>
  );
}
