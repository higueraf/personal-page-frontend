import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FolderGit2, ArrowLeft, ExternalLink, Github, RefreshCw } from "lucide-react";
import http from "../../shared/api/http";

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
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "50vh", gap: 8, color: "var(--color-text-muted)" }}>
      <RefreshCw size={16} /> Cargando…
    </div>
  );

  if (isError || !data) return (
    <div style={{ maxWidth: 700, margin: "80px auto", textAlign: "center", padding: "0 24px" }}>
      <FolderGit2 size={48} style={{ opacity: .15, display: "block", margin: "0 auto 16px", color: "var(--color-primary)" }} />
      <h2 style={{ fontFamily: "var(--font-display)", color: "var(--color-text)" }}>Proyecto no encontrado</h2>
      <Link to="/projects" style={{ color: "var(--color-primary)", fontSize: ".9rem" }}>← Volver a proyectos</Link>
    </div>
  );

  const p = data;

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "40px 24px" }}>
      <Link to="/projects" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--color-primary)", fontSize: ".83rem", textDecoration: "none", marginBottom: 28 }}>
        <ArrowLeft size={14} /> Todos los proyectos
      </Link>

      {p.thumbnail && (
        <img src={p.thumbnail} alt={p.title} style={{ width: "100%", height: 320, objectFit: "cover", borderRadius: "var(--radius-lg)", marginBottom: 32, border: "1px solid var(--color-border)" }} />
      )}

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "2rem", color: "var(--color-text)", margin: 0 }}>
          {p.title}
        </h1>
        <div style={{ display: "flex", gap: 10 }}>
          {p.url && (
            <a href={p.url} target="_blank" rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--color-primary)", color: "#fff", borderRadius: "var(--radius-md)", padding: "8px 16px", fontSize: ".85rem", fontWeight: 600, textDecoration: "none" }}>
              <ExternalLink size={14} /> Ver demo
            </a>
          )}
          {p.repo_url && (
            <a href={p.repo_url} target="_blank" rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--color-bg-muted)", color: "var(--color-text)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "8px 16px", fontSize: ".85rem", textDecoration: "none" }}>
              <Github size={14} /> Repositorio
            </a>
          )}
        </div>
      </div>

      {p.description && (
        <p style={{ color: "var(--color-text-muted)", fontSize: "1rem", lineHeight: 1.7, marginBottom: 24 }}>
          {p.description}
        </p>
      )}

      {p.tech_stack && p.tech_stack.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: ".75rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>Stack tecnológico</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {p.tech_stack && p.tech_stack.map(t => (
              <span key={t} style={{ background: "var(--color-bg-muted)", border: "1px solid var(--color-border)", padding: "4px 12px", borderRadius: 99, fontSize: ".82rem", color: "var(--color-text)", fontWeight: 500 }}>
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {p.long_description && (
        <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: 24 }}>
          <div style={{ fontSize: ".75rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 16 }}>Descripción detallada</div>
          <div style={{ color: "var(--color-text)", lineHeight: 1.8, fontSize: ".95rem", whiteSpace: "pre-wrap" }}>
            {p.long_description}
          </div>
        </div>
      )}
    </div>
  );
}
