import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookMarked, Search, RefreshCw, ExternalLink, ArrowRight } from "lucide-react";
import http from "../../shared/api/http";

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

const TYPE_COLOR: Record<string, string> = {
  LINK: "#3b6ef0", BOOK: "#8b5cf6", TOOL: "#22c55e",
  COURSE: "#f59e0b", VIDEO: "#ef4444", ARTICLE: "#06b6d4", OTHER: "#6b7280",
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
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px" }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <BookMarked size={24} style={{ color: "var(--color-primary)" }} />
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.8rem", color: "var(--color-text)" }}>
            Recursos
          </h1>
        </div>
        <p style={{ color: "var(--color-text-muted)", fontSize: ".95rem", lineHeight: 1.6 }}>
          Libros, herramientas, cursos y artículos que recomiendo para aprender desarrollo.
        </p>
      </div>

      <form onSubmit={e => { e.preventDefault(); setQ(search); setPage(1); }} style={{ display: "flex", gap: 10, marginBottom: 28 }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
          <input placeholder="Buscar recursos…" value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: "100%", padding: "10px 12px 10px 36px", background: "var(--color-bg-muted)", border: "1.5px solid var(--color-border)", borderRadius: "var(--radius-md)", color: "var(--color-text)", fontFamily: "var(--font-body)", fontSize: ".9rem", outline: "none", boxSizing: "border-box" }} />
        </div>
        <button type="submit" style={{ background: "var(--color-primary)", color: "#fff", border: "none", borderRadius: "var(--radius-md)", padding: "10px 20px", fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)", fontSize: ".9rem" }}>
          Buscar
        </button>
      </form>

      {isLoading && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--color-text-muted)", fontSize: ".85rem" }}>
          <RefreshCw size={14}/> Cargando…
        </div>
      )}

      {!isLoading && resources.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--color-text-muted)" }}>
          <BookMarked size={48} style={{ opacity: .15, display: "block", margin: "0 auto 16px" }} />
          <p>No se encontraron recursos.</p>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
        {resources.map(r => (
          <div key={r.id} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "18px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: ".7rem", fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: (TYPE_COLOR[r.type] ?? "#6b7280") + "18", color: TYPE_COLOR[r.type] ?? "var(--color-text-muted)" }}>
                {TYPE_LABEL[r.type] ?? r.type}
              </span>
              {r.is_free && (
                <span style={{ fontSize: ".68rem", fontWeight: 700, padding: "1px 7px", borderRadius: 99, background: "rgba(34,197,94,.12)", color: "#22c55e" }}>
                  GRATIS
                </span>
              )}
            </div>

            <div>
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: ".95rem", color: "var(--color-text)", margin: "0 0 4px" }}>{r.title}</h3>
              {r.description && (
                <p style={{ color: "var(--color-text-muted)", fontSize: ".82rem", lineHeight: 1.55, margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {r.description}
                </p>
              )}
            </div>

            {r.tags && r.tags.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {r.tags && r.tags.map(t => (
                  <span key={t} style={{ background: "var(--color-bg-muted)", padding: "1px 7px", borderRadius: 99, fontSize: ".7rem", color: "var(--color-text-muted)", border: "1px solid var(--color-border)" }}>{t}</span>
                ))}
              </div>
            )}

            {r.url && (
              <a href={r.url} target="_blank" rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--color-primary)", fontSize: ".82rem", fontWeight: 600, textDecoration: "none", marginTop: "auto" }}>
                <ExternalLink size={13}/> Ver recurso
              </a>
            )}
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "center", marginTop: 36 }}>
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
            style={{ background: "var(--color-bg-muted)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "8px 16px", cursor: page <= 1 ? "not-allowed" : "pointer", color: "var(--color-text)", fontSize: ".85rem", opacity: page <= 1 ? .4 : 1 }}>
            ← Anterior
          </button>
          <span style={{ fontSize: ".82rem", color: "var(--color-text-muted)" }}>{page} / {totalPages} · {meta?.total_records} recursos</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
            style={{ background: "var(--color-bg-muted)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "8px 16px", cursor: page >= totalPages ? "not-allowed" : "pointer", color: "var(--color-text)", fontSize: ".85rem", opacity: page >= totalPages ? .4 : 1 }}>
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
}
