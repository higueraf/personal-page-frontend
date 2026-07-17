import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FolderGit2, ArrowLeft, ExternalLink, Github, RefreshCw } from "lucide-react";
import http from "../../shared/api/http";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface Project {
  id: string; title: string; slug: string;
  description?: string; long_description?: string;
  tech_stack?: string[]; url?: string; repo_url?: string;
  thumbnail?: string; created_at: string;
}

export default function ProjectDetail() {
  const { slug } = useParams<{ slug: string }>();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["public-project", slug],
    queryFn: () => http.get(`/public/projects/${slug}`).then(r => r.data.data as Project),
    enabled: !!slug,
  });

  if (isLoading) return (
    <div className="flex min-h-[50vh] items-center justify-center gap-2 text-muted-foreground">
      <RefreshCw size={16} className="animate-spin" /> Cargando…
    </div>
  );

  if (isError || !data) return (
    <div className="mx-auto max-w-[700px] px-6 py-20 text-center">
      <FolderGit2 size={48} className="mx-auto mb-4 text-primary opacity-15" />
      <h2 className="font-display text-xl font-bold text-foreground">Proyecto no encontrado</h2>
      <Link to="/projects" className="text-sm text-primary hover:underline">← Volver a proyectos</Link>
    </div>
  );

  const p = data;

  return (
    <div className="mx-auto max-w-[820px] px-6 py-10">
      <Link to="/projects" className="mb-7 inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
        <ArrowLeft size={14} /> Todos los proyectos
      </Link>

      {p.thumbnail && (
        <img src={p.thumbnail} alt={p.title} className="mb-8 h-80 w-full rounded-xl border border-border object-cover" />
      )}

      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <h1 className="font-display text-3xl font-extrabold text-foreground">
          {p.title}
        </h1>
        <div className="flex gap-2.5">
          {p.url && (
            <Button asChild>
              <a href={p.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={14} /> Ver demo
              </a>
            </Button>
          )}
          {p.repo_url && (
            <Button asChild variant="outline">
              <a href={p.repo_url} target="_blank" rel="noopener noreferrer">
                <Github size={14} /> Repositorio
              </a>
            </Button>
          )}
        </div>
      </div>

      {p.description && (
        <p className="mb-6 text-base leading-relaxed text-muted-foreground">
          {p.description}
        </p>
      )}

      {p.tech_stack && p.tech_stack.length > 0 && (
        <div className="mb-7">
          <div className="mb-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">Stack tecnológico</div>
          <div className="flex flex-wrap gap-2">
            {p.tech_stack.map(t => (
              <Badge key={t} variant="secondary" className="font-medium">
                {t}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {p.long_description && (
        <>
          <Separator className="mb-6" />
          <div>
            <div className="mb-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Descripción detallada</div>
            <div className="whitespace-pre-wrap text-sm leading-loose text-foreground">
              {p.long_description}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
