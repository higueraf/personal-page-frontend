/**
 * AdminVideoCourses.tsx
 * Lista admin de cursos con video — crear, editar metadata, eliminar.
 * Botón principal: "Editar contenido →" abre CourseEditor.
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Video, Trash2, Edit2, ChevronRight, Search, RefreshCw, AlertCircle } from "lucide-react";
import { adminVideoCourses, type AdminVideoCourse, type VCStatus } from "../api";

const STATUS_LABEL: Record<VCStatus, string> = {
  DRAFT: "Borrador", PUBLISHED: "Publicado", HIDDEN: "Oculto", ARCHIVED: "Archivado",
};
const STATUS_COLOR: Record<VCStatus, string> = {
  DRAFT: "#f59e0b", PUBLISHED: "#22c55e", HIDDEN: "#6b7280", ARCHIVED: "#ef4444",
};
const LEVELS = ["Principiante", "Intermedio", "Avanzado"];

const EMPTY: Partial<AdminVideoCourse> = {
  title: "", description: "", level: "Principiante", status: "DRAFT",
};

export default function AdminVideoCourses() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [q, setQ]           = useState("");
  const [modal, setModal]   = useState<"create" | "edit" | null>(null);
  const [form, setForm]     = useState<Partial<AdminVideoCourse>>(EMPTY);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-vcourses", q],
    queryFn: () => adminVideoCourses.list(q ? { search: q } : undefined),
  });
  const courses: AdminVideoCourse[] = data?.data ?? [];

  const inp: React.CSSProperties = {
    width: "100%", padding: "8px 12px",
    background: "var(--color-bg-muted)", border: "1.5px solid var(--color-border)",
    borderRadius: "var(--radius-md)", color: "var(--color-text)",
    fontFamily: "var(--font-body)", fontSize: ".88rem", outline: "none",
    boxSizing: "border-box" as const,
  };
  const lbl: React.CSSProperties = {
    display: "block", fontSize: ".78rem", fontWeight: 600,
    color: "var(--color-text-muted)", marginBottom: 5,
    textTransform: "uppercase", letterSpacing: ".04em",
  };

  const createM = useMutation({
    mutationFn: () => adminVideoCourses.create(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-vcourses"] }); setModal(null); setForm(EMPTY); },
  });
  const updateM = useMutation({
    mutationFn: () => adminVideoCourses.update(form.id!, form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-vcourses"] }); setModal(null); },
  });
  const deleteM = useMutation({
    mutationFn: (id: string) => adminVideoCourses.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-vcourses"] }); setDeleteId(null); },
  });

  const openCreate = () => { setForm(EMPTY); setModal("create"); };
  const openEdit   = (c: AdminVideoCourse) => { setForm({ ...c }); setModal("edit"); };
  const submit     = () => modal === "create" ? createM.mutate() : updateM.mutate();
  const busy       = createM.isPending || updateM.isPending;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Video size={22} style={{ color: "var(--color-primary)" }} />
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.5rem", color: "var(--color-text)" }}>
            Cursos con video
          </h1>
        </div>
        <button onClick={openCreate} style={{ display: "flex", alignItems: "center", gap: 7, background: "var(--color-primary)", color: "#fff", border: "none", borderRadius: "var(--radius-md)", padding: "9px 18px", fontWeight: 600, fontSize: ".88rem", cursor: "pointer", fontFamily: "var(--font-body)" }}>
          <Plus size={15} /> Nuevo curso
        </button>
      </div>

      {/* Buscador */}
      <form onSubmit={e => { e.preventDefault(); setQ(search); }} style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={14} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
          <input placeholder="Buscar cursos…" value={search} onChange={e => setSearch(e.target.value)}
            style={{ ...inp, paddingLeft: 32 }} />
        </div>
        <button type="submit" style={{ background: "var(--color-primary)", color: "#fff", border: "none", borderRadius: "var(--radius-md)", padding: "8px 16px", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: ".88rem" }}>
          Buscar
        </button>
      </form>

      {/* Lista */}
      {isLoading && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--color-text-muted)" }}>
          <RefreshCw size={14} /> Cargando…
        </div>
      )}
      {!isLoading && courses.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--color-text-muted)" }}>
          <Video size={48} style={{ opacity: .15, display: "block", margin: "0 auto 16px" }} />
          <p>Aún no hay cursos. Crea el primero.</p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {courses.map(c => (
          <div key={c.id} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <Video size={18} style={{ color: "var(--color-primary)", flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 3 }}>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: ".97rem", color: "var(--color-text)" }}>{c.title}</span>
                <span style={{ fontSize: ".7rem", fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: STATUS_COLOR[c.status] + "22", color: STATUS_COLOR[c.status] }}>
                  {STATUS_LABEL[c.status]}
                </span>
                {c.level && (
                  <span style={{ fontSize: ".7rem", padding: "2px 8px", borderRadius: 99, background: "var(--color-bg-muted)", color: "var(--color-text-muted)", border: "1px solid var(--color-border)" }}>{c.level}</span>
                )}
              </div>
              {c.description && (
                <p style={{ color: "var(--color-text-muted)", fontSize: ".82rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 500 }}>{c.description}</p>
              )}
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <Link to={`/admin/video-courses/${c.id}/edit`} style={{ display: "flex", alignItems: "center", gap: 5, background: "var(--color-primary)", color: "#fff", border: "none", borderRadius: "var(--radius-md)", padding: "7px 14px", fontWeight: 600, fontSize: ".82rem", textDecoration: "none" }}>
                Editar contenido <ChevronRight size={13} />
              </Link>
              <button onClick={() => openEdit(c)} title="Editar metadata" style={{ background: "var(--color-bg-muted)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "7px 10px", color: "var(--color-text-muted)", cursor: "pointer", display: "flex" }}>
                <Edit2 size={14} />
              </button>
              <button onClick={() => setDeleteId(c.id)} title="Eliminar" style={{ background: "var(--color-bg-muted)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "7px 10px", color: "#ef4444", cursor: "pointer", display: "flex" }}>
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal crear/editar */}
      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 16 }}>
          <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-xl)", padding: "28px 32px", maxWidth: 480, width: "100%", boxShadow: "var(--shadow-lg)", display: "flex", flexDirection: "column", gap: 16 }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.1rem", color: "var(--color-text)" }}>
              {modal === "create" ? "Nuevo curso" : "Editar curso"}
            </h2>

            <div><label style={lbl}>Título *</label>
              <input value={form.title ?? ""} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={inp} placeholder="Ej: React desde cero" /></div>

            <div><label style={lbl}>Descripción</label>
              <textarea value={form.description ?? ""} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ ...inp, minHeight: 80, resize: "vertical" }} placeholder="Breve descripción del curso…" /></div>

            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1 }}><label style={lbl}>Nivel</label>
                <select value={form.level ?? "Principiante"} onChange={e => setForm(f => ({ ...f, level: e.target.value }))} style={inp}>
                  {LEVELS.map(l => <option key={l}>{l}</option>)}
                </select></div>
              <div style={{ flex: 1 }}><label style={lbl}>Estado</label>
                <select value={form.status ?? "DRAFT"} onChange={e => setForm(f => ({ ...f, status: e.target.value as VCStatus }))} style={inp}>
                  <option value="DRAFT">Borrador</option>
                  <option value="PUBLISHED">Publicado</option>
                  <option value="HIDDEN">Oculto</option>
                  <option value="ARCHIVED">Archivado</option>
                </select></div>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setModal(null)} style={{ background: "var(--color-bg-muted)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "9px 18px", color: "var(--color-text)", cursor: "pointer", fontFamily: "var(--font-body)" }}>Cancelar</button>
              <button onClick={submit} disabled={busy || !form.title?.trim()} style={{ background: "var(--color-primary)", color: "#fff", border: "none", borderRadius: "var(--radius-md)", padding: "9px 20px", fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)" }}>
                {busy ? "Guardando…" : modal === "create" ? "Crear curso" : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal eliminar */}
      {deleteId && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 16 }}>
          <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-xl)", padding: "28px 32px", maxWidth: 380, width: "100%", boxShadow: "var(--shadow-lg)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <AlertCircle size={20} style={{ color: "#DC2626" }} />
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem", color: "var(--color-text)" }}>Eliminar curso</h3>
            </div>
            <p style={{ color: "var(--color-text-muted)", fontSize: ".9rem", marginBottom: 20 }}>
              Se eliminará el curso. Las secciones y lecciones deben eliminarse primero desde el editor.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setDeleteId(null)} style={{ flex: 1, background: "var(--color-bg-muted)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "9px", color: "var(--color-text)", cursor: "pointer", fontFamily: "var(--font-body)" }}>Cancelar</button>
              <button onClick={() => deleteM.mutate(deleteId)} disabled={deleteM.isPending} style={{ flex: 1, background: "#DC2626", color: "#fff", border: "none", borderRadius: "var(--radius-md)", padding: "9px", fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)" }}>
                {deleteM.isPending ? "Eliminando…" : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
