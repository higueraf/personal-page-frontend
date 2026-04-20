/**
 * TutorialsList.tsx
 * Lista pública de tutoriales — acceso libre, sin login.
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Filter, Search, ChevronRight, RefreshCw } from "lucide-react";
import http from "../../shared/api/http";
import Pagination from "../../shared/components/Pagination";

interface Tutorial {
  id: string;
  title: string;
  slug: string;
  description?: string;
  level?: string;
  is_public?: boolean;
  study_courses?: { id: string; name: string }[];
}

interface StudyCourse { id: string; name: string; institution: string | null; }

interface Meta { total_records: number; page: number; page_size: number; }

async function fetchTutorials(search?: string, page = 1) {
  const params: Record<string, any> = { page, page_size: 12 };
  if (search) params.search = search;
  const r = await http.get("/public/tutorials", { params });
  return r.data as { data: Tutorial[]; meta: Meta };
}

async function fetchStudyCourses() {
  const r = await http.get("/public/study-courses");
  return r.data.data as StudyCourse[];
}

const LEVEL_CLS: Record<string, string> = {
  Principiante: "badge--green",
  Intermedio:   "badge--blue",
  Avanzado:     "badge--red",
};

export default function TutorialsList() {
  const [search, setSearch]           = useState("");
  const [q, setQ]                     = useState("");
  const [page, setPage]               = useState(1);

  const { data, isLoading } = useQuery({
    queryKey:        ["public-tutorials", q, page],
    queryFn:         () => fetchTutorials(q || undefined, page),
    placeholderData: (prev) => prev,
  });

  const { data: studyCourses = [] } = useQuery({
    queryKey: ["public-study-courses"],
    queryFn:  fetchStudyCourses,
    staleTime: 5 * 60 * 1000,
  });

  const tutorials  = data?.data ?? [];
  const meta       = data?.meta;
  const totalPages = meta ? Math.ceil(meta.total_records / meta.page_size) : 1;

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px" }}>

      {/* Encabezado */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <BookOpen size={24} style={{ color: "var(--color-primary)" }} />
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.8rem", color: "var(--color-text)" }}>
            Tutoriales
          </h1>
        </div>
        <p style={{ color: "var(--color-text-muted)", fontSize: ".95rem", lineHeight: 1.6 }}>
          Guías técnicas paso a paso. El contenido completo está disponible para usuarios registrados.
        </p>
      </div>

      {/* Buscador + filtro */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
        <form
          onSubmit={e => { e.preventDefault(); setQ(search); setPage(1); }}
          style={{ display: "flex", gap: 10 }}
        >
          <div style={{ position: "relative", flex: 1 }}>
            <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
            <input
              type="text"
              placeholder="Buscar tutoriales…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: "100%", padding: "10px 12px 10px 36px",
                background: "var(--color-bg-muted)", border: "1.5px solid var(--color-border)",
                borderRadius: "var(--radius-md)", color: "var(--color-text)",
                fontFamily: "var(--font-body)", fontSize: ".9rem", outline: "none",
                boxSizing: "border-box" as const,
              }}
            />
          </div>
          <button type="submit" style={{ background: "var(--color-primary)", color: "#fff", border: "none", borderRadius: "var(--radius-md)", padding: "10px 20px", fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)", fontSize: ".9rem" }}>
            Buscar
          </button>
        </form>
      </div>

      {/* Estado carga */}
      {isLoading && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--color-text-muted)", fontSize: ".85rem" }}>
          <RefreshCw size={14}/> Cargando…
        </div>
      )}

      {/* Vacío */}
      {!isLoading && tutorials.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--color-text-muted)" }}>
          <BookOpen size={48} style={{ opacity: .15, display: "block", margin: "0 auto 16px" }}/>
          <p>No se encontraron tutoriales.</p>
        </div>
      )}

      {/* Grid de tutoriales */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 8 }}>
        {tutorials.map(t => (
          <Link
            key={t.id}
            to={`/tutorials/${t.slug}`}
            style={{ textDecoration: "none" }}
          >
            <div style={{
              background: "var(--color-surface)", border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)", padding: "18px 22px",
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
              transition: "border-color .15s, box-shadow .15s",
            }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "var(--color-primary)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-md)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "var(--color-border)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                  <BookOpen size={15} style={{ color: "var(--color-primary)", flexShrink: 0 }}/>
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem", color: "var(--color-text)" }}>
                    {t.title}
                  </span>
                  {t.level && (
                    <span className={`badge ${LEVEL_CLS[t.level] ?? "badge--blue"}`}>{t.level}</span>
                  )}
                  {t.is_public && (
                    <span className="badge badge--green">Público</span>
                  )}
                </div>
                {t.description && (
                  <p style={{ color: "var(--color-text-muted)", fontSize: ".85rem", lineHeight: 1.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 560 }}>
                    {t.description}
                  </p>
                )}
                {t.study_courses && t.study_courses.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                    {t.study_courses.map(sc => (
                      <span key={sc.id} style={{
                        fontSize: ".75rem", padding: "2px 8px",
                        borderRadius: "var(--radius-sm)",
                        background: "rgba(99,102,241,.1)", color: "var(--color-primary)",
                        border: "1px solid rgba(99,102,241,.2)",
                      }}>
                        {sc.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <ChevronRight size={18} style={{ color: "var(--color-primary)", flexShrink: 0 }}/>
            </div>
          </Link>
        ))}
      </div>

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
