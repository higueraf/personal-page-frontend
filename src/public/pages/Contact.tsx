import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Mail, Phone, Linkedin, Github, Twitter, Globe, MessageSquare, Send, CheckCircle, AlertCircle, RefreshCw, Instagram, Youtube, Loader2 } from "lucide-react";
import http from "../../shared/api/http";

interface ContactInfo { id: string; key: string; label: string; value: string; icon?: string; }
interface FormState { name: string; email: string; phone: string; subject: string; message: string; }

const ICON_MAP: Record<string, React.ReactNode> = {
  Mail: <Mail size={18}/>, Phone: <Phone size={18}/>, Linkedin: <Linkedin size={18}/>,
  Github: <Github size={18}/>, Twitter: <Twitter size={18}/>, Globe: <Globe size={18}/>,
  Instagram: <Instagram size={18}/>, Youtube: <Youtube size={18}/>,
  MessageSquare: <MessageSquare size={18}/>,
};

const INITIAL: FormState = { name: "", email: "", phone: "", subject: "", message: "" };

export default function Contact() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [sent, setSent]  = useState(false);
  const [err,  setErr]   = useState<string | null>(null);

  const infoQ = useQuery({
    queryKey: ["public-contact-info"],
    queryFn: () => http.get("/public/contact/info").then(r => r.data.data as ContactInfo[]),
  });

  const mutation = useMutation({
    mutationFn: (data: FormState) => http.post("/public/contact/message", data),
    onSuccess: () => { setSent(true); setForm(INITIAL); setErr(null); },
    onError: (e: any) => setErr(e?.response?.data?.message ?? "No se pudo enviar el mensaje."),
  });

  const contacts = infoQ.data ?? [];

  function set(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }));
  }

  function isUrl(v: string) { return v.startsWith("http"); }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px" }}>
      <div style={{ marginBottom: 36 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.8rem", color: "var(--color-text)", marginBottom: 8 }}>
          Contacto
        </h1>
        <p style={{ color: "var(--color-text-muted)", fontSize: ".95rem", lineHeight: 1.6, maxWidth: 560 }}>
          ¿Tienes un proyecto en mente o quieres colaborar? Escríbeme y te respondo pronto.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 36, alignItems: "start" }}>

        {/* Panel de datos de contacto */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem", color: "var(--color-text)", marginBottom: 6 }}>
            Canales de contacto
          </h2>

          {infoQ.isLoading && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--color-text-muted)", fontSize: ".85rem" }}>
              <RefreshCw size={13}/> Cargando…
            </div>
          )}

          {contacts.map(c => (
            <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "12px 14px" }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--color-bg-muted)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-primary)", flexShrink: 0 }}>
                {ICON_MAP[c.icon ?? ""] ?? <Globe size={18}/>}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: ".72rem", color: "var(--color-text-muted)", marginBottom: 1 }}>{c.label}</div>
                {isUrl(c.value) ? (
                  <a href={c.value} target="_blank" rel="noopener noreferrer"
                    style={{ color: "var(--color-primary)", fontSize: ".88rem", fontWeight: 500, textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block", maxWidth: 200 }}>
                    {c.value.replace(/^https?:\/\//, "")}
                  </a>
                ) : (
                  <span style={{ color: "var(--color-text)", fontSize: ".88rem", fontWeight: 500 }}>{c.value}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Formulario */}
        <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "28px 26px" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem", color: "var(--color-text)", marginBottom: 20 }}>
            Envíame un mensaje
          </h2>

          {sent ? (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <CheckCircle size={40} style={{ color: "#22c55e", display: "block", margin: "0 auto 16px" }} />
              <p style={{ fontWeight: 600, color: "var(--color-text)", marginBottom: 6 }}>¡Mensaje enviado!</p>
              <p style={{ color: "var(--color-text-muted)", fontSize: ".88rem" }}>Lo revisaré pronto y te responderé.</p>
              <button onClick={() => setSent(false)}
                style={{ marginTop: 16, background: "var(--color-primary)", color: "#fff", border: "none", borderRadius: "var(--radius-md)", padding: "8px 18px", cursor: "pointer", fontSize: ".85rem", fontWeight: 600 }}>
                Enviar otro
              </button>
            </div>
          ) : (
            <form onSubmit={e => { e.preventDefault(); mutation.mutate(form); }} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={lbl}>Nombre *</label>
                  <input value={form.name} onChange={set("name")} required style={inp} placeholder="Tu nombre" />
                </div>
                <div>
                  <label style={lbl}>Correo *</label>
                  <input type="email" value={form.email} onChange={set("email")} required style={inp} placeholder="tu@correo.com" />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={lbl}>Teléfono</label>
                  <input value={form.phone} onChange={set("phone")} style={inp} placeholder="+593 99 000 0000" />
                </div>
                <div>
                  <label style={lbl}>Asunto *</label>
                  <input value={form.subject} onChange={set("subject")} required style={inp} placeholder="¿De qué trata?" />
                </div>
              </div>
              <div>
                <label style={lbl}>Mensaje *</label>
                <textarea value={form.message} onChange={set("message")} required rows={5}
                  style={{ ...inp, resize: "vertical", minHeight: 100 }} placeholder="Cuéntame sobre tu proyecto o consulta…" />
              </div>

              {err && (
                <div style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.2)", borderRadius: "var(--radius-md)", padding: "9px 14px", color: "#ef4444", fontSize: ".84rem" }}>
                  <AlertCircle size={14}/> {err}
                </div>
              )}

              <button type="submit" disabled={mutation.isPending}
                style={{ background: "var(--color-primary)", color: "#fff", border: "none", borderRadius: "var(--radius-md)", padding: "11px 0", fontWeight: 600, fontSize: ".9rem", cursor: mutation.isPending ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: mutation.isPending ? .7 : 1 }}>
                {mutation.isPending ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }}/> Enviando…</> : <><Send size={14}/> Enviar mensaje</>}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

const lbl: React.CSSProperties = { display: "block", fontSize: ".78rem", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: 4 };
const inp: React.CSSProperties = { width: "100%", boxSizing: "border-box", background: "var(--color-bg-muted)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "8px 10px", fontSize: ".88rem", color: "var(--color-text)", fontFamily: "var(--font-body)", outline: "none" };
