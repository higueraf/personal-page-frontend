import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserCircle, Plus, Pencil, Trash2, RefreshCw, X, Save } from "lucide-react";
import http from "../../shared/api/http";

type ItemType = "EXPERIENCE" | "EDUCATION" | "CERTIFICATION" | "SKILL" | "LANGUAGE" | "AWARD" | "PUBLICATION" | "VOLUNTEER";
interface ProfileItem { id: string; type: ItemType; title: string; subtitle?: string; location?: string; start_date?: string; end_date?: string; description?: string; tags?: string[]; url?: string; logo?: string; order: number; is_visible: boolean; }

const TYPES: { value: ItemType; label: string }[] = [
  { value: "EXPERIENCE",    label: "Experiencia" },
  { value: "EDUCATION",     label: "Educación" },
  { value: "CERTIFICATION", label: "Certificación" },
  { value: "SKILL",         label: "Habilidad" },
  { value: "LANGUAGE",      label: "Idioma" },
  { value: "AWARD",         label: "Reconocimiento" },
  { value: "PUBLICATION",   label: "Publicación" },
  { value: "VOLUNTEER",     label: "Voluntariado" },
];

const EMPTY: Partial<ProfileItem> = { type: "EXPERIENCE", title: "", subtitle: "", location: "", start_date: "", end_date: "", description: "", tags: [], url: "", logo: "", order: 0, is_visible: true };

export default function AdminProfile() {
  const qc = useQueryClient();
  const [modal, setModal]         = useState<"create"|"edit"|null>(null);
  const [form,  setForm]          = useState<Partial<ProfileItem>>(EMPTY);
  const [tagsInput, setTagsInput] = useState("");
  const [filterType, setFilter]   = useState<string>("");

  const listQ = useQuery({ queryKey: ["admin-profile", filterType], queryFn: () => http.get("/profile", { params: filterType ? { type: filterType } : {} }).then(r => r.data.data as ProfileItem[]) });
  const items = listQ.data ?? [];

  const save = useMutation({
    mutationFn: (p: Partial<ProfileItem>) => p.id ? http.put(`/profile/${p.id}`, p) : http.post("/profile", p),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-profile"] }); setModal(null); },
  });
  const del = useMutation({
    mutationFn: (id: string) => http.delete(`/profile/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-profile"] }),
  });

  function openCreate() { setForm(EMPTY); setTagsInput(""); setModal("create"); }
  function openEdit(p: ProfileItem) { setForm({ ...p }); setTagsInput((p.tags ?? []).join(", ")); setModal("edit"); }
  function setF<K extends keyof ProfileItem>(k: K, v: any) { setForm(f => ({ ...f, [k]: v })); }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const tags = tagsInput.split(",").map(s => s.trim()).filter(Boolean);
    save.mutate({ ...form, tags });
  }

  const typeLabel = (t: string) => TYPES.find(x => x.value === t)?.label ?? t;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <UserCircle size={20} style={{ color: "var(--color-primary)" }} />
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 700, color: "var(--color-text)" }}>Curriculum / Perfil</h1>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <select value={filterType} onChange={e => setFilter(e.target.value)} style={inp}>
            <option value="">Todos los tipos</option>
            {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <button onClick={openCreate} style={{ ...btnPrimary, display: "flex", alignItems: "center", gap: 6 }}>
            <Plus size={15}/> Nuevo ítem
          </button>
        </div>
      </div>

      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
        {listQ.isLoading ? (
          <div style={{ padding: 32, display: "flex", gap: 8, color: "var(--color-text-muted)" }}><RefreshCw size={14}/> Cargando…</div>
        ) : items.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--color-text-muted)" }}>Sin ítems.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-bg-muted)" }}>
              {["Tipo", "Título", "Institución", "Período", "Vis.", ""].map(h => <th key={h} style={th}>{h}</th>)}
            </tr></thead>
            <tbody>
              {items.map(p => (
                <tr key={p.id} style={{ borderBottom: "1px solid var(--color-border)" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--color-bg-muted)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <td style={td}><span style={{ background: "var(--color-bg-muted)", border: "1px solid var(--color-border)", padding: "2px 8px", borderRadius: 99, fontSize: ".72rem", color: "var(--color-text-muted)" }}>{typeLabel(p.type)}</span></td>
                  <td style={td}><span style={{ fontWeight: 600, fontSize: ".88rem" }}>{p.title}</span></td>
                  <td style={{ ...td, color: "var(--color-text-muted)", fontSize: ".83rem" }}>{p.subtitle ?? "—"}</td>
                  <td style={{ ...td, fontFamily: "var(--font-mono)", fontSize: ".78rem", color: "var(--color-text-muted)" }}>{p.start_date ?? "—"}</td>
                  <td style={td}>{p.is_visible ? "✓" : "—"}</td>
                  <td style={{ ...td, display: "flex", gap: 6 }}>
                    <button onClick={() => openEdit(p)} style={btnIcon}><Pencil size={13}/></button>
                    <button onClick={() => { if (confirm("¿Eliminar?")) del.mutate(p.id); }} style={{ ...btnIcon, color: "#ef4444" }}><Trash2 size={13}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 24 }}
          onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
          <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "28px 26px", width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.1rem", color: "var(--color-text)", margin: 0 }}>{modal === "create" ? "Nuevo ítem" : "Editar ítem"}</h3>
              <button onClick={() => setModal(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)" }}><X size={18}/></button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Tipo *">
                  <select value={form.type} onChange={e => setF("type", e.target.value)} style={inp}>
                    {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </Field>
                <Field label="Orden"><input type="number" value={form.order ?? 0} onChange={e => setF("order", parseInt(e.target.value))} style={inp} /></Field>
              </div>
              <Field label="Título *"><input value={form.title ?? ""} onChange={e => setF("title", e.target.value)} required style={inp} /></Field>
              <Field label="Institución / Empresa"><input value={form.subtitle ?? ""} onChange={e => setF("subtitle", e.target.value)} style={inp} /></Field>
              <Field label="Ubicación"><input value={form.location ?? ""} onChange={e => setF("location", e.target.value)} style={inp} /></Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Inicio (YYYY-MM)"><input value={form.start_date ?? ""} onChange={e => setF("start_date", e.target.value)} style={inp} placeholder="2023-01" /></Field>
                <Field label="Fin (vacío = Actualidad)"><input value={form.end_date ?? ""} onChange={e => setF("end_date", e.target.value)} style={inp} placeholder="2024-06" /></Field>
              </div>
              <Field label="Descripción"><textarea value={form.description ?? ""} onChange={e => setF("description", e.target.value)} rows={3} style={{ ...inp, resize: "vertical" }} /></Field>
              <Field label="Etiquetas (separadas por comas)"><input value={tagsInput} onChange={e => setTagsInput(e.target.value)} style={inp} placeholder="React, TypeScript, PostgreSQL" /></Field>
              <Field label="URL (credencial, empresa)"><input value={form.url ?? ""} onChange={e => setF("url", e.target.value)} style={inp} /></Field>
              <Field label="URL del logo"><input value={form.logo ?? ""} onChange={e => setF("logo", e.target.value)} style={inp} /></Field>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: ".85rem", color: "var(--color-text)", cursor: "pointer" }}>
                <input type="checkbox" checked={form.is_visible ?? true} onChange={e => setF("is_visible", e.target.checked)} />
                Visible en el sitio
              </label>
              {save.isError && <p style={{ color: "#ef4444", fontSize: ".82rem" }}>Error al guardar.</p>}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
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
