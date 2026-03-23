import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BookMarked, Plus, Pencil, Trash2, RefreshCw, X, Save } from "lucide-react";
import http from "../../shared/api/http";
import Pagination from "../../shared/components/Pagination";

type ResType = "LINK" | "BOOK" | "TOOL" | "COURSE" | "VIDEO" | "ARTICLE" | "OTHER";
interface Resource { id: string; title: string; description?: string; type: ResType; url?: string; tags?: string[]; is_free: boolean; is_published: boolean; order: number; }

const TYPES = ["LINK","BOOK","TOOL","COURSE","VIDEO","ARTICLE","OTHER"];
const TYPE_LABEL: Record<string,string> = { LINK:"Enlace",BOOK:"Libro",TOOL:"Herramienta",COURSE:"Curso",VIDEO:"Video",ARTICLE:"Artículo",OTHER:"Otro" };
const EMPTY: Partial<Resource> = { title:"",description:"",type:"LINK",url:"",tags:[],is_free:true,is_published:false,order:0 };

export default function AdminResources() {
  const qc = useQueryClient();
  const [modal, setModal]         = useState<"create"|"edit"|null>(null);
  const [form,  setForm]          = useState<Partial<Resource>>(EMPTY);
  const [tagsInput, setTagsInput] = useState("");

  const listQ = useQuery({ queryKey: ["admin-resources"], queryFn: () => http.get("/resources").then(r => r.data) });
  const resources: Resource[] = listQ.data?.data ?? [];

  const save = useMutation({
    mutationFn: (p: Partial<Resource>) => p.id ? http.put(`/resources/${p.id}`, p) : http.post("/resources", p),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-resources"] }); setModal(null); },
  });
  const del = useMutation({
    mutationFn: (id: string) => http.delete(`/resources/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-resources"] }),
  });

  function openCreate() { setForm(EMPTY); setTagsInput(""); setModal("create"); }
  function openEdit(r: Resource) { setForm({ ...r }); setTagsInput((r.tags ?? []).join(", ")); setModal("edit"); }
  function setF<K extends keyof Resource>(k: K, v: any) { setForm(f => ({ ...f, [k]: v })); }
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    save.mutate({ ...form, tags: tagsInput.split(",").map(s=>s.trim()).filter(Boolean) });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <BookMarked size={20} style={{ color: "var(--color-primary)" }} />
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 700, color: "var(--color-text)" }}>Recursos</h1>
        </div>
        <button onClick={openCreate} style={{ ...btnPrimary, display: "flex", alignItems: "center", gap: 6 }}><Plus size={15}/> Nuevo recurso</button>
      </div>

      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
        {listQ.isLoading ? <div style={{ padding: 32, display:"flex", gap:8, color:"var(--color-text-muted)" }}><RefreshCw size={14}/> Cargando…</div>
        : resources.length === 0 ? <div style={{ padding:"48px 24px", textAlign:"center", color:"var(--color-text-muted)" }}>Sin recursos.</div>
        : <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr style={{ borderBottom:"1px solid var(--color-border)", background:"var(--color-bg-muted)" }}>
              {["Título","Tipo","Tags","Gratis","Publicado",""].map(h => <th key={h} style={th}>{h}</th>)}
            </tr></thead>
            <tbody>
              {resources.map(r => (
                <tr key={r.id} style={{ borderBottom:"1px solid var(--color-border)" }}
                  onMouseEnter={e=>(e.currentTarget.style.background="var(--color-bg-muted)")}
                  onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
                  <td style={td}><div style={{ fontWeight:600, fontSize:".88rem" }}>{r.title}</div>{r.description&&<div style={{ fontSize:".75rem", color:"var(--color-text-muted)", maxWidth:240, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.description}</div>}</td>
                  <td style={td}><span style={{ background:"var(--color-bg-muted)", border:"1px solid var(--color-border)", padding:"1px 7px", borderRadius:99, fontSize:".72rem", color:"var(--color-text-muted)" }}>{TYPE_LABEL[r.type]}</span></td>
                  <td style={{ ...td, fontSize:".75rem", color:"var(--color-text-muted)" }}>{r.tags?.join(", ") || "—"}</td>
                  <td style={td}>{r.is_free ? "✓" : "—"}</td>
                  <td style={td}>{r.is_published ? <span style={{ color:"#22c55e", fontWeight:600 }}>✓</span> : "—"}</td>
                  <td style={{ ...td, display:"flex", gap:6 }}>
                    <button onClick={()=>openEdit(r)} style={btnIcon}><Pencil size={13}/></button>
                    <button onClick={()=>{ if(confirm("¿Eliminar?")) del.mutate(r.id); }} style={{ ...btnIcon, color:"#ef4444" }}><Trash2 size={13}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        }
      </div>

      {modal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.55)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:24 }}
          onClick={e=>{ if(e.target===e.currentTarget) setModal(null); }}>
          <div style={{ background:"var(--color-surface)", border:"1px solid var(--color-border)", borderRadius:"var(--radius-lg)", padding:"28px 26px", width:"100%", maxWidth:480, maxHeight:"90vh", overflowY:"auto" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
              <h3 style={{ fontFamily:"var(--font-display)", fontWeight:700, fontSize:"1.1rem", color:"var(--color-text)", margin:0 }}>{modal==="create"?"Nuevo recurso":"Editar recurso"}</h3>
              <button onClick={()=>setModal(null)} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--color-text-muted)" }}><X size={18}/></button>
            </div>
            <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <Field label="Título *"><input value={form.title??""} onChange={e=>setF("title",e.target.value)} required style={inp} /></Field>
              <Field label="Descripción"><textarea value={form.description??""} onChange={e=>setF("description",e.target.value)} rows={3} style={{ ...inp, resize:"vertical" }} /></Field>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <Field label="Tipo">
                  <select value={form.type??"LINK"} onChange={e=>setF("type",e.target.value)} style={inp}>
                    {TYPES.map(t=><option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
                  </select>
                </Field>
                <Field label="Orden"><input type="number" value={form.order??0} onChange={e=>setF("order",parseInt(e.target.value))} style={inp} /></Field>
              </div>
              <Field label="URL"><input value={form.url??""} onChange={e=>setF("url",e.target.value)} style={inp} placeholder="https://…" /></Field>
              <Field label="Etiquetas (comas)"><input value={tagsInput} onChange={e=>setTagsInput(e.target.value)} style={inp} placeholder="React, TypeScript" /></Field>
              <div style={{ display:"flex", gap:16 }}>
                <label style={{ display:"flex", alignItems:"center", gap:6, fontSize:".85rem", color:"var(--color-text)", cursor:"pointer" }}>
                  <input type="checkbox" checked={form.is_free??true} onChange={e=>setF("is_free",e.target.checked)}/> Gratuito
                </label>
                <label style={{ display:"flex", alignItems:"center", gap:6, fontSize:".85rem", color:"var(--color-text)", cursor:"pointer" }}>
                  <input type="checkbox" checked={form.is_published??false} onChange={e=>setF("is_published",e.target.checked)}/> Publicado
                </label>
              </div>
              {save.isError && <p style={{ color:"#ef4444", fontSize:".82rem" }}>Error al guardar.</p>}
              <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
                <button type="button" onClick={()=>setModal(null)} style={btnSecondary}>Cancelar</button>
                <button type="submit" disabled={save.isPending} style={{ ...btnPrimary, display:"flex", alignItems:"center", gap:6, opacity:save.isPending?.7:1 }}>
                  <Save size={14}/> {save.isPending?"Guardando…":"Guardar"}
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
  return <div><label style={{ display:"block", fontSize:".78rem", fontWeight:600, color:"var(--color-text-muted)", marginBottom:4 }}>{label}</label>{children}</div>;
}
const th: React.CSSProperties = { padding:"9px 14px", textAlign:"left", fontSize:".72rem", fontWeight:700, color:"var(--color-text-muted)", textTransform:"uppercase", letterSpacing:".06em" };
const td: React.CSSProperties = { padding:"11px 14px", fontSize:".85rem", color:"var(--color-text)", verticalAlign:"middle" };
const inp: React.CSSProperties = { width:"100%", boxSizing:"border-box", background:"var(--color-bg-muted)", border:"1px solid var(--color-border)", borderRadius:"var(--radius-md)", padding:"8px 10px", fontSize:".87rem", color:"var(--color-text)", fontFamily:"var(--font-body)", outline:"none" };
const btnPrimary: React.CSSProperties = { background:"var(--color-primary)", color:"#fff", border:"none", borderRadius:"var(--radius-md)", padding:"8px 16px", fontSize:".85rem", fontWeight:600, cursor:"pointer" };
const btnSecondary: React.CSSProperties = { background:"var(--color-bg-muted)", color:"var(--color-text)", border:"1px solid var(--color-border)", borderRadius:"var(--radius-md)", padding:"8px 16px", fontSize:".85rem", cursor:"pointer" };
const btnIcon: React.CSSProperties = { background:"var(--color-bg-muted)", border:"1px solid var(--color-border)", borderRadius:6, padding:"5px 7px", cursor:"pointer", color:"var(--color-text-muted)", display:"flex", alignItems:"center" };
