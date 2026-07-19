import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Mail, Phone, Linkedin, Github, Twitter, Globe, MessageSquare, Send, CheckCircle, AlertCircle, RefreshCw, Instagram, Youtube, Loader2 } from "lucide-react";
import { contactUseCases } from "../../../infrastructure/factories/contact-module.factory";
import PageHeader from "@/presentation/components/patterns/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/presentation/components/ui/card";
import { Input } from "@/presentation/components/ui/input";
import { Label } from "@/presentation/components/ui/label";
import { Textarea } from "@/presentation/components/ui/textarea";
import { Button } from "@/presentation/components/ui/button";

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
    queryFn: () => contactUseCases.getPublicInfo(),
  });

  const mutation = useMutation({
    mutationFn: (data: FormState) => contactUseCases.sendMessage(data),
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
    <div className="mx-auto max-w-4xl px-6 py-10">
      <PageHeader
        icon={Mail}
        title="Contacto"
        subtitle="¿Tienes un proyecto en mente o quieres colaborar? Escríbeme y te respondo pronto."
      />

      <div className="grid items-start gap-9 md:grid-cols-[1fr_1.5fr]">

        {/* Panel de datos de contacto */}
        <div className="flex flex-col gap-2.5">
          <h2 className="mb-1 font-display text-sm font-semibold text-foreground">
            Canales de contacto
          </h2>

          {infoQ.isLoading && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <RefreshCw size={13} className="animate-spin" /> Cargando…
            </div>
          )}

          {contacts.map(c => (
            <Card key={c.id} className="shadow-none">
              <CardContent className="flex items-center gap-3 p-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
                  {ICON_MAP[c.icon ?? ""] ?? <Globe size={18}/>}
                </div>
                <div className="min-w-0">
                  <div className="mb-0.5 text-xs text-muted-foreground">{c.label}</div>
                  {isUrl(c.value) ? (
                    <a
                      href={c.value}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block max-w-[200px] truncate text-sm font-medium text-primary no-underline hover:underline"
                    >
                      {c.value.replace(/^https?:\/\//, "")}
                    </a>
                  ) : (
                    <span className="text-sm font-medium text-foreground">{c.value}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Formulario */}
        <Card>
          <CardHeader className="flex-row items-center gap-2.5 space-y-0 pb-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Send size={16} />
            </div>
            <CardTitle className="font-display text-base">Envíame un mensaje</CardTitle>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <CheckCircle size={40} className="mb-2 text-green-500" />
                <p className="font-semibold text-foreground">¡Mensaje enviado!</p>
                <p className="text-sm text-muted-foreground">Lo revisaré pronto y te responderé.</p>
                <Button variant="outline" onClick={() => setSent(false)} className="mt-3">
                  Enviar otro
                </Button>
              </div>
            ) : (
              <form onSubmit={e => { e.preventDefault(); mutation.mutate(form); }} className="flex flex-col gap-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="contact-name">Nombre *</Label>
                    <Input id="contact-name" value={form.name} onChange={set("name")} required placeholder="Tu nombre" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="contact-email">Correo *</Label>
                    <Input id="contact-email" type="email" value={form.email} onChange={set("email")} required placeholder="tu@correo.com" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="contact-phone">Teléfono</Label>
                    <Input id="contact-phone" value={form.phone} onChange={set("phone")} placeholder="+593 99 000 0000" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="contact-subject">Asunto *</Label>
                    <Input id="contact-subject" value={form.subject} onChange={set("subject")} required placeholder="¿De qué trata?" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contact-message">Mensaje *</Label>
                  <Textarea
                    id="contact-message"
                    value={form.message}
                    onChange={set("message")}
                    required
                    rows={5}
                    className="min-h-[100px] resize-y"
                    placeholder="Cuéntame sobre tu proyecto o consulta…"
                  />
                </div>

                {err && (
                  <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                    <AlertCircle size={14}/> {err}
                  </div>
                )}

                <Button type="submit" disabled={mutation.isPending} className="w-full">
                  {mutation.isPending ? <Loader2 size={14} className="animate-spin"/> : <Send size={14}/>}
                  {mutation.isPending ? "Enviando…" : "Enviar mensaje"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
