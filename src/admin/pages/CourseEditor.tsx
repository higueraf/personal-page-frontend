/**
 * CourseEditor.tsx
 * Editor de cursos con video — 1 sola pantalla.
 *
 * Layout:
 *  ┌──────────────────────┬──────────────────────────────────────────────┐
 *  │ SECCIONES/LECCIONES  │  Formulario de la lección activa             │
 *  │                      │  · Sección (selector/crear)                  │
 *  │  ▸ Módulo 1          │  · Título                                    │
 *  │    01 Introducción ← │  · Tipo de video: YouTube / Vimeo / Archivo  │
 *  │    02 Instalación    │  · URL o upload                              │
 *  │  ▸ Módulo 2          │  · Markdown de apoyo (con preview)           │
 *  │    03 Props          │  · Estado / vista previa gratuita            │
 *  │  [+ Sección]         │  [ Guardar ]                                 │
 *  │  [+ Lección]         │                                              │
 *  └──────────────────────┴──────────────────────────────────────────────┘
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Plus, Trash2, ChevronRight, BookOpen, RefreshCw,
  Save, Eye, Edit3, Video, Youtube, FileVideo, AlertCircle,
  ChevronDown, ChevronUp, GripVertical,
} from "lucide-react";
import {
  adminVideoCourses, adminVideoSections, adminVideoLessons,
  type AdminVideoSection, type AdminVideoLesson, type VideoType, type VLStatus,
} from "../api";
import hljs from "highlight.js";

// ── Parser Markdown (reutilizado del TutorialEditor) ─────────────────────────

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
function inl(raw: string): string {
  const s = esc(raw);
  return s
    .replace(/`([^`]+)`/g,'<code style="background:var(--color-bg-muted);padding:1px 6px;border-radius:4px;font-family:var(--font-mono);font-size:.87em;color:var(--color-primary)">$1</code>')
    .replace(/\*\*(.+?)\*\*/g,'<strong style="color:var(--color-text)">$1</strong>')
    .replace(/__(.+?)__/g,'<strong style="color:var(--color-text)">$1</strong>')
    .replace(/\*(.+?)\*/g,'<em>$1</em>').replace(/_(.+?)_/g,'<em>$1</em>')
    .replace(/\[(.+?)\]\((.+?)\)/g,'<a href="$2" style="color:var(--color-primary);text-decoration:underline">$1</a>');
}
function mdToHtml(md: string): string {
  if (!md) return "";
  const lines = md.split("\n"); const out: string[] = []; let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim()||"code"; const code: string[] = [];
      i++; while (i<lines.length&&!lines[i].startsWith("```")){code.push(lines[i]);i++;}

      let highlightedCode = "";
      try {
        if (lang && hljs.getLanguage(lang)) {
          highlightedCode = hljs.highlight(code.join("\n"), { language: lang }).value;
        } else {
          highlightedCode = hljs.highlightAuto(code.join("\n")).value;
        }
      } catch (e) {
        highlightedCode = esc(code.join("\n"));
      }

      const id="cb"+Math.random().toString(36).slice(2,7);
      out.push('<div style="margin:1.25rem 0"><div style="display:flex;align-items:center;justify-content:space-between;background:var(--color-bg-muted);border-radius:6px 6px 0 0;padding:6px 14px;border:1px solid var(--color-border);border-bottom:none"><span style="font-family:var(--font-mono);font-size:.73rem;color:var(--color-text-muted)">'+lang+'</span><button onclick="(function(b){var t=b.innerText;navigator.clipboard.writeText(document.getElementById(\''+id+'\').innerText);b.innerText=\'Copiado!\';setTimeout(()=>b.innerText=t,1500)})(this)" style="background:var(--color-surface);color:var(--color-primary);border:1px solid var(--color-border);padding:3px 10px;font-size:.72rem;border-radius:4px;cursor:pointer">Copiar</button></div><pre id="'+id+'" style="background:var(--color-bg-muted);margin:0;padding:1.1rem 1.25rem;border-radius:0 0 6px 6px;overflow-x:auto;border:1px solid var(--color-border);border-top:none;font-family:var(--font-mono);font-size:.87rem;line-height:1.6;color:var(--color-text)"><code>'+highlightedCode+'</code></pre></div>');
      i++; continue;
    }
    const hm=line.match(/^(#{1,6})\s+(.+)/);
    if(hm){const lvl=hm[1].length;const sz=["1.85rem","1.45rem","1.18rem","1rem","0.9rem","0.85rem"][lvl-1];const mt=["2rem","1.75rem","1.5rem","1.25rem","1rem","1rem"][lvl-1];out.push('<h'+lvl+' style="color:var(--color-primary);margin:'+mt+' 0 .5rem;font-size:'+sz+';font-family:var(--font-display);font-weight:700">'+inl(hm[2])+'</h'+lvl+'>');i++;continue;}
    if(/^[-*_]{3,}\s*$/.test(line)){out.push('<hr style="border:none;border-top:1px solid var(--color-border);margin:2rem 0"/>');i++;continue;}
    if(/^[-*+]\s/.test(line)){const items:string[]=[];while(i<lines.length&&/^[-*+]\s/.test(lines[i])){items.push('<li style="margin:.3rem 0;line-height:1.65">'+inl(lines[i].replace(/^[-*+]\s/,""))+'</li>');i++;}out.push('<ul style="padding-left:1.6rem;margin:.6rem 0;color:var(--color-text)">'+items.join("")+'</ul>');continue;}
    if(/^\d+\.\s/.test(line)){const items:string[]=[];while(i<lines.length&&/^\d+\.\s/.test(lines[i])){items.push('<li style="margin:.3rem 0;line-height:1.65">'+inl(lines[i].replace(/^\d+\.\s/,""))+'</li>');i++;}out.push('<ol style="padding-left:1.6rem;margin:.6rem 0;color:var(--color-text)">'+items.join("")+'</ol>');continue;}
    if(line.startsWith("> ")){out.push('<div style="border-left:3px solid var(--color-primary);background:var(--color-bg-muted);padding:.8rem 1.1rem;border-radius:0 6px 6px 0;margin:1rem 0;color:var(--color-text-muted);font-style:italic">'+inl(line.slice(2))+'</div>');i++;continue;}
    if(line.trim()===""){out.push("");i++;continue;}
    const para:string[]=[];
    while(i<lines.length&&lines[i].trim()!==""&&!lines[i].startsWith("#")&&!lines[i].startsWith("```")&&!/^[-*+]\s/.test(lines[i])&&!/^\d+\.\s/.test(lines[i])&&!/^[-*_]{3,}/.test(lines[i])&&!lines[i].startsWith("> ")){para.push(inl(lines[i]));i++;}
    if(para.length)out.push('<p style="margin:.6rem 0;line-height:1.75;color:var(--color-text)">'+para.join("<br/>")+'</p>');
  }
  return out.join("\n");
}

// ── Tipos locales ─────────────────────────────────────────────────────────────

interface SectionWithLessons {
  section: AdminVideoSection;
  lessons: AdminVideoLesson[];
  collapsed: boolean;
}

const EMPTY_LESSON: Partial<AdminVideoLesson> = {
  title: "", order: 1, status: "DRAFT",
  video_type: "none", video_url: "", markdown: "", is_free_preview: false,
};

// ── Componente ────────────────────────────────────────────────────────────────

export default function CourseEditor() {
  const { courseId } = useParams<{ courseId: string }>();
  const qc = useQueryClient();

  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [mdMode, setMdMode] = useState<"edit"|"preview">("edit");
  const [form, setForm] = useState<Partial<AdminVideoLesson>>(EMPTY_LESSON);
  const [saved, setSaved] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sections, setSections] = useState<SectionWithLessons[]>([]);

  // Modales
  const [newSectionName, setNewSectionName] = useState("");
  const [addingSection, setAddingSection]   = useState(false);
  const [deleteLesson, setDeleteLesson]     = useState<string|null>(null);
  const [deleteSection, setDeleteSection]   = useState<string|null>(null);

  const saveTimer = useRef<ReturnType<typeof setTimeout>|null>(null);
  const inp: React.CSSProperties = { width:"100%", padding:"8px 12px", background:"var(--color-bg-muted)", border:"1.5px solid var(--color-border)", borderRadius:"var(--radius-md)", color:"var(--color-text)", fontFamily:"var(--font-body)", fontSize:".88rem", outline:"none", boxSizing:"border-box" as const };
  const lbl: React.CSSProperties = { display:"block", fontSize:".78rem", fontWeight:600, color:"var(--color-text-muted)", marginBottom:5, textTransform:"uppercase", letterSpacing:".04em" };

  // ── Queries ───────────────────────────────────────────────────────────────

  const courseQ = useQuery({
    queryKey: ["vc", courseId],
    queryFn: () => adminVideoCourses.get(courseId!),
    enabled: !!courseId,
  });

  const sectionsQ = useQuery({
    queryKey: ["vc-sections", courseId],
    queryFn: () => adminVideoSections.list({ course_id: courseId }).then(r => r.data),
    enabled: !!courseId,
  });

  const lessonsQ = useQuery({
    queryKey: ["vc-lessons", courseId],
    queryFn: async () => {
      const secs = sectionsQ.data ?? [];
      const all: AdminVideoLesson[] = [];
      for (const s of secs) {
        const res = await adminVideoLessons.list({ section_id: s.id });
        all.push(...res.data);
      }
      return all;
    },
    enabled: !!sectionsQ.data?.length,
  });

  // Construir árbol secciones → lecciones
  useEffect(() => {
    const secs = sectionsQ.data ?? [];
    const lessons = lessonsQ.data ?? [];
    setSections(secs.map(s => ({
      section: s,
      lessons: lessons.filter(l => l.section === s.id).sort((a,b) => a.order - b.order),
      collapsed: false,
    })));
  }, [sectionsQ.data, lessonsQ.data]);

  // Cargar lección activa en el form
  useEffect(() => {
    if (!activeLessonId) { setForm(EMPTY_LESSON); return; }
    const lesson = lessonsQ.data?.find(l => l.id === activeLessonId);
    if (lesson) { setForm({ ...lesson }); setSaved(true); }
  }, [activeLessonId, lessonsQ.data]);

  // ── Guardar ───────────────────────────────────────────────────────────────

  const scheduleAutoSave = (data: Partial<AdminVideoLesson>) => {
    setSaved(false);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => doSave(data), 1500);
  };

  const doSave = useCallback(async (data: Partial<AdminVideoLesson>) => {
    if (!activeLessonId) return;
    setSaving(true);
    try {
      await adminVideoLessons.update(activeLessonId, data);
      setSaved(true);
      qc.invalidateQueries({ queryKey: ["vc-lessons", courseId] });
    } finally { setSaving(false); }
  }, [activeLessonId, courseId]);

  const handleField = (patch: Partial<AdminVideoLesson>) => {
    const next = { ...form, ...patch };
    setForm(next);
    if (activeLessonId) scheduleAutoSave(next);
  };

  const saveNow = () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    if (activeLessonId) doSave(form);
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if ((e.ctrlKey||e.metaKey)&&e.key==="s"){e.preventDefault();saveNow();} };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [form, activeLessonId]);

  // ── Mutaciones ────────────────────────────────────────────────────────────

  const createSectionM = useMutation({
    mutationFn: (title: string) => adminVideoSections.create({
      course: courseId, title,
      order: (sectionsQ.data?.length ?? 0) + 1,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vc-sections", courseId] });
      setAddingSection(false); setNewSectionName("");
    },
  });

  const createLessonM = useMutation({
    mutationFn: (sectionId: string) => {
      const sectionLessons = sections.find(s => s.section.id === sectionId)?.lessons ?? [];
      return adminVideoLessons.create({
        section: sectionId,
        title: "Nueva lección",
        order: (sectionLessons[sectionLessons.length-1]?.order ?? 0) + 1,
        status: "DRAFT", video_type: "none", markdown: "", is_free_preview: false,
      });
    },
    onSuccess: (l) => {
      qc.invalidateQueries({ queryKey: ["vc-lessons", courseId] });
      setActiveLessonId(l.id);
    },
  });

  const deleteLessonM = useMutation({
    mutationFn: (id: string) => adminVideoLessons.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vc-lessons", courseId] });
      setDeleteLesson(null); setActiveLessonId(null); setForm(EMPTY_LESSON);
    },
  });

  const deleteSectionM = useMutation({
    mutationFn: async (sectionId: string) => {
      const sLessons = sections.find(s => s.section.id === sectionId)?.lessons ?? [];
      for (const l of sLessons) await adminVideoLessons.delete(l.id);
      await adminVideoSections.delete(sectionId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vc-sections", courseId] });
      qc.invalidateQueries({ queryKey: ["vc-lessons", courseId] });
      setDeleteSection(null);
    },
  });

  // ── Video preview helper ──────────────────────────────────────────────────

  function VideoPreview() {
    const { video_type, video_url, video_file } = form;
    if (video_type === "youtube" && video_url) {
      let id = video_url;
      for (const p of ["https://www.youtube.com/watch?v=","https://youtu.be/","https://youtube.com/watch?v="]) {
        if (video_url.startsWith(p)) { id = video_url.slice(p.length).split("&")[0]; break; }
      }
      return <iframe src={`https://www.youtube.com/embed/${id}?rel=0`} style={{ width:"100%", aspectRatio:"16/9", border:"none", borderRadius:"var(--radius-md)" }} allowFullScreen/>;
    }
    if (video_type === "vimeo" && video_url) {
      const id = video_url.includes("/") ? video_url.split("/").pop() : video_url;
      return <iframe src={`https://player.vimeo.com/video/${id}?dnt=1`} style={{ width:"100%", aspectRatio:"16/9", border:"none", borderRadius:"var(--radius-md)" }} allowFullScreen/>;
    }
    if (video_type === "file" && video_file) {
      const src = `${import.meta.env.VITE_API_BASE_URL?.replace("/api","")}/api/video-stream/${activeLessonId}/`;
      return <video src={src} controls style={{ width:"100%", borderRadius:"var(--radius-md)", background:"#000" }}/>;
    }
    return (
      <div style={{ aspectRatio:"16/9", background:"var(--color-bg-muted)", borderRadius:"var(--radius-md)", border:"1px solid var(--color-border)", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--color-text-muted)", flexDirection:"column", gap:8 }}>
        <Video size={36} style={{ opacity:.2 }}/>
        <span style={{ fontSize:".83rem" }}>Sin video</span>
      </div>
    );
  }

  const course = courseQ.data;
  const activeLesson = lessonsQ.data?.find(l => l.id === activeLessonId);

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"calc(100vh - 64px)", overflow:"hidden" }}>

      {/* Top bar */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 20px", background:"var(--color-surface)", borderBottom:"1px solid var(--color-border)", flexShrink:0, gap:12, flexWrap:"wrap" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <Link to="/admin/video-courses" style={{ display:"flex", alignItems:"center", gap:5, color:"var(--color-primary)", fontSize:".85rem", textDecoration:"none" }}>
            <ArrowLeft size={14}/> Cursos
          </Link>
          <ChevronRight size={13} style={{ color:"var(--color-border)" }}/>
          <Video size={16} style={{ color:"var(--color-primary)" }}/>
          <span style={{ fontFamily:"var(--font-display)", fontWeight:700, fontSize:"1rem", color:"var(--color-text)" }}>
            {course?.title ?? "…"}
          </span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:".72rem", fontFamily:"var(--font-mono)", display:"flex", alignItems:"center", gap:4, color: saved ? "#22c55e" : saving ? "var(--color-accent)" : "#f59e0b" }}>
            {saving ? <><RefreshCw size={11}/> Guardando…</> : saved ? <>● Guardado</> : <>● Sin guardar</>}
          </span>
          <button onClick={saveNow} disabled={saving||saved||!activeLessonId} style={{ display:"flex", alignItems:"center", gap:6, background: saved||!activeLessonId ? "var(--color-bg-muted)" : "var(--color-primary)", border:"1px solid var(--color-border)", color: saved||!activeLessonId ? "var(--color-text-muted)" : "#fff", borderRadius:"var(--radius-md)", padding:"7px 14px", fontSize:".82rem", fontWeight:600, cursor: saved||!activeLessonId ? "default" : "pointer" }}>
            <Save size={14}/> Guardar (Ctrl+S)
          </button>
        </div>
      </div>

      <div style={{ display:"flex", flex:1, overflow:"hidden" }}>

        {/* ── Sidebar: árbol secciones/lecciones ─────────────────────────────── */}
        <aside style={{ width:260, flexShrink:0, borderRight:"1px solid var(--color-border)", background:"var(--color-bg-muted)", display:"flex", flexDirection:"column", overflow:"hidden" }}>
          <div style={{ padding:"12px 14px 8px", display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:"1px solid var(--color-border)" }}>
            <span style={{ fontSize:".72rem", fontWeight:700, color:"var(--color-text-muted)", textTransform:"uppercase", letterSpacing:".05em" }}>Estructura</span>
            <button onClick={() => setAddingSection(true)} title="Nueva sección" style={{ background:"var(--color-primary)", border:"none", color:"#fff", borderRadius:"50%", width:22, height:22, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
              <Plus size={13}/>
            </button>
          </div>

          {addingSection && (
            <div style={{ padding:"8px 10px", borderBottom:"1px solid var(--color-border)", display:"flex", flexDirection:"column", gap:6 }}>
              <input autoFocus placeholder="Nombre de la sección…" value={newSectionName}
                onChange={e => setNewSectionName(e.target.value)}
                onKeyDown={e => {
                  if (e.key==="Enter"&&newSectionName.trim()) createSectionM.mutate(newSectionName.trim());
                  if (e.key==="Escape") { setAddingSection(false); setNewSectionName(""); }
                }}
                style={{ ...inp, padding:"6px 9px" }}
              />
              <div style={{ display:"flex", gap:6 }}>
                <button onClick={() => newSectionName.trim()&&createSectionM.mutate(newSectionName.trim())} disabled={createSectionM.isPending} style={{ flex:1, background:"var(--color-primary)", border:"none", color:"#fff", borderRadius:"var(--radius-sm)", padding:"4px", fontSize:".78rem", cursor:"pointer" }}>Crear</button>
                <button onClick={() => { setAddingSection(false); setNewSectionName(""); }} style={{ flex:1, background:"var(--color-bg-muted)", border:"1px solid var(--color-border)", color:"var(--color-text-muted)", borderRadius:"var(--radius-sm)", padding:"4px", fontSize:".78rem", cursor:"pointer" }}>Cancelar</button>
              </div>
            </div>
          )}

          <div style={{ flex:1, overflowY:"auto" }}>
            {sections.length === 0 && !sectionsQ.isLoading && (
              <div style={{ padding:"24px 16px", textAlign:"center", color:"var(--color-text-muted)", fontSize:".83rem" }}>
                <BookOpen size={28} style={{ opacity:.2, display:"block", margin:"0 auto 8px" }}/>
                Crea una sección para empezar
              </div>
            )}
            {sections.map(({ section, lessons: sLessons, collapsed }) => (
              <div key={section.id}>
                {/* Sección header */}
                <div style={{ display:"flex", alignItems:"center", padding:"8px 12px", background:"var(--color-surface)", borderBottom:"1px solid var(--color-border)", gap:6 }}>
                  <button onClick={() => setSections(prev => prev.map(s => s.section.id===section.id ? {...s,collapsed:!s.collapsed} : s))} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--color-text-muted)", padding:2, display:"flex" }}>
                    {collapsed ? <ChevronRight size={13}/> : <ChevronDown size={13}/>}
                  </button>
                  <span style={{ flex:1, fontSize:".82rem", fontWeight:600, color:"var(--color-text)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {section.title}
                  </span>
                  <button onClick={() => createLessonM.mutate(section.id)} title="Añadir lección" style={{ background:"none", border:"none", color:"var(--color-primary)", cursor:"pointer", padding:2, display:"flex" }}>
                    <Plus size={13}/>
                  </button>
                  <button onClick={() => setDeleteSection(section.id)} title="Eliminar sección" style={{ background:"none", border:"none", color:"var(--color-text-muted)", cursor:"pointer", padding:2, display:"flex" }}>
                    <Trash2 size={12}/>
                  </button>
                </div>

                {/* Lecciones */}
                {!collapsed && sLessons.map((l, idx) => {
                  const isActive = l.id === activeLessonId;
                  const icon = l.video_type==="youtube" ? <Youtube size={11}/> : l.video_type==="vimeo" ? <Video size={11}/> : l.video_type==="file" ? <FileVideo size={11}/> : <Edit3 size={11}/>;
                  return (
                    <div key={l.id} onClick={() => setActiveLessonId(l.id)} style={{ display:"flex", alignItems:"center", gap:7, padding:"8px 14px 8px 24px", cursor:"pointer", background: isActive ? "var(--color-primary)" : "transparent", color: isActive ? "#fff" : "var(--color-text)", borderLeft: isActive ? "3px solid var(--color-accent)" : "3px solid transparent", transition:"background .15s", fontSize:".83rem" }}>
                      <GripVertical size={11} style={{ opacity:.35, flexShrink:0 }}/>
                      <span style={{ fontSize:".7rem", fontFamily:"var(--font-mono)", opacity:.5, flexShrink:0 }}>{String(idx+1).padStart(2,"0")}</span>
                      <span style={{ opacity:.7, flexShrink:0 }}>{icon}</span>
                      <span style={{ flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{l.title}</span>
                      <span style={{ fontSize:".65rem", opacity:.6, flexShrink:0, fontFamily:"var(--font-mono)" }}>
                        {l.status==="PUBLISHED"?"✓":l.status==="HIDDEN"?"◉":"○"}
                      </span>
                      <button onClick={e=>{e.stopPropagation();setDeleteLesson(l.id);}} style={{ background:"none", border:"none", color: isActive?"rgba(255,255,255,.5)":"var(--color-text-muted)", cursor:"pointer", padding:2, flexShrink:0, display:"flex" }}>
                        <Trash2 size={11}/>
                      </button>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </aside>

        {/* ── Panel derecho: formulario de la lección ──────────────────────── */}
        <main style={{ flex:1, overflowY:"auto", padding:"28px 36px", background:"var(--color-bg)" }}>
          {!activeLessonId ? (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", color:"var(--color-text-muted)", gap:12 }}>
              <Video size={52} style={{ opacity:.12 }}/>
              <p style={{ fontSize:".92rem" }}>Selecciona o crea una lección</p>
            </div>
          ) : (
            <div style={{ maxWidth:820, display:"flex", flexDirection:"column", gap:22 }}>

              {/* Título */}
              <div>
                <label style={lbl}>Título de la lección *</label>
                <input value={form.title??""} onChange={e=>handleField({title:e.target.value})} style={inp} placeholder="Ej: Instalación de Node.js"/>
              </div>

              {/* Tipo de video */}
              <div>
                <label style={lbl}>Tipo de video</label>
                <div style={{ display:"flex", gap:8 }}>
                  {(["none","youtube","vimeo","file"] as VideoType[]).map(t => (
                    <button key={t} onClick={() => handleField({video_type:t})} style={{ padding:"7px 16px", borderRadius:"var(--radius-md)", border:"1.5px solid", borderColor: form.video_type===t ? "var(--color-primary)" : "var(--color-border)", background: form.video_type===t ? "var(--color-primary)" : "var(--color-bg-muted)", color: form.video_type===t ? "#fff" : "var(--color-text)", fontFamily:"var(--font-body)", fontSize:".83rem", cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}>
                      {t==="youtube"&&<Youtube size={13}/>}
                      {t==="vimeo"&&<Video size={13}/>}
                      {t==="file"&&<FileVideo size={13}/>}
                      {t==="none"&&<Edit3 size={13}/>}
                      {t==="none"?"Solo texto":t==="file"?"Archivo":t.charAt(0).toUpperCase()+t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* URL de video */}
              {(form.video_type==="youtube"||form.video_type==="vimeo") && (
                <div>
                  <label style={lbl}>{form.video_type==="youtube"?"URL o ID de YouTube":"URL o ID de Vimeo"}</label>
                  <input value={form.video_url??""} onChange={e=>handleField({video_url:e.target.value})} style={inp} placeholder={form.video_type==="youtube"?"https://youtube.com/watch?v=... o dQw4w9WgXcQ":"https://vimeo.com/123456789 o 123456789"}/>
                </div>
              )}

              {/* Archivo */}
              {form.video_type==="file" && (
                <div>
                  <label style={lbl}>Ruta del archivo (relativa a MEDIA_ROOT)</label>
                  <input value={form.video_file??""} onChange={e=>handleField({video_file:e.target.value})} style={inp} placeholder="videos/modulo1/leccion01.mp4"/>
                  <p style={{ fontSize:".75rem", color:"var(--color-text-muted)", marginTop:5 }}>
                    Sube el archivo a <code>media/videos/</code> y pon aquí la ruta relativa. El backend lo servirá en streaming.
                  </p>
                </div>
              )}

              {/* Preview del video */}
              {form.video_type !== "none" && (
                <div>
                  <label style={lbl}>Preview del video</label>
                  <VideoPreview/>
                </div>
              )}

              {/* Duración + estado + free preview */}
              <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
                <div style={{ flex:1, minWidth:120 }}>
                  <label style={lbl}>Duración (segundos)</label>
                  <input type="number" value={form.duration_seconds??0} onChange={e=>handleField({duration_seconds:parseInt(e.target.value)||0})} style={inp}/>
                </div>
                <div style={{ flex:1, minWidth:140 }}>
                  <label style={lbl}>Estado</label>
                  <select value={form.status??"DRAFT"} onChange={e=>handleField({status:e.target.value as VLStatus})} style={inp}>
                    <option value="DRAFT">Borrador</option>
                    <option value="PUBLISHED">Publicado</option>
                    <option value="HIDDEN">Oculto</option>
                  </select>
                </div>
                <div style={{ flex:1, minWidth:160, display:"flex", flexDirection:"column", justifyContent:"flex-end" }}>
                  <label style={{ ...lbl, marginBottom:10 }}>Vista previa gratuita</label>
                  <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", fontSize:".88rem", color:"var(--color-text)" }}>
                    <input type="checkbox" checked={!!form.is_free_preview} onChange={e=>handleField({is_free_preview:e.target.checked})} style={{ width:16, height:16, accentColor:"var(--color-primary)" }}/>
                    Accesible sin login
                  </label>
                </div>
              </div>

              {/* Markdown de apoyo */}
              <div>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                  <label style={lbl}>Notas / contenido de apoyo (Markdown)</label>
                  <div style={{ display:"flex", background:"var(--color-bg-muted)", border:"1px solid var(--color-border)", borderRadius:"var(--radius-md)", overflow:"hidden" }}>
                    {(["edit","preview"] as const).map(m => (
                      <button key={m} onClick={()=>setMdMode(m)} style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 11px", background: mdMode===m ? "var(--color-primary)" : "transparent", color: mdMode===m ? "#fff" : "var(--color-text-muted)", border:"none", cursor:"pointer", fontSize:".78rem" }}>
                        {m==="edit"?<><Edit3 size={12}/> Editar</>:<><Eye size={12}/> Preview</>}
                      </button>
                    ))}
                  </div>
                </div>
                {mdMode==="edit" ? (
                  <textarea
                    value={form.markdown??""}
                    onChange={e=>handleField({markdown:e.target.value})}
                    placeholder={"# Notas de la lección\n\nPega aquí el contenido generado por tu IA favorita.\n\n```javascript\n// código de ejemplo\n```"}
                    style={{ width:"100%", minHeight:280, resize:"vertical", padding:"14px 16px", background:"var(--color-bg-muted)", border:"1.5px solid var(--color-border)", borderRadius:"var(--radius-md)", color:"var(--color-text)", fontFamily:"var(--font-mono)", fontSize:".88rem", lineHeight:1.7, outline:"none", boxSizing:"border-box" }}
                    spellCheck={false}
                  />
                ) : (
                  <div style={{ minHeight:200, padding:"16px 20px", background:"var(--color-bg-muted)", border:"1px solid var(--color-border)", borderRadius:"var(--radius-md)", color:"var(--color-text)", fontFamily:"var(--font-body)" }} dangerouslySetInnerHTML={{ __html: mdToHtml(form.markdown??"") }}/>
                )}
              </div>

              {/* Guardar */}
              <div style={{ display:"flex", justifyContent:"flex-end", paddingTop:4 }}>
                <button onClick={saveNow} disabled={saving||saved} style={{ display:"flex", alignItems:"center", gap:7, background: saved ? "var(--color-bg-muted)" : "var(--color-primary)", border:"1px solid var(--color-border)", color: saved ? "var(--color-text-muted)" : "#fff", borderRadius:"var(--radius-md)", padding:"10px 22px", fontWeight:600, fontSize:".9rem", cursor: saved ? "default" : "pointer", fontFamily:"var(--font-body)" }}>
                  <Save size={15}/> {saving ? "Guardando…" : saved ? "Guardado ✓" : "Guardar"}
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modal eliminar lección */}
      {deleteLesson && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.55)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:16 }}>
          <div style={{ background:"var(--color-surface)", border:"1px solid var(--color-border)", borderRadius:"var(--radius-xl)", padding:"28px 32px", maxWidth:380, width:"100%", boxShadow:"var(--shadow-lg)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}><AlertCircle size={20} style={{ color:"#DC2626" }}/><h3 style={{ fontFamily:"var(--font-display)", fontWeight:700, fontSize:"1rem", color:"var(--color-text)" }}>Eliminar lección</h3></div>
            <p style={{ color:"var(--color-text-muted)", fontSize:".9rem", marginBottom:20 }}>Se eliminará la lección y su contenido. No se puede deshacer.</p>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={()=>setDeleteLesson(null)} style={{ flex:1, background:"var(--color-bg-muted)", border:"1px solid var(--color-border)", borderRadius:"var(--radius-md)", padding:"9px", color:"var(--color-text)", cursor:"pointer", fontFamily:"var(--font-body)" }}>Cancelar</button>
              <button onClick={()=>deleteLessonM.mutate(deleteLesson)} disabled={deleteLessonM.isPending} style={{ flex:1, background:"#DC2626", color:"#fff", border:"none", borderRadius:"var(--radius-md)", padding:"9px", fontWeight:600, cursor:"pointer", fontFamily:"var(--font-body)" }}>
                {deleteLessonM.isPending?"Eliminando…":"Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal eliminar sección */}
      {deleteSection && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.55)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:16 }}>
          <div style={{ background:"var(--color-surface)", border:"1px solid var(--color-border)", borderRadius:"var(--radius-xl)", padding:"28px 32px", maxWidth:380, width:"100%", boxShadow:"var(--shadow-lg)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}><AlertCircle size={20} style={{ color:"#DC2626" }}/><h3 style={{ fontFamily:"var(--font-display)", fontWeight:700, fontSize:"1rem", color:"var(--color-text)" }}>Eliminar sección</h3></div>
            <p style={{ color:"var(--color-text-muted)", fontSize:".9rem", marginBottom:20 }}>Se eliminarán la sección y <strong>todas sus lecciones</strong>.</p>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={()=>setDeleteSection(null)} style={{ flex:1, background:"var(--color-bg-muted)", border:"1px solid var(--color-border)", borderRadius:"var(--radius-md)", padding:"9px", color:"var(--color-text)", cursor:"pointer", fontFamily:"var(--font-body)" }}>Cancelar</button>
              <button onClick={()=>deleteSectionM.mutate(deleteSection)} disabled={deleteSectionM.isPending} style={{ flex:1, background:"#DC2626", color:"#fff", border:"none", borderRadius:"var(--radius-md)", padding:"9px", fontWeight:600, cursor:"pointer", fontFamily:"var(--font-body)" }}>
                {deleteSectionM.isPending?"Eliminando…":"Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
