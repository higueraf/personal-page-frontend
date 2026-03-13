import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Mail, Phone, Eye, CheckCircle, Clock, Reply, Plus, Pencil, X, Save, RefreshCw } from "lucide-react";
import http from "../../shared/api/http";

type MsgStatus = "PENDING" | "READ" | "REPLIED";
interface ContactInfo { id: string; key: string; label: string; value: string; icon?: string; is_visible: boolean; order: number; }
interface ContactMsg { id: string; name: string; email: string; phone?: string; subject: string; message: string; status: MsgStatus; created_at: string; }

const MSG_STATUS: Record<MsgStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  PENDING: { label: "Pendiente", color: "#f59e0b", bg: "rgba(245,158,11,.1)", icon: <Clock size={13}/> },
  READ:    { label: "Leído",     color: "#3b6ef0", bg: "rgba(59,110,240,.1)", icon: <Eye size={13}/> },
  REPLIED: { label: "Respondido",color: "#22c55e", bg: "rgba(34,197,94,.1)", icon: <Reply size={13}/> },
};

export default function AdminContact() {
  const qc = useQueryClient();
  const [tab, setTab]           = useState<"messages"|"info">("messages");
  const [detail, setDetail]     = useState<ContactMsg | null>(null);
  const [infoModal, setInfoModal] = useState<ContactInfo | null | "new">(null);
  const [infoForm, setInfoForm]  = useState<Partial<ContactInfo>>({});
  const [msgFilter, setMsgFilter] = useState<string>("");

  // ── Mensajes ──────────────────────────────────────────────────────────────
  const msgsQ = useQuery({ queryKey: ["admin-msgs", msgFilter], queryFn: () => http.get("/contact/messages", { params: msgFilter ? { status: msgFilter } : {} }).then(r => r.data) });
  const msgs: ContactMsg[] = msgsQ.data?.data ?? [];
  const pending = msgs.filter(m => m.status === "PENDING").length;

  const patchMsg = useMutation({
    mutationFn: ({ id, status }: { id: string; status: MsgStatus }) => http.patch(`/contact/messages/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-msgs"] }),
  });

  function openDetail(m: ContactMsg) {
    setDetail(m);
    if (m.status === "PENDING") {
      patchMsg.mutate({ id: m.id, status: "READ" });
    }
  }

  // ── Info de contacto ──────────────────────────────────────────────────────
  const infoQ = useQuery({ queryKey: ["admin-contact-info"], queryFn: () => http.get("/contact/info").then(r => r.data.data as ContactInfo[]) });
  const contacts = infoQ.data ?? [];

  const saveInfo = useMutation({
    mutationFn: (f: Partial<ContactInfo>) => f.id ? http.patch(`/contact/info/${f.id}`, f) : http.post("/contact/info", f),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-contact-info"] }); setInfoModal(null); },
  });

  function openNewInfo() { setInfoForm({ key:"", label:"", value:"", icon:"", is_visible:true, order:0 }); setInfoModal("new"); }
  function openEditInfo(c: ContactInfo) { setInfoForm({ ...c }); setInfoModal(c); }
  function setIF<K extends keyof ContactInfo>(k: K, v: any) { setInfoForm(f => ({ ...f, [k]: v })); }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <MessageSquare size={20} style={{ color: "var(--color-primary)" }} />
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 700, color: "var(--color-text)" }}>Contacto</h1>
        {pending > 0 && <span style={{ background:"rgba(245,158,11,.15)", color:"#f59e0b", border:"1px solid rgba(245,158,11,.3)", padding:"2px 9px", borderRadius:99, fontSize:".75rem", fontWeight:700 }}>{pending} nuevo{pending > 1 ? "s":""}</span>}
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:0, borderBottom:"1px solid var(--color-border)" }}>
        {(["messages","info"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ background:"none", border:"none", borderBottom: tab===t ? "2px solid var(--color-primary)" : "2px solid transparent", padding:"9px 18px", cursor:"pointer", fontSize:".88rem", fontWeight: tab===t ? 700:400, color: tab===t ? "var(--color-primary)" : "var(--color-text-muted)", fontFamily:"var(--font-body)", marginBottom:-1 }}>
            {t === "messages" ? "Mensajes" : "Info de contacto"}
          </button>
        ))}
      </div>

      {/* Mensajes */}
      {tab === "messages" && (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <div style={{ display:"flex", gap:10 }}>
            <select value={msgFilter} onChange={e => setMsgFilter(e.target.value)} style={{ ...inp, maxWidth:180 }}>
              <option value="">Todos</option>
              <option value="PENDING">Pendientes</option>
              <option value="READ">Leídos</option>
              <option value="REPLIED">Respondidos</option>
            </select>
          </div>
          <div style={{ background:"var(--color-surface)", border:"1px solid var(--color-border)", borderRadius:"var(--radius-lg)", overflow:"hidden" }}>
            {msgsQ.isLoading ? <div style={{ padding:32, display:"flex", gap:8, color:"var(--color-text-muted)" }}><RefreshCw size={14}/> Cargando…</div>
            : msgs.length === 0 ? <div style={{ padding:"48px 24px", textAlign:"center", color:"var(--color-text-muted)" }}>Sin mensajes.</div>
            : <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead><tr style={{ borderBottom:"1px solid var(--color-border)", background:"var(--color-bg-muted)" }}>
                  {["Remitente","Asunto","Estado","Fecha",""].map(h=><th key={h} style={th}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {msgs.map(m => {
                    const st = MSG_STATUS[m.status];
                    return (
                      <tr key={m.id} style={{ borderBottom:"1px solid var(--color-border)", cursor:"pointer" }}
                        onMouseEnter={e=>(e.currentTarget.style.background="var(--color-bg-muted)")}
                        onMouseLeave={e=>(e.currentTarget.style.background="transparent")}
                        onClick={() => openDetail(m)}>
                        <td style={td}>
                          <div style={{ fontWeight: m.status==="PENDING" ? 700:400, color:"var(--color-text)", fontSize:".88rem" }}>{m.name}</div>
                          <div style={{ fontSize:".75rem", color:"var(--color-text-muted)", fontFamily:"var(--font-mono)" }}>{m.email}</div>
                        </td>
                        <td style={{ ...td, maxWidth:240, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{m.subject}</td>
                        <td style={td}><span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"3px 9px", borderRadius:99, background:st.bg, color:st.color, fontSize:".75rem", fontWeight:600 }}>{st.icon} {st.label}</span></td>
                        <td style={{ ...td, fontSize:".78rem", color:"var(--color-text-muted)" }}>{new Date(m.created_at).toLocaleDateString("es-EC",{ day:"2-digit", month:"short", year:"numeric" })}</td>
                        <td style={td}><Eye size={14} style={{ color:"var(--color-primary)" }}/></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            }
          </div>
        </div>
      )}

      {/* Info de contacto */}
      {tab === "info" && (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <div style={{ display:"flex", justifyContent:"flex-end" }}>
            <button onClick={openNewInfo} style={{ ...btnPrimary, display:"flex", alignItems:"center", gap:6 }}><Plus size={15}/> Nuevo canal</button>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {infoQ.isLoading && <div style={{ display:"flex", gap:8, color:"var(--color-text-muted)" }}><RefreshCw size={14}/> Cargando…</div>}
            {contacts.map(c => (
              <div key={c.id} style={{ background:"var(--color-surface)", border:"1px solid var(--color-border)", borderRadius:"var(--radius-md)", padding:"14px 18px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
                <div>
                  <div style={{ fontSize:".72rem", color:"var(--color-text-muted)", marginBottom:2 }}>{c.label} <span style={{ fontFamily:"var(--font-mono)", opacity:.6 }}>[{c.key}]</span></div>
                  <div style={{ fontWeight:600, color:"var(--color-text)", fontSize:".9rem" }}>{c.value}</div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  {!c.is_visible && <span style={{ fontSize:".72rem", color:"var(--color-text-muted)" }}>oculto</span>}
                  <button onClick={()=>openEditInfo(c)} style={btnIcon}><Pencil size={13}/></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal detalle de mensaje */}
      {detail && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.55)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:24 }}
          onClick={e=>{ if(e.target===e.currentTarget) setDetail(null); }}>
          <div style={{ background:"var(--color-surface)", border:"1px solid var(--color-border)", borderRadius:"var(--radius-lg)", padding:"28px 26px", width:"100%", maxWidth:520, maxHeight:"90vh", overflowY:"auto" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
              <h3 style={{ fontFamily:"var(--font-display)", fontWeight:700, fontSize:"1.1rem", color:"var(--color-text)", margin:0 }}>Mensaje de {detail.name}</h3>
              <button onClick={()=>setDetail(null)} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--color-text-muted)" }}><X size={18}/></button>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              <InfoRow icon={<Mail size={14}/>} label="Email" value={detail.email} />
              {detail.phone && <InfoRow icon={<Phone size={14}/>} label="Teléfono" value={detail.phone} />}
              <InfoRow icon={<MessageSquare size={14}/>} label="Asunto" value={detail.subject} />
              <div style={{ background:"var(--color-bg-muted)", border:"1px solid var(--color-border)", borderRadius:"var(--radius-md)", padding:"12px 14px", fontSize:".88rem", lineHeight:1.7, color:"var(--color-text)", whiteSpace:"pre-wrap" }}>
                {detail.message}
              </div>
            </div>
            <div style={{ display:"flex", gap:10, marginTop:20, justifyContent:"flex-end" }}>
              <select value={detail.status} onChange={e => {
                const st = e.target.value as MsgStatus;
                setDetail(d => d ? { ...d, status: st } : d);
                patchMsg.mutate({ id: detail.id, status: st });
              }} style={{ ...inp, maxWidth:160 }}>
                <option value="PENDING">Pendiente</option>
                <option value="READ">Leído</option>
                <option value="REPLIED">Respondido</option>
              </select>
              <button onClick={()=>setDetail(null)} style={btnSecondary}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal info de contacto */}
      {infoModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.55)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:24 }}
          onClick={e=>{ if(e.target===e.currentTarget) setInfoModal(null); }}>
          <div style={{ background:"var(--color-surface)", border:"1px solid var(--color-border)", borderRadius:"var(--radius-lg)", padding:"28px 26px", width:"100%", maxWidth:420 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
              <h3 style={{ fontFamily:"var(--font-display)", fontWeight:700, fontSize:"1.1rem", color:"var(--color-text)", margin:0 }}>{infoModal==="new"?"Nuevo canal":"Editar canal"}</h3>
              <button onClick={()=>setInfoModal(null)} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--color-text-muted)" }}><X size={18}/></button>
            </div>
            <form onSubmit={e=>{ e.preventDefault(); saveInfo.mutate(infoForm); }} style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <Field label="Clave (único: email, phone, linkedin…)"><input value={infoForm.key??""} onChange={e=>setIF("key",e.target.value)} required style={inp} placeholder="linkedin" /></Field>
              <Field label="Etiqueta"><input value={infoForm.label??""} onChange={e=>setIF("label",e.target.value)} required style={inp} placeholder="LinkedIn" /></Field>
              <Field label="Valor"><input value={infoForm.value??""} onChange={e=>setIF("value",e.target.value)} required style={inp} placeholder="https://linkedin.com/in/…" /></Field>
              <Field label="Ícono (nombre Lucide: Mail, Phone, Linkedin…)"><input value={infoForm.icon??""} onChange={e=>setIF("icon",e.target.value)} style={inp} /></Field>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <Field label="Orden"><input type="number" value={infoForm.order??0} onChange={e=>setIF("order",parseInt(e.target.value))} style={inp} /></Field>
                <div style={{ display:"flex", alignItems:"center", gap:8, paddingTop:22 }}>
                  <label style={{ display:"flex", alignItems:"center", gap:6, fontSize:".85rem", cursor:"pointer" }}>
                    <input type="checkbox" checked={infoForm.is_visible??true} onChange={e=>setIF("is_visible",e.target.checked)}/> Visible
                  </label>
                </div>
              </div>
              <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:4 }}>
                <button type="button" onClick={()=>setInfoModal(null)} style={btnSecondary}>Cancelar</button>
                <button type="submit" disabled={saveInfo.isPending} style={{ ...btnPrimary, display:"flex", alignItems:"center", gap:6 }}>
                  <Save size={14}/> Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:".85rem" }}>
      <span style={{ color:"var(--color-primary)" }}>{icon}</span>
      <span style={{ color:"var(--color-text-muted)", minWidth:60 }}>{label}:</span>
      <span style={{ color:"var(--color-text)", fontWeight:500 }}>{value}</span>
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
