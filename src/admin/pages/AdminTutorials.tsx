/**
 * AdminTutorials.tsx
 * Lista de tutoriales con crear / editar / eliminar.
 * Pantalla 1 del flujo — lleva al TutorialEditor al hacer clic en "Editar".
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus, Edit3, Trash2, BookOpen, Search, AlertCircle,
  RefreshCw, ChevronRight,
} from "lucide-react";
import { adminCourses, type AdminCourse, type CourseStatus } from "../api";

const STATUS_LABEL: Record<CourseStatus, string> = {
  DRAFT: "Borrador", IN_REVIEW: "En revisión",
  PUBLISHED: "Publicado", HIDDEN: "Oculto", ARCHIVED: "Archivado",
};
const STATUS_CLS: Record<CourseStatus, string> = {
  DRAFT: "badge--yellow", IN_REVIEW: "badge--blue",
  PUBLISHED: "badge--green", HIDDEN: "badge--yellow", ARCHIVED: "badge--red",
};

const LEVELS = ["Principiante", "Intermedio", "Avanzado"];
const EMPTY = { title: "", description: "", level: "Principiante", status: "DRAFT" as CourseStatus };

export default function AdminTutorials() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const coursesQ = useQuery({
    queryKey: ["tutorials", search],
    queryFn: () => adminCourses.list({ search: search || undefined }),
  });
  const courses = coursesQ.data?.data ?? [];
  const inv = () => qc.invalidateQueries({ queryKey: ["tutorials"] });

  const createM = useMutation({
    mutationFn: (b: typeof EMPTY) => adminCourses.create(b),
    onSuccess: () => { inv(); closeModal(); },
  });
  const updateM = useMutation({
    mutationFn: ({ pk, body }: { pk: string; body: typeof EMPTY }) => adminCourses.update(pk, body),
    onSuccess: () => { inv(); closeModal(); },
  });
  const deleteM = useMutation({
    mutationFn: (pk: string) => adminCourses.delete(pk),
    onSuccess: () => { inv(); setDeleteId(null); },
  });

  function openCreate() { setForm(EMPTY); setEditing(null); setModal("create"); }
  function openEdit(c: AdminCourse) {
    setForm({ title: c.title, description: c.description ?? "", level: c.level ?? "Principiante", status: c.status });
    setEditing(c.id); setModal("edit");
  }
  function closeModal() { setModal(null); setEditing(null); }
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (modal === "edit" && editing) updateM.mutate({ pk: editing, body: form });
    else createM.mutate(form);
  }

  const isBusy = createM.isPending || updateM.isPending;
  const inp: React.CSSProperties = { width: "100%", padding: "9px 12px", background: "var(--color-bg-muted)", border: "1.5px solid var(--color-border)", borderRadius: "var(--radius-md)", color: "var(--color-text)", fontSize: ".9rem", fontFamily: "var(--font-body)", outline: "none", boxSizing: "border-box" };
  const lbl: React.CSSProperties = { display: "block", fontSize: ".82rem", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: 5 };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Encabezado */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <BookOpen size={20} style={{ color: "var(--color-primary)" }} />
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 700, color: "var(--color-text)" }}>
            Tutoriales
          </h1>
        </div>
        <button className="btn btn--primary" onClick={openCreate}>
          <Plus size={15} /> Nuevo tutorial
        </button>
      </div>

      {/* Buscador */}
      <div style={{ position: "relative", maxWidth: 400 }}>
        <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
        <input
          type="text"
          placeholder="Buscar por título…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...inp, paddingLeft: 36 }}
        />
      </div>

      {/* Estado carga */}
      {coursesQ.isLoading && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--color-text-muted)", fontSize: ".85rem" }}>
          <RefreshCw size={14} /> Cargando…
        </div>
      )}

      {/* Vacío */}
      {!coursesQ.isLoading && courses.length === 0 && (
        <div style={{ textAlign: "center", padding: "56px 0", color: "var(--color-text-muted)" }}>
          <BookOpen size={48} style={{ margin: "0 auto 16px", opacity: .2 }} />
          <p style={{ fontSize: ".95rem" }}>No hay tutoriales aún. ¡Crea el primero!</p>
        </div>
      )}

      {/* Lista */}
      {courses.map(c => (
        <div key={c.id} style={{ background: "var(--color-bg-muted)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem", color: "var(--color-text)" }}>
                {c.title}
              </span>
              <span className={`badge ${STATUS_CLS[c.status]}`}>{STATUS_LABEL[c.status]}</span>
              {c.level && <span className="badge badge--blue">{c.level}</span>}
            </div>
            {c.description && (
              <p style={{ fontSize: ".83rem", color: "var(--color-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 500 }}>
                {c.description}
              </p>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {/* Botón principal: ir al editor */}
            <Link
              to={`/admin/tutorials/${c.id}/edit`}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "var(--color-primary)", color: "#fff",
                borderRadius: "var(--radius-md)", padding: "8px 14px",
                fontSize: ".83rem", fontWeight: 600, textDecoration: "none",
              }}
            >
              <Edit3 size={14} /> Editar contenido <ChevronRight size={13} />
            </Link>
            {/* Editar metadatos */}
            <button
              title="Editar datos del tutorial"
              onClick={() => openEdit(c)}
              style={{ background: "rgba(26,63,168,.08)", border: "none", borderRadius: "var(--radius-sm)", padding: "8px 10px", color: "var(--color-primary)", cursor: "pointer" }}
            >
              <Edit3 size={14} />
            </button>
            <button
              title="Eliminar"
              onClick={() => setDeleteId(c.id)}
              style={{ background: "rgba(239,68,68,.08)", border: "none", borderRadius: "var(--radius-sm)", padding: "8px 10px", color: "#DC2626", cursor: "pointer" }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}

      {/* Modal crear/editar */}
      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}>
          <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-xl)", padding: "28px 32px", width: "100%", maxWidth: 480, boxShadow: "var(--shadow-lg)" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.1rem", color: "var(--color-text)", marginBottom: 20 }}>
              {modal === "edit" ? "Editar tutorial" : "Nuevo tutorial"}
            </h2>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div><label style={lbl}>Título *</label><input required type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={inp} /></div>
              <div><label style={lbl}>Descripción</label><textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ ...inp, resize: "vertical" }} /></div>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={lbl}>Nivel</label>
                  <select value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value }))} style={inp}>
                    {LEVELS.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={lbl}>Estado</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as CourseStatus }))} style={inp}>
                    {(Object.entries(STATUS_LABEL) as [CourseStatus, string][]).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>
              {(createM.isError || updateM.isError) && (
                <div style={{ background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.2)", borderRadius: "var(--radius-md)", padding: "8px 12px", fontSize: ".82rem", color: "#DC2626" }}>
                  Error al guardar.
                </div>
              )}
              <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
                <button type="button" onClick={closeModal} className="btn btn--outline" style={{ flex: 1 }}>Cancelar</button>
                <button type="submit" className="btn btn--primary" disabled={isBusy} style={{ flex: 1, justifyContent: "center" }}>
                  {isBusy ? "Guardando…" : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal eliminar */}
      {deleteId && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}>
          <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-xl)", padding: "28px 32px", maxWidth: 380, width: "100%", boxShadow: "var(--shadow-lg)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <AlertCircle size={20} style={{ color: "#DC2626" }} />
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem", color: "var(--color-text)" }}>Eliminar tutorial</h3>
            </div>
            <p style={{ color: "var(--color-text-muted)", fontSize: ".9rem", marginBottom: 20 }}>
              ¿Confirmas la eliminación? Se borrarán el tutorial y todos sus contenidos.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn--outline" onClick={() => setDeleteId(null)} style={{ flex: 1 }}>Cancelar</button>
              <button onClick={() => deleteM.mutate(deleteId)} disabled={deleteM.isPending} style={{ flex: 1, background: "#DC2626", color: "#fff", border: "none", borderRadius: "var(--radius-md)", padding: "10px", fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)", fontSize: ".9rem" }}>
                {deleteM.isPending ? "Eliminando…" : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
