/**
 * TutorialEditor.tsx — Editor Markdown con preview adaptado al tema activo.
 * Flujo: Tutorial = Course · Sección automática · Lecciones = páginas.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Plus, Trash2, Eye, Edit3, Save, AlertCircle,
  GripVertical, BookOpen, RefreshCw, ChevronRight, FileText,
} from "lucide-react";
import {
  adminCourses, adminSections, adminLessons, adminPages, adminBlocks,
  type AdminSection, type AdminLesson, type AdminPage, type AdminBlock,
} from "../api";

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface TutorialPage {
  lesson: AdminLesson;
  page: AdminPage | null;
  block: AdminBlock | null;
  markdown: string;
}

// ── Parser Markdown → HTML (usa variables CSS del tema activo) ────────────────

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function inl(s: string): string {
  return s
    .replace(/`([^`]+)`/g,
      '<code style="background:var(--color-bg-muted);padding:1px 6px;border-radius:4px;' +
      'font-family:var(--font-mono);font-size:.87em;color:var(--color-primary)">$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:var(--color-text)">$1</strong>')
    .replace(/__(.+?)__/g,     '<strong style="color:var(--color-text)">$1</strong>')
    .replace(/\*(.+?)\*/g,     '<em>$1</em>')
    .replace(/_(.+?)_/g,       '<em>$1</em>')
    .replace(/\[(.+?)\]\((.+?)\)/g,
      '<a href="$2" style="color:var(--color-primary);text-decoration:underline">$1</a>');
}

function mdToHtml(md: string): string {
  if (!md) return "";
  const lines = md.split("\n");
  const out: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Bloque de código
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim() || "code";
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        code.push(esc(lines[i]));
        i++;
      }
      const id = "cb" + Math.random().toString(36).slice(2, 7);
      out.push(
        '<div style="margin:1.25rem 0">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;' +
               'background:var(--color-bg-muted);border-radius:6px 6px 0 0;padding:6px 14px;' +
               'border:1px solid var(--color-border);border-bottom:none">' +
            '<span style="font-family:var(--font-mono);font-size:.73rem;color:var(--color-text-muted)">' + lang + '</span>' +
            '<button onclick="(function(b){var t=b.innerText;' +
              'navigator.clipboard.writeText(document.getElementById(\'' + id + '\').innerText);' +
              'b.innerText=\'Copiado!\';setTimeout(()=>b.innerText=t,1500)})(this)" ' +
              'style="background:var(--color-surface);color:var(--color-primary);' +
                     'border:1px solid var(--color-border);padding:3px 10px;font-size:.72rem;' +
                     'border-radius:4px;cursor:pointer;font-family:var(--font-body)">Copiar</button>' +
          '</div>' +
          '<pre id="' + id + '" style="background:var(--color-bg-muted);margin:0;padding:1.1rem 1.25rem;' +
               'border-radius:0 0 6px 6px;overflow-x:auto;border:1px solid var(--color-border);' +
               'border-top:none;font-family:var(--font-mono);font-size:.87rem;line-height:1.6;' +
               'color:var(--color-text)"><code>' + code.join("\n") + '</code></pre>' +
        '</div>'
      );
      i++; continue;
    }

    // Headings
    const hm = line.match(/^(#{1,6})\s+(.+)/);
    if (hm) {
      const lvl = hm[1].length;
      const sz = ["1.85rem","1.45rem","1.18rem","1rem","0.9rem","0.85rem"][lvl - 1];
      const mt = ["2rem","1.75rem","1.5rem","1.25rem","1rem","1rem"][lvl - 1];
      out.push(
        '<h' + lvl + ' style="color:var(--color-primary);margin:' + mt + ' 0 .5rem;' +
        'font-size:' + sz + ';font-family:var(--font-display);font-weight:700">' +
        inl(hm[2]) + '</h' + lvl + '>'
      );
      i++; continue;
    }

    // Divider
    if (/^[-*_]{3,}\s*$/.test(line)) {
      out.push('<hr style="border:none;border-top:1px solid var(--color-border);margin:2rem 0"/>');
      i++; continue;
    }

    // Lista no ordenada
    if (/^[-*+]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*+]\s/.test(lines[i])) {
        items.push('<li style="margin:.3rem 0;line-height:1.65">' + inl(lines[i].replace(/^[-*+]\s/, "")) + '</li>');
        i++;
      }
      out.push('<ul style="padding-left:1.6rem;margin:.6rem 0;color:var(--color-text)">' + items.join("") + '</ul>');
      continue;
    }

    // Lista ordenada
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push('<li style="margin:.3rem 0;line-height:1.65">' + inl(lines[i].replace(/^\d+\.\s/, "")) + '</li>');
        i++;
      }
      out.push('<ol style="padding-left:1.6rem;margin:.6rem 0;color:var(--color-text)">' + items.join("") + '</ol>');
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      out.push(
        '<div style="border-left:3px solid var(--color-primary);background:var(--color-bg-muted);' +
        'padding:.8rem 1.1rem;border-radius:0 6px 6px 0;margin:1rem 0;' +
        'color:var(--color-text-muted);font-style:italic">' + inl(line.slice(2)) + '</div>'
      );
      i++; continue;
    }

    // Línea vacía
    if (line.trim() === "") { out.push(""); i++; continue; }

    // Párrafo
    const para: string[] = [];
    while (
      i < lines.length && lines[i].trim() !== "" &&
      !lines[i].startsWith("#") && !lines[i].startsWith("```") &&
      !/^[-*+]\s/.test(lines[i]) && !/^\d+\.\s/.test(lines[i]) &&
      !/^[-*_]{3,}/.test(lines[i]) && !lines[i].startsWith("> ")
    ) {
      para.push(inl(lines[i]));
      i++;
    }
    if (para.length) {
      out.push('<p style="margin:.6rem 0;line-height:1.75;color:var(--color-text)">' + para.join("<br/>") + '</p>');
    }
  }

  return out.join("\n");
}

// ── Componente ────────────────────────────────────────────────────────────────

export default function TutorialEditor() {
  const { courseId } = useParams<{ courseId: string }>();
  const qc = useQueryClient();

  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [mode, setMode]       = useState<"edit" | "preview">("edit");
  const [draft, setDraft]     = useState("");
  const [saved, setSaved]     = useState(true);
  const [saving, setSaving]   = useState(false);
  const [newPageName, setNewPageName] = useState("");
  const [addingPage, setAddingPage]   = useState(false);
  const [deleteId, setDeleteId]       = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [titleDraft, setTitleDraft]     = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Queries ───────────────────────────────────────────────────────────────

  const courseQ = useQuery({
    queryKey: ["admin-course", courseId],
    queryFn: () => adminCourses.get(courseId!),
    enabled: !!courseId,
  });

  const secQ = useQuery({
    queryKey: ["tutorial-section", courseId],
    queryFn: () => adminSections.list({ course_id: courseId }).then(r => r.data),
    enabled: !!courseId,
  });
  const section: AdminSection | undefined = secQ.data?.[0];

  const lessonsQ = useQuery({
    queryKey: ["tutorial-lessons", section?.id],
    queryFn: () => adminLessons.list({ section_id: section!.id }).then(r => r.data),
    enabled: !!section?.id,
  });
  const lessons: AdminLesson[] = lessonsQ.data ?? [];

  // Sección automática
  const createSectionM = useMutation({
    mutationFn: () => adminSections.create({ course: courseId, title: "Contenido", order: 1 }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tutorial-section", courseId] }),
  });
  useEffect(() => {
    if (secQ.isSuccess && secQ.data?.length === 0) createSectionM.mutate();
  }, [secQ.isSuccess, secQ.data]);

  useEffect(() => {
    if (lessons.length > 0 && !activeLessonId) setActiveLessonId(lessons[0].id);
  }, [lessons]);

  // Contenido de la lección activa
  const pageQ = useQuery({
    queryKey: ["tutorial-page", activeLessonId],
    queryFn: async (): Promise<TutorialPage | null> => {
      if (!activeLessonId) return null;
      const lesson = lessons.find(l => l.id === activeLessonId);
      if (!lesson) return null;
      const pagesRes  = await adminPages.list({ lesson_id: activeLessonId });
      const page      = pagesRes.data[0] ?? null;
      if (!page) return { lesson, page: null, block: null, markdown: "" };
      const blocksRes = await adminBlocks.list({ page_id: page.id });
      const block     = blocksRes.data[0] ?? null;
      return { lesson, page, block, markdown: block?.data?.markdown ?? "" };
    },
    enabled: !!activeLessonId && lessons.length > 0,
  });

  useEffect(() => {
    if (pageQ.data !== undefined) { setDraft(pageQ.data?.markdown ?? ""); setSaved(true); }
  }, [pageQ.data]);

  // ── Guardar ───────────────────────────────────────────────────────────────

  const handleChange = (val: string) => {
    setDraft(val); setSaved(false);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveContent(val), 1500);
  };

  const saveContent = useCallback(async (markdown: string) => {
    if (!activeLessonId) return;
    setSaving(true);
    try {
      let page = pageQ.data?.page ?? null;
      if (!page) {
        page = await adminPages.create({ lesson: activeLessonId, order: 1, estimated_minutes: 5, status: "PUBLISHED" });
      }
      const block = pageQ.data?.block ?? null;
      if (!block) {
        await adminBlocks.create({ page: page.id, type: "markdown", order: 1, data: { markdown } });
      } else {
        // Siempre forzar type:markdown para que el serializer no use el tipo anterior
        await adminBlocks.update(block.id, { type: "markdown", data: { markdown } });
      }
      setSaved(true);
      qc.invalidateQueries({ queryKey: ["tutorial-page", activeLessonId] });
    } finally { setSaving(false); }
  }, [activeLessonId, pageQ.data]);

  const saveNow = () => { if (saveTimer.current) clearTimeout(saveTimer.current); saveContent(draft); };

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); saveNow(); } };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [draft, activeLessonId]);

  // ── Snippets ──────────────────────────────────────────────────────────────

  const insert = (snippet: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const s = ta.selectionStart, e2 = ta.selectionEnd;
    const next = draft.slice(0, s) + snippet + draft.slice(e2);
    handleChange(next);
    setTimeout(() => { ta.focus(); ta.setSelectionRange(s + snippet.length, s + snippet.length); }, 0);
  };

  const SNIPPETS = [
    { label: "H2",   code: "## Título\n" },
    { label: "H3",   code: "### Título\n" },
    { label: "P",    code: "\nPárrafo aquí.\n" },
    { label: "Code", code: "```javascript\n// código\n```\n" },
    { label: "List", code: "- Ítem uno\n- Ítem dos\n" },
    { label: "Nota", code: "> Nota importante.\n" },
    { label: "---",  code: "\n---\n\n" },
    { label: "Bold", code: "**texto**" },
    { label: "`x`",  code: "`código`" },
  ];

  // ── Mutaciones ────────────────────────────────────────────────────────────

  const createPageM = useMutation({
    mutationFn: async (title: string) => {
      if (!section) throw new Error("Sin sección");
      return adminLessons.create({
        section: section.id, title,
        order: (lessons[lessons.length - 1]?.order ?? 0) + 1,
        status: "PUBLISHED",
      });
    },
    onSuccess: (l) => {
      qc.invalidateQueries({ queryKey: ["tutorial-lessons", section?.id] });
      setActiveLessonId(l.id); setAddingPage(false); setNewPageName("");
    },
  });

  const deletePageM = useMutation({
    mutationFn: async (lessonId: string) => {
      const pagesRes = await adminPages.list({ lesson_id: lessonId });
      for (const pg of pagesRes.data) {
        const blRes = await adminBlocks.list({ page_id: pg.id });
        for (const bl of blRes.data) await adminBlocks.delete(bl.id);
        await adminPages.delete(pg.id);
      }
      await adminLessons.delete(lessonId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tutorial-lessons", section?.id] });
      setDeleteId(null); setActiveLessonId(null);
    },
  });

  const renameM = useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) => adminLessons.update(id, { title }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tutorial-lessons", section?.id] }); setEditingTitle(null); },
  });

  // ── Estilos ───────────────────────────────────────────────────────────────

  const S = {
    root:    { display:"flex", flexDirection:"column" as const, height:"calc(100vh - 64px)", overflow:"hidden" },
    topbar:  { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 20px", background:"var(--color-surface)", borderBottom:"1px solid var(--color-border)", flexShrink:0, gap:12, flexWrap:"wrap" as const },
    body:    { display:"flex", flex:1, overflow:"hidden" },
    sidebar: { width:240, flexShrink:0, borderRight:"1px solid var(--color-border)", background:"var(--color-bg-muted)", display:"flex", flexDirection:"column" as const, overflow:"hidden" },
    sideHdr: { padding:"12px 14px 8px", display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:"1px solid var(--color-border)" },
    sideList:{ flex:1, overflowY:"auto" as const, padding:"6px 0" },
    pageItem:(active: boolean): React.CSSProperties => ({
      display:"flex", alignItems:"center", gap:8, padding:"9px 14px", cursor:"pointer", fontSize:".85rem",
      background: active ? "var(--color-primary)" : "transparent",
      color:      active ? "#fff" : "var(--color-text)",
      borderLeft: active ? "3px solid var(--color-accent)" : "3px solid transparent",
      transition: "background .15s",
    }),
    editor:  { flex:1, display:"flex", flexDirection:"column" as const, overflow:"hidden" },
    toolbar: { display:"flex", alignItems:"center", gap:6, padding:"8px 16px", borderBottom:"1px solid var(--color-border)", flexWrap:"wrap" as const, flexShrink:0 },
    tbBtn:   { background:"var(--color-bg-muted)", border:"1px solid var(--color-border)", color:"var(--color-text)", borderRadius:"var(--radius-sm)", padding:"4px 10px", fontSize:".78rem", cursor:"pointer", fontFamily:"var(--font-mono)", whiteSpace:"nowrap" as const },
    textarea:{ flex:1, resize:"none" as const, border:"none", outline:"none", padding:"24px 28px", fontSize:".92rem", lineHeight:1.8, fontFamily:"var(--font-mono)", background:"var(--color-bg)", color:"var(--color-text)", overflowY:"auto" as const },
    // ▼ PREVIEW usa variables del tema — se adapta a claro/oscuro automáticamente
    preview: { flex:1, overflowY:"auto" as const, padding:"28px 40px", background:"var(--color-bg)", color:"var(--color-text)", fontFamily:"var(--font-body)" },
    empty:   { flex:1, display:"flex", flexDirection:"column" as const, alignItems:"center", justifyContent:"center", color:"var(--color-text-muted)", gap:12 },
    inp:     { padding:"7px 10px", background:"var(--color-bg)", border:"1px solid var(--color-border)", borderRadius:"var(--radius-md)", color:"var(--color-text)", fontSize:".85rem", fontFamily:"var(--font-body)", outline:"none", flex:1 },
    badge:   (ok: boolean): React.CSSProperties => ({
      fontSize:".72rem", fontFamily:"var(--font-mono)", display:"flex", alignItems:"center", gap:4,
      color: ok ? "#22c55e" : saving ? "var(--color-accent)" : "#f59e0b",
    }),
  };

  const course = courseQ.data;
  const activeLesson = lessons.find(l => l.id === activeLessonId);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={S.root}>

      {/* Top bar */}
      <div style={S.topbar}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <Link to="/admin/tutorials" style={{ display:"flex", alignItems:"center", gap:5, color:"var(--color-primary)", fontSize:".85rem", textDecoration:"none" }}>
            <ArrowLeft size={14}/> Tutoriales
          </Link>
          <ChevronRight size={13} style={{ color:"var(--color-border)" }}/>
          <BookOpen size={16} style={{ color:"var(--color-primary)" }}/>
          <span style={{ fontFamily:"var(--font-display)", fontWeight:700, fontSize:"1rem", color:"var(--color-text)" }}>
            {course?.title ?? "…"}
          </span>
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={S.badge(saved)}>
            {saving ? <><RefreshCw size={11}/> Guardando…</> :
             saved  ? <><span>●</span> Guardado</>           :
                      <><span>●</span> Sin guardar</>}
          </span>
          <button onClick={saveNow} disabled={saving || saved} style={{
            display:"flex", alignItems:"center", gap:6,
            background: saved ? "var(--color-bg-muted)" : "var(--color-primary)",
            border:"1px solid var(--color-border)",
            color: saved ? "var(--color-text-muted)" : "#fff",
            borderRadius:"var(--radius-md)", padding:"7px 14px",
            fontSize:".82rem", fontWeight:600, cursor: saved ? "default" : "pointer",
          }}>
            <Save size={14}/> Guardar (Ctrl+S)
          </button>
          <div style={{ display:"flex", background:"var(--color-bg-muted)", border:"1px solid var(--color-border)", borderRadius:"var(--radius-md)", overflow:"hidden" }}>
            {(["edit","preview"] as const).map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                display:"flex", alignItems:"center", gap:5, padding:"7px 12px",
                background: mode === m ? "var(--color-primary)" : "transparent",
                color: mode === m ? "#fff" : "var(--color-text-muted)",
                border:"none", cursor:"pointer", fontSize:".8rem",
              }}>
                {m === "edit" ? <><Edit3 size={13}/> Editar</> : <><Eye size={13}/> Preview</>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={S.body}>

        {/* Sidebar */}
        <aside style={S.sidebar}>
          <div style={S.sideHdr}>
            <span style={{ fontSize:".75rem", fontWeight:700, color:"var(--color-text-muted)", letterSpacing:".05em", textTransform:"uppercase" }}>
              Páginas
            </span>
            <button onClick={() => setAddingPage(true)} title="Nueva página" style={{ background:"var(--color-primary)", border:"none", color:"#fff", borderRadius:"50%", width:22, height:22, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
              <Plus size={13}/>
            </button>
          </div>

          {addingPage && (
            <div style={{ padding:"8px 10px", borderBottom:"1px solid var(--color-border)", display:"flex", flexDirection:"column", gap:6 }}>
              <input autoFocus placeholder="Título de la página…" value={newPageName}
                onChange={e => setNewPageName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && newPageName.trim()) createPageM.mutate(newPageName.trim());
                  if (e.key === "Escape") { setAddingPage(false); setNewPageName(""); }
                }}
                style={{ ...S.inp, width:"100%", boxSizing:"border-box" as const }}
              />
              <div style={{ display:"flex", gap:6 }}>
                <button onClick={() => newPageName.trim() && createPageM.mutate(newPageName.trim())} disabled={createPageM.isPending || !newPageName.trim()} style={{ flex:1, background:"var(--color-primary)", border:"none", color:"#fff", borderRadius:"var(--radius-sm)", padding:"5px", fontSize:".78rem", cursor:"pointer" }}>
                  {createPageM.isPending ? "…" : "Crear"}
                </button>
                <button onClick={() => { setAddingPage(false); setNewPageName(""); }} style={{ flex:1, background:"var(--color-bg-muted)", border:"1px solid var(--color-border)", color:"var(--color-text-muted)", borderRadius:"var(--radius-sm)", padding:"5px", fontSize:".78rem", cursor:"pointer" }}>
                  Cancelar
                </button>
              </div>
            </div>
          )}

          <div style={S.sideList}>
            {lessonsQ.isLoading && <div style={{ padding:"16px", color:"var(--color-text-muted)", fontSize:".8rem", display:"flex", alignItems:"center", gap:6 }}><RefreshCw size={13}/> Cargando…</div>}
            {!lessonsQ.isLoading && lessons.length === 0 && (
              <div style={{ padding:"16px", color:"var(--color-text-muted)", fontSize:".8rem", textAlign:"center" }}>
                <FileText size={28} style={{ opacity:.3, margin:"0 auto 8px", display:"block" }}/>Sin páginas
              </div>
            )}
            {lessons.map((l, idx) => (
              <div key={l.id} onClick={() => { if (editingTitle !== l.id) setActiveLessonId(l.id); }} style={S.pageItem(l.id === activeLessonId)}>
                <GripVertical size={12} style={{ opacity:.4, flexShrink:0 }}/>
                <span style={{ fontSize:".72rem", opacity:.5, flexShrink:0, fontFamily:"var(--font-mono)" }}>{String(idx+1).padStart(2,"0")}</span>
                {editingTitle === l.id ? (
                  <input autoFocus value={titleDraft} onClick={e => e.stopPropagation()}
                    onChange={e => setTitleDraft(e.target.value)}
                    onKeyDown={e => {
                      e.stopPropagation();
                      if (e.key === "Enter") renameM.mutate({ id: l.id, title: titleDraft });
                      if (e.key === "Escape") setEditingTitle(null);
                    }}
                    style={{ flex:1, background:"rgba(255,255,255,.1)", border:"1px solid rgba(255,255,255,.3)", color:"#fff", borderRadius:3, padding:"2px 6px", fontSize:".82rem", outline:"none" }}
                  />
                ) : (
                  <span style={{ flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}
                    onDoubleClick={e => { e.stopPropagation(); setEditingTitle(l.id); setTitleDraft(l.title); }}
                    title="Doble clic para renombrar">
                    {l.title}
                  </span>
                )}
                <button onClick={e => { e.stopPropagation(); setDeleteId(l.id); }} style={{ background:"none", border:"none", color: l.id === activeLessonId ? "rgba(255,255,255,.5)" : "var(--color-text-muted)", cursor:"pointer", padding:2, flexShrink:0, display:"flex", alignItems:"center" }}>
                  <Trash2 size={13}/>
                </button>
              </div>
            ))}
          </div>
        </aside>

        {/* Panel editor / preview */}
        <div style={S.editor}>
          {!activeLessonId ? (
            <div style={S.empty}>
              <BookOpen size={48} style={{ opacity:.15 }}/>
              <p style={{ fontSize:".9rem" }}>{lessons.length === 0 ? "Crea la primera página →" : "Selecciona una página"}</p>
            </div>
          ) : (
            <>
              {mode === "edit" && (
                <div style={S.toolbar}>
                  <span style={{ fontSize:".72rem", color:"var(--color-text-muted)", marginRight:4, fontFamily:"var(--font-mono)" }}>Insertar:</span>
                  {SNIPPETS.map(s => <button key={s.label} onClick={() => insert(s.code)} style={S.tbBtn}>{s.label}</button>)}
                  <span style={{ marginLeft:"auto", fontSize:".72rem", color:"var(--color-text-muted)", fontFamily:"var(--font-mono)" }}>{activeLesson?.title}</span>
                </div>
              )}

              {mode === "edit" && (
                pageQ.isLoading
                  ? <div style={{ padding:"32px", color:"var(--color-text-muted)", display:"flex", alignItems:"center", gap:8 }}><RefreshCw size={14}/> Cargando…</div>
                  : <textarea ref={textareaRef} value={draft} onChange={e => handleChange(e.target.value)}
                      placeholder={"# " + (activeLesson?.title ?? "Título") + "\n\nPega aquí el Markdown generado por tu IA favorita.\n\n```javascript\n// bloque de código con botón Copiar\n```"}
                      style={S.textarea} spellCheck={false}
                    />
              )}

              {mode === "preview" && (
                <div style={S.preview} dangerouslySetInnerHTML={{ __html: mdToHtml(draft) }}/>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal eliminar */}
      {deleteId && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.55)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:16 }}>
          <div style={{ background:"var(--color-surface)", border:"1px solid var(--color-border)", borderRadius:"var(--radius-xl)", padding:"28px 32px", maxWidth:380, width:"100%", boxShadow:"var(--shadow-lg)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
              <AlertCircle size={20} style={{ color:"#DC2626" }}/>
              <h3 style={{ fontFamily:"var(--font-display)", fontWeight:700, fontSize:"1rem", color:"var(--color-text)" }}>Eliminar página</h3>
            </div>
            <p style={{ color:"var(--color-text-muted)", fontSize:".9rem", marginBottom:20 }}>Se eliminará la página y todo su contenido. Esta acción no se puede deshacer.</p>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => setDeleteId(null)} style={{ flex:1, background:"var(--color-bg-muted)", border:"1px solid var(--color-border)", borderRadius:"var(--radius-md)", padding:"9px", color:"var(--color-text)", cursor:"pointer", fontFamily:"var(--font-body)" }}>Cancelar</button>
              <button onClick={() => deletePageM.mutate(deleteId)} disabled={deletePageM.isPending} style={{ flex:1, background:"#DC2626", color:"#fff", border:"none", borderRadius:"var(--radius-md)", padding:"9px", fontWeight:600, cursor:"pointer", fontFamily:"var(--font-body)" }}>
                {deletePageM.isPending ? "Eliminando…" : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
