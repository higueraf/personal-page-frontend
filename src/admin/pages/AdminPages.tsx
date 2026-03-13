import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Plus, Edit2, Trash2, FileText, ChevronRight, AlertCircle, ArrowLeft, RefreshCw, Clock } from "lucide-react";
import { adminPages, adminLessons, type AdminPage, type PageStatus } from "../api";

const STATUS_LABELS: Record<PageStatus, string> = { DRAFT: "Borrador", PUBLISHED: "Publicado", HIDDEN: "Oculto" };
const STATUS_CLASS: Record<PageStatus, string> = { DRAFT: "badge--yellow", PUBLISHED: "badge--green", HIDDEN: "badge--yellow" };
const EMPTY: Partial<AdminPage> = { title: "", order: 1, estimated_minutes: 5, status: "DRAFT" };

export default function AdminPages() {
  const { courseId, sectionId, lessonId } = useParams<{ courseId: string; sectionId: string; lessonId: string }>();
  const qc = useQueryClient();
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [form, setForm] = useState<Partial<AdminPage>>(EMPTY);
  const [editing, setEditing] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const lessonQ = useQuery({ queryKey: ["admin-lesson", lessonId], queryFn: () => adminLessons.get(lessonId!), enabled: !!lessonId });
  const pagesQ = useQuery({ queryKey: ["admin-pages", lessonId], queryFn: () => adminPages.list({ lesson_id: lessonId }), enabled: !!lessonId });
  const pages: AdminPage[] = pagesQ.data?.data ?? [];
  const inv = () => qc.invalidateQueries({ queryKey: ["admin-pages", lessonId] });

  const createM = useMutation({ mutationFn: (b: Partial<AdminPage>) => adminPages.create({ ...b, lesson: lessonId }), onSuccess: () => { inv(); closeModal(); } });
  const updateM = useMutation({ mutationFn: ({ pk, body }: { pk: string; body: Partial<AdminPage> }) => adminPages.update(pk, body), onSuccess: () => { inv(); closeModal(); } });
  const deleteM = useMutation({ mutationFn: (pk: string) => adminPages.delete(pk), onSuccess: () => { inv(); setDeleteId(null); } });

  function openCreate() { setForm({ ...EMPTY }); setEditing(null); setModal("create"); }
  function openEdit(p: AdminPage) { setForm({ title: p.title ?? "", order: p.order, estimated_minutes: p.estimated_minutes, status: p.status }); setEditing(p.id); setModal("edit"); }
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
          <Link to={`/admin/courses/${courseId}/sections/${sectionId}/lessons`} style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--color-primary)", fontSize: ".85rem", textDecoration: "none" }}>
            <ArrowLeft size={15} /> Lecciones
          </Link>
          <span style={{ color: "var(--color-border)" }}>/</span>
          <FileText size={18} style={{ color: "var(--color-primary)" }} />
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.15rem", fontWeight: 700, color: "var(--color-text)" }}>
            {lessonQ.data?.title ?? "…"} — Páginas
          </h1>
        </div>
        <button className="btn btn--primary" onClick={openCreate}><Plus size={15} /> Nueva página</button>
      </div>

      {pagesQ.isLoading && <div style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)", fontSize: ".82rem", display: "flex", alignItems: "center", gap: 8 }}><RefreshCw size={14} /> Cargando…</div>}
      {pagesQ.isError && <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#DC2626", fontSize: ".88rem" }}><AlertCircle size={16} /> Error al cargar páginas.</div>}

      {!pagesQ.isLoading && pages.length === 0 && (
        <div style={{ textAlign: "center", padding: "48px 0", color: "var(--color-text-muted)" }}>
          <FileText size={40} style={{ margin: "0 auto 12px", opacity: .3 }} />
          <p>Esta lección no tiene páginas. ¡Crea la primera!</p>
        </div>
      )}

      {pages.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[...pages].sort((a, b) => a.order - b.order).map((p) => (
            <div key={p.id} style={{ background: "var(--color-bg-muted)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--color-bg)", border: "1.5px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".72rem", fontFamily: "var(--font-mono)", color: "var(--color-text-muted)", flexShrink: 0 }}>{p.order}</span>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: ".95rem", color: "var(--color-text)" }}>{p.title || `Página ${p.order}`}</span>
                    <span className={`badge ${STATUS_CLASS[p.status]}`}>{STATUS_LABELS[p.status]}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: ".78rem", color: "var(--color-text-muted)", marginTop: 2 }}>
                    <Clock size={11} /> ~{p.estimated_minutes} min
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Link to={`/admin/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}/pages/${p.id}/blocks`} className="nav-pill" style={{ fontSize: ".8rem", gap: 4 }}>Bloques <ChevronRight size={12} /></Link>
                <button title="Editar" onClick={() => openEdit(p)} style={{ background: "rgba(26,63,168,.08)", border: "none", borderRadius: "var(--radius-sm)", padding: "7px 9px", color: "var(--color-primary)", cursor: "pointer" }}><Edit2 size={14} /></button>
                <button title="Eliminar" onClick={() => setDeleteId(p.id)} style={{ background: "rgba(239,68,68,.08)", border: "none", borderRadius: "var(--radius-sm)", padding: "7px 9px", color: "#DC2626", cursor: "pointer" }}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}>
          <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-xl)", padding: "28px 32px", width: "100%", maxWidth: 460, boxShadow: "var(--shadow-lg)" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.1rem", color: "var(--color-text)", marginBottom: 20 }}>{modal === "edit" ? "Editar página" : "Nueva página"}</h2>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div><label style={lbl}>Título (opcional)</label><input type="text" value={form.title ?? ""} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} style={inp} /></div>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1 }}><label style={lbl}>Orden</label><input type="number" min={1} value={form.order ?? 1} onChange={(e) => setForm((f) => ({ ...f, order: Number(e.target.value) }))} style={inp} /></div>
                <div style={{ flex: 1 }}><label style={lbl}>Minutos estimados</label><input type="number" min={1} value={form.estimated_minutes ?? 5} onChange={(e) => setForm((f) => ({ ...f, estimated_minutes: Number(e.target.value) }))} style={inp} /></div>
              </div>
              <div>
                <label style={lbl}>Estado</label>
                <select value={form.status ?? "DRAFT"} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as PageStatus }))} style={inp}>
                  {(Object.entries(STATUS_LABELS) as [PageStatus, string][]).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
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
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}><AlertCircle size={20} style={{ color: "#DC2626" }} /><h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem", color: "var(--color-text)" }}>Eliminar página</h3></div>
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
