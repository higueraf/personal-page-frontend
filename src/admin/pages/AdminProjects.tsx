import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FolderGit2, Plus, Pencil, Trash2, RefreshCw, X, Save, Globe, Github } from "lucide-react";
import http from "../../shared/api/http";
import Pagination from "../../shared/components/Pagination";

type Status = "DRAFT" | "PUBLISHED" | "ARCHIVED";
interface Project { id: string; title: string; slug: string; description?: string; long_description?: string; tech_stack?: string[]; url?: string; repo_url?: string; thumbnail?: string; order: number; status: Status; }

const EMPTY: Partial<Project> = { title: "", slug: "", description: "", long_description: "", tech_stack: [], url: "", repo_url: "", thumbnail: "", order: 0, status: "DRAFT" };

const STATUS_STYLE: Record<Status, { color: string; bg: string }> = {
  DRAFT:     { color: "#f59e0b", bg: "rgba(245,158,11,.1)" },
  PUBLISHED: { color: "#22c55e", bg: "rgba(34,197,94,.1)" },
  ARCHIVED:  { color: "#6b7280", bg: "rgba(107,114,128,.1)" },
};

export default function AdminProjects() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [form,  setForm]  = useState<Partial<Project>>(EMPTY);
  const [stackInput, setStackInput] = useState("");
  const [page, setPage] = useState(1);

  const listQ = useQuery({ queryKey: ["admin-projects", page], queryFn: () => http.get("/projects", { params: { page, page_size: 20 } }).then(r => r.data) });
  const projects: Project[] = listQ.data?.data ?? [];
  const meta = listQ.data?.meta;
  const totalPages = meta ? Math.ceil(meta.total_records / meta.page_size) : 1;

  const save = useMutation({
    mutationFn: (p: Partial<Project>) => p.id ? http.put(`/projects/${p.id}`, p).then(r => r.data) : http.post("/projects", p).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-projects"] }); setModal(null); },
  });
  const del = useMutation({
    mutationFn: (id: string) => http.delete(`/projects/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-projects"] }),
  });

  function openCreate() { setForm(EMPTY); setStackInput(""); setModal("create"); }
  function openEdit(p: Project) { setForm({ ...p }); setStackInput((p.tech_stack ?? []).join(", ")); setModal("edit"); }
  function setF<K extends keyof Project>(k: K, v: Project[K]) { setForm(f => ({ ...f, [k]: v })); }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const tech_stack = stackInput.split(",").map(s => s.trim()).filter(Boolean);
    save.mutate({ ...form, tech_stack });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <FolderGit2 size={20} style={{ color: "var(--color-primary)" }} />
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 700, color: "var(--color-text)" }}>Proyectos</h1>
        </div>
        <button onClick={openCreate} style={{ ...btnPrimary, display: "flex", alignItems: "center", gap: 6 }}>
          <Plus size={15}/> Nuevo proyecto
        </button>
      </div>

      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
        {listQ.isLoading ? (
          <div style={{ padding: 32, display: "flex", alignItems: "center", gap: 8, color: "var(--color-text-muted)" }}><RefreshCw size={14}/> Cargando…</div>
        ) : projects.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--color-text-muted)", fontSize: ".9rem" }}>Sin proyectos aún.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-bg-muted)" }}>
              {["Título", "Stack", "Estado", "Orden", ""].map(h => <th key={h} style={th}>{h}</th>)}
            </tr></thead>
            <tbody>
              {projects.map(p => (
                <tr key={p.id} style={{ borderBottom: "1px solid var(--color-border)" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--color-bg-muted)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <td style={td}>
                    <div style={{ fontWeight: 600, color: "var(--color-text)", fontSize: ".88rem" }}>{p.title}</div>
                    {p.description && <div style={{ fontSize: ".75rem", color: "var(--color-text-muted)", marginTop: 2, maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.description}</div>}
                  </td>
                  <td style={td}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {p.tech_stack?.slice(0, 3).map(t => <span key={t} style={{ background: "var(--color-bg-muted)", border: "1px solid var(--color-border)", padding: "1px 7px", borderRadius: 99, fontSize: ".7rem", color: "var(--color-text-muted)" }}>{t}</span>)}
                    </div>
                  </td>
                  <td style={td}>
                    <span style={{ padding: "3px 9px", borderRadius: 99, fontSize: ".75rem", fontWeight: 600, background: STATUS_STYLE[p.status]?.bg, color: STATUS_STYLE[p.status]?.color }}>{p.status}</span>
                  </td>
                  <td style={{ ...td, fontFamily: "var(--font-mono)", fontSize: ".8rem" }}>{p.order}</td>
                  <td style={{ ...td, display: "flex", gap: 6 }}>
                    <button onClick={() => openEdit(p)} style={btnIcon}><Pencil size={13}/></button>
                    <button onClick={() => { if (confirm("¿Eliminar proyecto?")) del.mutate(p.id); }} style={{ ...btnIcon, color: "#ef4444" }}><Trash2 size={13}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        total={meta?.total_records}
        itemLabel="proyectos"
      />

      {/* Modal */}
      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 24 }}
          onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
          <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "28px 26px", width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.1rem", color: "var(--color-text)", margin: 0 }}>
                {modal === "create" ? "Nuevo proyecto" : "Editar proyecto"}
              </h3>
              <button onClick={() => setModal(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)" }}><X size={18}/></button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Field label="Título *"><input value={form.title ?? ""} onChange={e => setF("title", e.target.value)} required style={inp} /></Field>
              <Field label="Slug"><input value={form.slug ?? ""} onChange={e => setF("slug", e.target.value)} style={inp} placeholder="auto-generado si está vacío" /></Field>
              <Field label="Descripción corta"><input value={form.description ?? ""} onChange={e => setF("description", e.target.value)} style={inp} /></Field>
              <Field label="Descripción larga">
                <textarea value={form.long_description ?? ""} onChange={e => setF("long_description", e.target.value)} rows={4} style={{ ...inp, resize: "vertical" }} />
              </Field>
              <Field label="Stack (separado por comas)">
                <input value={stackInput} onChange={e => setStackInput(e.target.value)} style={inp} placeholder="React, TypeScript, Django" />
              </Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="URL demo"><input value={form.url ?? ""} onChange={e => setF("url", e.target.value)} style={inp} placeholder="https://…" /></Field>
                <Field label="Repositorio"><input value={form.repo_url ?? ""} onChange={e => setF("repo_url", e.target.value)} style={inp} placeholder="https://github.com/…" /></Field>
              </div>
              <Field label="Thumbnail (URL)"><input value={form.thumbnail ?? ""} onChange={e => setF("thumbnail", e.target.value)} style={inp} /></Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Orden">
                  <input type="number" value={form.order ?? 0} onChange={e => setF("order", parseInt(e.target.value))} style={inp} />
                </Field>
                <Field label="Estado">
                  <select value={form.status ?? "DRAFT"} onChange={e => setF("status", e.target.value as Status)} style={inp}>
                    <option value="DRAFT">Borrador</option>
                    <option value="PUBLISHED">Publicado</option>
                    <option value="ARCHIVED">Archivado</option>
                  </select>
                </Field>
              </div>
              {save.isError && <p style={{ color: "#ef4444", fontSize: ".82rem" }}>Error al guardar.</p>}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
                <button type="button" onClick={() => setModal(null)} style={btnSecondary}>Cancelar</button>
                <button type="submit" disabled={save.isPending} style={{ ...btnPrimary, display: "flex", alignItems: "center", gap: 6, opacity: save.isPending ? .7 : 1 }}>
                  <Save size={14}/> {save.isPending ? "Guardando…" : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label style={{ display: "block", fontSize: ".78rem", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: 4 }}>{label}</label>{children}</div>;
}

const th: React.CSSProperties = { padding: "9px 14px", textAlign: "left", fontSize: ".72rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: ".06em" };
const td: React.CSSProperties = { padding: "11px 14px", fontSize: ".85rem", color: "var(--color-text)", verticalAlign: "middle" };
const inp: React.CSSProperties = { width: "100%", boxSizing: "border-box", background: "var(--color-bg-muted)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "8px 10px", fontSize: ".87rem", color: "var(--color-text)", fontFamily: "var(--font-body)", outline: "none" };
const btnPrimary: React.CSSProperties = { background: "var(--color-primary)", color: "#fff", border: "none", borderRadius: "var(--radius-md)", padding: "8px 16px", fontSize: ".85rem", fontWeight: 600, cursor: "pointer" };
const btnSecondary: React.CSSProperties = { background: "var(--color-bg-muted)", color: "var(--color-text)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "8px 16px", fontSize: ".85rem", cursor: "pointer" };
const btnIcon: React.CSSProperties = { background: "var(--color-bg-muted)", border: "1px solid var(--color-border)", borderRadius: 6, padding: "5px 7px", cursor: "pointer", color: "var(--color-text-muted)", display: "flex", alignItems: "center" };
