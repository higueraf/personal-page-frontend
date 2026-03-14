import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Plus, Edit2, Trash2, Code, AlertCircle, ArrowLeft, RefreshCw, GripVertical } from "lucide-react";
import { adminBlocks, adminPages, type AdminBlock, type BlockType } from "../api";

const BLOCK_LABELS: Record<BlockType, string> = { heading: "Título", paragraph: "Párrafo", list: "Lista", code: "Código", table: "Tabla", callout: "Alerta", divider: "Divisor", markdown: "Markdown" };
const BLOCK_ICONS: Record<BlockType, string> = { heading: "H", paragraph: "P", list: "L", code: "</>", table: "T", callout: "!", divider: "—", markdown: "M" };
const DEFAULT_DATA: Record<BlockType, object> = {
  heading: { level: 2, text: "" },
  paragraph: { text: "" },
  list: { style: "unordered", items: [""] },
  code: { language: "python", code: "" },
  table: { headers: ["Col 1"], rows: [["Valor"]] },
  callout: { variant: "info", text: "" },
  divider: {},
  markdown: { markdown: "" },
};
const EMPTY: Partial<AdminBlock> = { type: "paragraph", order: 1, data: { text: "" } };

export default function AdminBlocks() {
  const { courseId, sectionId, lessonId, pageId } = useParams<{ courseId: string; sectionId: string; lessonId: string; pageId: string }>();
  const qc = useQueryClient();
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [form, setForm] = useState<Partial<AdminBlock>>(EMPTY);
  const [editing, setEditing] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const pageQ = useQuery({ queryKey: ["admin-page", pageId], queryFn: () => adminPages.get(pageId!), enabled: !!pageId });
  const blocksQ = useQuery({ queryKey: ["admin-blocks", pageId], queryFn: () => adminBlocks.list({ page_id: pageId }), enabled: !!pageId });
  const blocks: AdminBlock[] = blocksQ.data?.data ?? [];
  const inv = () => qc.invalidateQueries({ queryKey: ["admin-blocks", pageId] });

  const createM = useMutation({ mutationFn: (b: Partial<AdminBlock>) => adminBlocks.create({ ...b, page: pageId }), onSuccess: () => { inv(); closeModal(); } });
  const updateM = useMutation({ mutationFn: ({ pk, body }: { pk: string; body: Partial<AdminBlock> }) => adminBlocks.update(pk, body), onSuccess: () => { inv(); closeModal(); } });
  const deleteM = useMutation({ mutationFn: (pk: string) => adminBlocks.delete(pk), onSuccess: () => { inv(); setDeleteId(null); } });

  function openCreate() { setForm({ ...EMPTY }); setEditing(null); setModal("create"); }
  function openEdit(b: AdminBlock) { setForm({ type: b.type, order: b.order, data: { ...b.data } }); setEditing(b.id); setModal("edit"); }
  function closeModal() { setModal(null); setForm(EMPTY); setEditing(null); }
  function handleTypeChange(t: BlockType) { setForm((f) => ({ ...f, type: t, data: { ...DEFAULT_DATA[t] } })); }
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (modal === "edit" && editing) updateM.mutate({ pk: editing, body: form });
    else createM.mutate(form);
  }

  const isBusy = createM.isPending || updateM.isPending;
  const inp: React.CSSProperties = { width: "100%", padding: "9px 12px", background: "var(--color-bg-muted)", border: "1.5px solid var(--color-border)", borderRadius: "var(--radius-md)", color: "var(--color-text)", fontSize: ".9rem", fontFamily: "var(--font-body)", outline: "none" };
  const lbl: React.CSSProperties = { display: "block", fontSize: ".82rem", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: 5 };
  const pageName = pageQ.data ? (pageQ.data.title || `Página ${pageQ.data.order}`) : "…";

  function DataFields() {
    const t = form.type ?? "paragraph";
    const d = form.data as any ?? {};
    const upd = (key: string, val: any) => setForm((f) => ({ ...f, data: { ...f.data, [key]: val } }));
    if (t === "heading") return (<><div><label style={lbl}>Nivel (1-6)</label><input type="number" min={1} max={6} value={d.level ?? 2} onChange={(e) => upd("level", Number(e.target.value))} style={inp} /></div><div><label style={lbl}>Texto *</label><input required type="text" value={d.text ?? ""} onChange={(e) => upd("text", e.target.value)} style={inp} /></div></>);
    if (t === "paragraph") return (<div><label style={lbl}>Texto *</label><textarea required rows={4} value={d.text ?? ""} onChange={(e) => upd("text", e.target.value)} style={{ ...inp, resize: "vertical" }} /></div>);
    if (t === "code") return (<><div><label style={lbl}>Lenguaje</label><input type="text" value={d.language ?? "python"} onChange={(e) => upd("language", e.target.value)} style={inp} /></div><div><label style={lbl}>Código *</label><textarea required rows={6} value={d.code ?? ""} onChange={(e) => upd("code", e.target.value)} style={{ ...inp, fontFamily: "var(--font-mono)", fontSize: ".82rem", resize: "vertical" }} /></div></>);
    if (t === "callout") return (<><div><label style={lbl}>Variante</label><select value={d.variant ?? "info"} onChange={(e) => upd("variant", e.target.value)} style={inp}>{["info","warning","danger","success"].map((v) => <option key={v} value={v}>{v}</option>)}</select></div><div><label style={lbl}>Texto *</label><textarea required rows={3} value={d.text ?? ""} onChange={(e) => upd("text", e.target.value)} style={{ ...inp, resize: "vertical" }} /></div></>);
    if (t === "list") return (<><div><label style={lbl}>Estilo</label><select value={d.style ?? "unordered"} onChange={(e) => upd("style", e.target.value)} style={inp}><option value="unordered">Sin orden</option><option value="ordered">Numerada</option></select></div><div><label style={lbl}>Ítems (uno por línea)</label><textarea rows={4} value={(d.items ?? [""]).join("\n")} onChange={(e) => upd("items", e.target.value.split("\n"))} style={{ ...inp, resize: "vertical" }} /></div></>);
    if (t === "divider") return <p style={{ color: "var(--color-text-muted)", fontSize: ".85rem" }}>El divisor no requiere datos adicionales.</p>;
    return null;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <Link to={`/admin/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}/pages`} style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--color-primary)", fontSize: ".85rem", textDecoration: "none" }}>
            <ArrowLeft size={15} /> Páginas
          </Link>
          <span style={{ color: "var(--color-border)" }}>/</span>
          <Code size={18} style={{ color: "var(--color-primary)" }} />
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.15rem", fontWeight: 700, color: "var(--color-text)" }}>{pageName} — Bloques</h1>
        </div>
        <button className="btn btn--primary" onClick={openCreate}><Plus size={15} /> Nuevo bloque</button>
      </div>

      {blocksQ.isLoading && <div style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)", fontSize: ".82rem", display: "flex", alignItems: "center", gap: 8 }}><RefreshCw size={14} /> Cargando…</div>}
      {blocksQ.isError && <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#DC2626", fontSize: ".88rem" }}><AlertCircle size={16} /> Error al cargar bloques.</div>}

      {!blocksQ.isLoading && blocks.length === 0 && (
        <div style={{ textAlign: "center", padding: "48px 0", color: "var(--color-text-muted)" }}>
          <Code size={40} style={{ margin: "0 auto 12px", opacity: .3 }} />
          <p>Esta página no tiene bloques. ¡Agrega el primero!</p>
        </div>
      )}

      {blocks.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[...blocks].sort((a, b) => a.order - b.order).map((b) => (
            <div key={b.id} style={{ background: "var(--color-bg-muted)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
              <GripVertical size={16} style={{ color: "var(--color-border)", flexShrink: 0 }} />
              <span style={{ width: 32, height: 32, borderRadius: "var(--radius-sm)", background: "var(--color-bg)", border: "1.5px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".72rem", fontFamily: "var(--font-mono)", color: "var(--color-primary)", fontWeight: 700, flexShrink: 0 }}>
                {BLOCK_ICONS[b.type]}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="badge badge--blue" style={{ fontSize: ".7rem" }}>{BLOCK_LABELS[b.type]}</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: ".72rem", color: "var(--color-text-muted)" }}>ord: {b.order}</span>
                </div>
                <p style={{ fontSize: ".82rem", color: "var(--color-text-muted)", margin: "3px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {(b.data as any).text ?? (b.data as any).code ?? JSON.stringify(b.data).slice(0, 80)}
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                <button title="Editar" onClick={() => openEdit(b)} style={{ background: "rgba(26,63,168,.08)", border: "none", borderRadius: "var(--radius-sm)", padding: "6px 8px", color: "var(--color-primary)", cursor: "pointer" }}><Edit2 size={14} /></button>
                <button title="Eliminar" onClick={() => setDeleteId(b.id)} style={{ background: "rgba(239,68,68,.08)", border: "none", borderRadius: "var(--radius-sm)", padding: "6px 8px", color: "#DC2626", cursor: "pointer" }}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16, overflowY: "auto" }}>
          <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-xl)", padding: "28px 32px", width: "100%", maxWidth: 520, boxShadow: "var(--shadow-lg)", margin: "auto" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.1rem", color: "var(--color-text)", marginBottom: 20 }}>{modal === "edit" ? "Editar bloque" : "Nuevo bloque"}</h2>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 2 }}>
                  <label style={lbl}>Tipo *</label>
                  <select value={form.type ?? "paragraph"} onChange={(e) => handleTypeChange(e.target.value as BlockType)} style={inp}>
                    {(Object.entries(BLOCK_LABELS) as [BlockType, string][]).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}><label style={lbl}>Orden</label><input type="number" min={1} value={form.order ?? 1} onChange={(e) => setForm((f) => ({ ...f, order: Number(e.target.value) }))} style={inp} /></div>
              </div>
              <DataFields />
              {(createM.isError || updateM.isError) && <div style={{ background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.2)", borderRadius: "var(--radius-md)", padding: "8px 12px", fontSize: ".82rem", color: "#DC2626" }}>Error al guardar. Revisa la estructura del bloque.</div>}
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
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}><AlertCircle size={20} style={{ color: "#DC2626" }} /><h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem", color: "var(--color-text)" }}>Eliminar bloque</h3></div>
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
