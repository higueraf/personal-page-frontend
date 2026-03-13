import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Plus, Edit2, Trash2, BookOpen, ChevronRight, AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { adminLessons, adminSections, type AdminLesson, type LessonStatus } from "../api";

const STATUS_LABELS: Record<LessonStatus, string> = { DRAFT: "Borrador", IN_REVIEW: "En revisión", PUBLISHED: "Publicado", HIDDEN: "Oculto", ARCHIVED: "Archivado" };
const STATUS_CLASS: Record<LessonStatus, string> = { DRAFT: "badge--yellow", IN_REVIEW: "badge--blue", PUBLISHED: "badge--green", HIDDEN: "badge--yellow", ARCHIVED: "badge--red" };
const EMPTY: Partial<AdminLesson> = { title: "", summary: "", order: 1, status: "DRAFT" };

export default function AdminLessons() {
  const { courseId, sectionId } = useParams<{ courseId: string; sectionId: string }>();
  const qc = useQueryClient();
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [form, setForm] = useState<Partial<AdminLesson>>(EMPTY);
  const [editing, setEditing] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const sectionQ = useQuery({ queryKey: ["admin-section", sectionId], queryFn: () => adminSections.get(sectionId!), enabled: !!sectionId });
  const lesQ = useQuery({ queryKey: ["admin-lessons", sectionId], queryFn: () => adminLessons.list({ section_id: sectionId }), enabled: !!sectionId });
  const lessons: AdminLesson[] = lesQ.data?.data ?? [];
  const inv = () => qc.invalidateQueries({ queryKey: ["admin-lessons", sectionId] });

  const createM = useMutation({ mutationFn: (b: Partial<AdminLesson>) => adminLessons.create({ ...b, section: sectionId }), onSuccess: () => { inv(); closeModal(); } });
  const updateM = useMutation({ mutationFn: ({ pk, body }: { pk: string; body: Partial<AdminLesson> }) => adminLessons.update(pk, body), onSuccess: () => { inv(); closeModal(); } });
  const deleteM = useMutation({ mutationFn: (pk: string) => adminLessons.delete(pk), onSuccess: () => { inv(); setDeleteId(null); } });

  function openCreate() { setForm({ ...EMPTY }); setEditing(null); setModal("create"); }
  function openEdit(l: AdminLesson) { setForm({ title: l.title, summary: l.summary ?? "", order: l.order, status: l.status }); setEditing(l.id); setModal("edit"); }
  function closeModal() { setModal(null); setForm(EMPTY); setEditing(null); }
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (modal === "edit" && editing) updateM.mutate({ pk: editing, body: form });
    else createM.mutate(form);
  }

  const isBusy = createM.isPending || updateM.isPending;
  const inp: React.CSSProperties = { width: "100%", padding: "9px 12px", background: "var(--color-bg-muted)", border: "1.5px solid var(--color-border)", borderRadius: "var(--radius-md)", color: "var(--color-text)", fontSize: ".9rem", fontFamily: "var(--font-body)", outline: "none" };
  const lbl: React.CSSProperties = { display: "block", fontSize: ".82rem", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: 5 };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <Link to={`/admin/courses/${courseId}/sections`} style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--color-primary)", fontSize: ".85rem", textDecoration: "none" }}>
            <ArrowLeft size={15} /> Secciones
          </Link>
          <span style={{ color: "var(--color-border)" }}>/</span>
          <BookOpen size={18} style={{ color: "var(--color-primary)" }} />
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.15rem", fontWeight: 700, color: "var(--color-text)" }}>
            {sectionQ.data?.title ?? "…"} — Lecciones
          </h1>
        </div>
        <button className="btn btn--primary" onClick={openCreate}><Plus size={15} /> Nueva lección</button>
      </div>

      {lesQ.isLoading && <div style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)", fontSize: ".82rem", display: "flex", alignItems: "center", gap: 8 }}><RefreshCw size={14} /> Cargando…</div>}
      {lesQ.isError && <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#DC2626", fontSize: ".88rem" }}><AlertCircle size={16} /> Error al cargar lecciones.</div>}

      {!lesQ.isLoading && lessons.length === 0 && (
        <div style={{ textAlign: "center", padding: "48px 0", color: "var(--color-text-muted)" }}>
          <BookOpen size={40} style={{ margin: "0 auto 12px", opacity: .3 }} />
          <p>Esta sección no tiene lecciones. ¡Crea la primera!</p>
        </div>
      )}

      {lessons.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[...lessons].sort((a, b) => a.order - b.order).map((l) => (
            <div key={l.id} style={{ background: "var(--color-bg-muted)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                <span style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--color-bg)", border: "1.5px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".72rem", fontFamily: "var(--font-mono)", color: "var(--color-text-muted)", flexShrink: 0 }}>{l.order}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: ".95rem", color: "var(--color-text)" }}>{l.title}</span>
                    <span className={`badge ${STATUS_CLASS[l.status]}`}>{STATUS_LABELS[l.status]}</span>
                  </div>
                  {l.summary && <p style={{ fontSize: ".8rem", color: "var(--color-text-muted)", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 400 }}>{l.summary}</p>}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Link to={`/admin/courses/${courseId}/sections/${sectionId}/lessons/${l.id}/pages`} className="nav-pill" style={{ fontSize: ".8rem", gap: 4 }}>Páginas <ChevronRight size={12} /></Link>
                <button title="Editar" onClick={() => openEdit(l)} style={{ background: "rgba(26,63,168,.08)", border: "none", borderRadius: "var(--radius-sm)", padding: "7px 9px", color: "var(--color-primary)", cursor: "pointer" }}><Edit2 size={14} /></button>
                <button title="Eliminar" onClick={() => setDeleteId(l.id)} style={{ background: "rgba(239,68,68,.08)", border: "none", borderRadius: "var(--radius-sm)", padding: "7px 9px", color: "#DC2626", cursor: "pointer" }}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}>
          <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-xl)", padding: "28px 32px", width: "100%", maxWidth: 480, boxShadow: "var(--shadow-lg)" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.1rem", color: "var(--color-text)", marginBottom: 20 }}>{modal === "edit" ? "Editar lección" : "Nueva lección"}</h2>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div><label style={lbl}>Título *</label><input required type="text" value={form.title ?? ""} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} style={inp} /></div>
              <div><label style={lbl}>Resumen</label><textarea rows={2} value={form.summary ?? ""} onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))} style={{ ...inp, resize: "vertical" }} /></div>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1 }}><label style={lbl}>Orden</label><input type="number" min={1} value={form.order ?? 1} onChange={(e) => setForm((f) => ({ ...f, order: Number(e.target.value) }))} style={inp} /></div>
                <div style={{ flex: 1 }}>
                  <label style={lbl}>Estado</label>
                  <select value={form.status ?? "DRAFT"} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as LessonStatus }))} style={inp}>
                    {(Object.entries(STATUS_LABELS) as [LessonStatus, string][]).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>
              {(createM.isError || updateM.isError) && <div style={{ background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.2)", borderRadius: "var(--radius-md)", padding: "8px 12px", fontSize: ".82rem", color: "#DC2626" }}>Error al guardar.</div>}
              <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
                <button type="button" onClick={closeModal} className="btn btn--outline" style={{ flex: 1 }}>Cancelar</button>
                <button type="submit" className="btn btn--primary" disabled={isBusy} style={{ flex: 1, justifyContent: "center" }}>{isBusy ? "Guardando…" : "Guardar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}>
          <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-xl)", padding: "28px 32px", maxWidth: 380, width: "100%", boxShadow: "var(--shadow-lg)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}><AlertCircle size={20} style={{ color: "#DC2626" }} /><h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem", color: "var(--color-text)" }}>Eliminar lección</h3></div>
            <p style={{ color: "var(--color-text-muted)", fontSize: ".9rem", marginBottom: 20 }}>¿Confirmas la eliminación? Esta acción no se puede deshacer.</p>
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
