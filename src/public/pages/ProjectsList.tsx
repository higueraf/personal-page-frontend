import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FolderGit2, Search, RefreshCw, ArrowRight } from "lucide-react";
import http from "../../shared/api/http";
import Pagination from "../../shared/components/Pagination";

interface Project {
  id: string; title: string; slug: string;
  description?: string; long_description?: string;
  tech_stack?: string[]; url?: string; repo_url?: string;
  thumbnail?: string; status: string;
}

interface Meta { total_records: number; page: number; page_size: number; }

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
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 24px" }}>

      {/* Encabezado */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <FolderGit2 size={24} style={{ color: "var(--color-primary)" }} />
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.8rem", color: "var(--color-text)" }}>
            Proyectos
          </h1>
        </div>
        <p style={{ color: "var(--color-text-muted)", fontSize: ".95rem", lineHeight: 1.6 }}>
          Proyectos de software que he construido — desde plataformas educativas hasta APIs de producción.
        </p>
      </div>

      {/* Búsqueda */}
      <form onSubmit={handleSearch} style={{ display: "flex", gap: 10, marginBottom: 32 }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
          <input
            placeholder="Buscar proyectos…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: "100%", padding: "10px 12px 10px 36px", background: "var(--color-bg-muted)", border: "1.5px solid var(--color-border)", borderRadius: "var(--radius-md)", color: "var(--color-text)", fontFamily: "var(--font-body)", fontSize: ".9rem", outline: "none", boxSizing: "border-box" }}
          />
        </div>
        <button type="submit" style={{ background: "var(--color-primary)", color: "#fff", border: "none", borderRadius: "var(--radius-md)", padding: "10px 20px", fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)", fontSize: ".9rem" }}>
          Buscar
        </button>
      </form>

      {isLoading && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--color-text-muted)", fontSize: ".85rem" }}>
          <RefreshCw size={14} /> Cargando…
        </div>
      )}

      {!isLoading && projects.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--color-text-muted)" }}>
          <FolderGit2 size={48} style={{ opacity: .15, display: "block", margin: "0 auto 16px" }} />
          <p>No se encontraron proyectos.</p>
        </div>
      )}

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 18 }}>
        {projects.map(p => (
          <Link key={p.id} to={`/projects/${p.slug}`} style={{ textDecoration: "none" }}>
            <div
              style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", overflow: "hidden", display: "flex", flexDirection: "column", height: "100%", transition: "border-color .15s, transform .15s, box-shadow .15s" }}
              onMouseEnter={e => { const d = e.currentTarget as HTMLDivElement; d.style.borderColor = "var(--color-primary)"; d.style.transform = "translateY(-2px)"; d.style.boxShadow = "var(--shadow-md)"; }}
              onMouseLeave={e => { const d = e.currentTarget as HTMLDivElement; d.style.borderColor = "var(--color-border)"; d.style.transform = "none"; d.style.boxShadow = "none"; }}
            >
              {/* Thumbnail o placeholder */}
              {p.thumbnail ? (
                <img src={p.thumbnail} alt={p.title} style={{ width: "100%", height: 160, objectFit: "cover" }} />
              ) : (
                <div style={{ height: 120, background: "var(--color-bg-muted)", display: "flex", alignItems: "center", justifyContent: "center", borderBottom: "1px solid var(--color-border)" }}>
                  <FolderGit2 size={36} style={{ color: "var(--color-primary)", opacity: .25 }} />
                </div>
              )}

              <div style={{ padding: "18px 20px", flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
                <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem", color: "var(--color-text)", margin: 0 }}>
                  {p.title}
                </h3>
                {p.description && (
                  <p style={{ color: "var(--color-text-muted)", fontSize: ".85rem", lineHeight: 1.55, margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {p.description}
                  </p>
                )}
                {p.tech_stack && p.tech_stack.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: "auto" }}>
                    {p.tech_stack && p.tech_stack.slice(0, 5).map(t => (
                      <span key={t} style={{ background: "var(--color-bg-muted)", border: "1px solid var(--color-border)", padding: "2px 7px", borderRadius: 99, fontSize: ".72rem", color: "var(--color-text-muted)" }}>
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ padding: "10px 20px 14px", display: "flex", alignItems: "center", gap: 6, borderTop: "1px solid var(--color-border)" }}>
                <ArrowRight size={13} style={{ color: "var(--color-primary)" }} />
                <span style={{ fontSize: ".8rem", color: "var(--color-primary)", fontWeight: 600 }}>Ver detalle</span>
              </div>
            </div>
          </Link>
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
