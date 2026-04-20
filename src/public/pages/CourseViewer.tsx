/**
 * CourseViewer.tsx — Visor público de cursos con video.
 *
 * Layout:
 *  ┌─────────────────────┬──────────────────────────────────────────────┐
 *  │ SECCIONES/LECCIONES │  [VIDEO PLAYER — YouTube/Vimeo/stream mp4]  │
 *  │                     │  Título de la lección                        │
 *  │ ▸ Módulo 1          │  ─────────────────────────────────────────── │
 *  │   ✓ Intro           │  Notas / contenido Markdown                  │
 *  │   → Instalación ←   │                                              │
 *  │ ▸ Módulo 2          │  [ ← Anterior ]          [ Siguiente →  ]   │
 *  └─────────────────────┴──────────────────────────────────────────────┘
 */

import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft, Lock, RefreshCw, ChevronRight,
  ChevronLeft, ChevronDown, Video, Youtube, FileVideo, Edit3, Clock,
} from "lucide-react";
import http from "../../shared/api/http";
import { useAuth } from "../../shared/auth/useAuth";
import hljs from "highlight.js";

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface CourseMeta {
  id: string; title: string; slug: string;
  description?: string; level?: string; thumbnail?: string;
  curriculum: Array<{
    id: string; title: string; order: number;
    lessons: Array<{
      id: string; title: string; slug: string; order: number;
      video_type: string; duration_seconds: number; is_free_preview: boolean;
    }>;
  }> | null;
}

interface LessonContent {
  lesson: { id: string; title: string; slug: string; order: number; duration_seconds: number };
  video: { type: string; embed_url?: string; stream_url?: string };
  markdown: string;
  nav: { prev: string | null; next: string | null };
}

// ── Acceso ────────────────────────────────────────────────────────────────────

const ALLOWED = new Set(["admin", "teacher", "student"]);

function hasRole(role?: { name: string } | string | null): boolean {
  if (!role) return false;
  const name = typeof role === "string" ? role : role.name;
  return ALLOWED.has(name.toLowerCase());
}

// ── API ───────────────────────────────────────────────────────────────────────

const fetchMeta   = (slug: string) =>
  http.get<CourseMeta>(`/public/video-courses/${slug}`).then(r => r.data);
const fetchLesson = (courseSlug: string, lessonSlug: string) =>
  http.get<LessonContent>(`/public/video-courses/${courseSlug}/lessons/${lessonSlug}`).then(r => r.data);

// ── Parser Markdown ───────────────────────────────────────────────────────────

/**
 * esc() — escapa los caracteres HTML peligrosos en texto crudo.
 * Orden: & primero para no doble-escapar entidades existentes.
 */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * inl() — aplica decoración inline Markdown sobre texto crudo.
 * Flujo: esc(raw) primero → luego aplica patrones.
 * Así < > & en el texto del autor quedan como entidades HTML,
 * nunca como etiquetas ejecutables.
 */
function inl(raw: string): string {
  const s = esc(raw);
  return s
    .replace(/`([^`]+)`/g,
      '<code style="background:var(--color-bg-muted);padding:1px 6px;border-radius:4px;' +
      'font-family:var(--font-mono);font-size:.87em;color:var(--color-primary)">$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:var(--color-text)">$1</strong>')
    .replace(/__(.+?)__/g,     '<strong style="color:var(--color-text)">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/_(.+?)_/g,   '<em>$1</em>')
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

    // ── Bloque de código ──────────────────────────────────────────────────
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim() || "code";
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        code.push(lines[i]);   // ← < > & escapados por hljs
        i++;
      }

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

      const id = "cb" + Math.random().toString(36).slice(2, 7);
      out.push(
        '<div style="margin:1.25rem 0">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;background:var(--color-bg-muted);border-radius:6px 6px 0 0;padding:6px 14px;border:1px solid var(--color-border);border-bottom:none">' +
        '<span style="font-family:var(--font-mono);font-size:.73rem;color:var(--color-text-muted)">' + lang + '</span>' +
        '<button onclick="(function(b){var t=b.innerText;navigator.clipboard.writeText(document.getElementById(\'' + id + '\').innerText);b.innerText=\'Copiado!\';setTimeout(()=>b.innerText=t,1500)})(this)" style="background:var(--color-surface);color:var(--color-primary);border:1px solid var(--color-border);padding:3px 10px;font-size:.72rem;border-radius:4px;cursor:pointer">Copiar</button>' +
        '</div>' +
        '<pre id="' + id + '" style="background:var(--color-bg-muted);margin:0;padding:1.1rem 1.25rem;border-radius:0 0 6px 6px;overflow-x:auto;border:1px solid var(--color-border);border-top:none;font-family:var(--font-mono);font-size:.87rem;line-height:1.6;color:var(--color-text)"><code>' +
        highlightedCode +
        '</code></pre></div>'
      );
      i++;
      continue;
    }

    // ── Headings ──────────────────────────────────────────────────────────
    const hm = line.match(/^(#{1,6})\s+(.+)/);
    if (hm) {
      const lvl = hm[1].length;
      const sz = ["1.85rem","1.45rem","1.18rem","1rem","0.9rem","0.85rem"][lvl - 1];
      const mt = ["2rem","1.75rem","1.5rem","1.25rem","1rem","1rem"][lvl - 1];
      out.push('<h' + lvl + ' style="color:var(--color-primary);margin:' + mt + ' 0 .5rem;font-size:' + sz + ';font-family:var(--font-display);font-weight:700">' + inl(hm[2]) + '</h' + lvl + '>');
      i++; continue;
    }

    // ── HR ────────────────────────────────────────────────────────────────
    if (/^[-*_]{3,}\s*$/.test(line)) {
      out.push('<hr style="border:none;border-top:1px solid var(--color-border);margin:2rem 0"/>');
      i++; continue;
    }

    // ── Lista no ordenada ─────────────────────────────────────────────────
    if (/^[-*+]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*+]\s/.test(lines[i])) {
        items.push('<li style="margin:.3rem 0;line-height:1.65">' + inl(lines[i].replace(/^[-*+]\s/, "")) + '</li>');
        i++;
      }
      out.push('<ul style="padding-left:1.6rem;margin:.6rem 0;color:var(--color-text)">' + items.join("") + '</ul>');
      continue;
    }

    // ── Lista ordenada ────────────────────────────────────────────────────
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push('<li style="margin:.3rem 0;line-height:1.65">' + inl(lines[i].replace(/^\d+\.\s/, "")) + '</li>');
        i++;
      }
      out.push('<ol style="padding-left:1.6rem;margin:.6rem 0;color:var(--color-text)">' + items.join("") + '</ol>');
      continue;
    }

    // ── Blockquote ────────────────────────────────────────────────────────
    if (line.startsWith("> ")) {
      out.push('<div style="border-left:3px solid var(--color-primary);background:var(--color-bg-muted);padding:.8rem 1.1rem;border-radius:0 6px 6px 0;margin:1rem 0;color:var(--color-text-muted);font-style:italic">' + inl(line.slice(2)) + '</div>');
      i++; continue;
    }

    // ── Línea vacía ───────────────────────────────────────────────────────
    if (line.trim() === "") { out.push(""); i++; continue; }

    // ── Párrafo ───────────────────────────────────────────────────────────
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

// ── Reproductor de video ──────────────────────────────────────────────────────

function VideoPlayer({ video }: { video: LessonContent["video"] }) {
  if (video.type === "youtube" && video.embed_url) {
    return (
      <iframe src={video.embed_url}
        style={{ width: "100%", aspectRatio: "16/9", border: "none", borderRadius: "var(--radius-md)", display: "block" }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen />
    );
  }
  if (video.type === "vimeo" && video.embed_url) {
    return (
      <iframe src={video.embed_url}
        style={{ width: "100%", aspectRatio: "16/9", border: "none", borderRadius: "var(--radius-md)", display: "block" }}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen />
    );
  }
  if (video.type === "file" && video.stream_url) {
    return (
      <video src={video.stream_url} controls preload="metadata"
        style={{ width: "100%", borderRadius: "var(--radius-md)", background: "#000", display: "block" }} />
    );
  }
  return null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDuration(secs: number) {
  if (!secs) return "";
  const m = Math.floor(secs / 60), s = secs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function videoIcon(type: string) {
  if (type === "youtube") return <Youtube size={11} />;
  if (type === "vimeo")   return <Video size={11} />;
  if (type === "file")    return <FileVideo size={11} />;
  return <Edit3 size={11} />;
}

// ── Componente ────────────────────────────────────────────────────────────────

export default function CourseViewer() {
  const { courseSlug } = useParams<{ courseSlug: string }>();
  const { user } = useAuth();
  const canAccess = hasRole(user?.role);

  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [collapsed, setCollapsed]   = useState<Record<string, boolean>>({});

  const metaQ = useQuery({
    queryKey: ["vc-meta", courseSlug],
    queryFn: () => fetchMeta(courseSlug!),
    enabled: !!courseSlug,
  });
  const course = metaQ.data;
  const curriculum = canAccess ? (course?.curriculum ?? []) : [];

  useEffect(() => {
    if (!activeSlug && curriculum.length > 0) {
      const first = curriculum[0]?.lessons[0];
      if (first) setActiveSlug(first.slug);
    }
  }, [curriculum]);

  const lessonQ = useQuery({
    queryKey: ["vc-lesson", courseSlug, activeSlug],
    queryFn: () => fetchLesson(courseSlug!, activeSlug!),
    enabled: !!courseSlug && !!activeSlug && canAccess,
    retry: false,
  });
  const lesson = lessonQ.data;

  const allLessons = curriculum.flatMap(s => s.lessons);
  const activeIdx  = allLessons.findIndex(l => l.slug === activeSlug);
  const navigate   = (slug: string | null) => { if (slug) setActiveSlug(slug); };

  if (metaQ.isLoading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", gap: 8, color: "var(--color-text-muted)" }}>
      <RefreshCw size={16} /> Cargando…
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg)" }}>

      {/* Header */}
      <div style={{ background: "var(--color-surface)", borderBottom: "1px solid var(--color-border)", padding: "18px 32px" }}>
        <Link to="/courses" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--color-primary)", fontSize: ".83rem", textDecoration: "none", marginBottom: 10 }}>
          <ArrowLeft size={14} /> Todos los cursos
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <Video size={20} style={{ color: "var(--color-primary)", flexShrink: 0 }} />
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.4rem", color: "var(--color-text)" }}>
            {course?.title}
          </h1>
          {course?.level && (
            <span style={{ fontSize: ".72rem", padding: "3px 10px", borderRadius: 99, background: "var(--color-bg-muted)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}>
              {course.level}
            </span>
          )}
        </div>
        {course?.description && (
          <p style={{ marginTop: 6, color: "var(--color-text-muted)", fontSize: ".88rem", maxWidth: 620, lineHeight: 1.55 }}>
            {course.description}
          </p>
        )}
      </div>

      {/* Sin acceso */}
      {!canAccess ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 24px", gap: 16, textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--color-bg-muted)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--color-border)" }}>
            <Lock size={28} style={{ color: "var(--color-primary)" }} />
          </div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.2rem", color: "var(--color-text)" }}>
            Contenido restringido
          </h2>
          <p style={{ color: "var(--color-text-muted)", maxWidth: 380, lineHeight: 1.6, fontSize: ".93rem" }}>
            Necesitas una cuenta con rol <strong>student</strong>, <strong>teacher</strong> o <strong>admin</strong> para acceder al contenido de este curso.
          </p>
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <Link to="/login" style={{ background: "var(--color-primary)", color: "#fff", borderRadius: "var(--radius-md)", padding: "10px 20px", fontWeight: 600, fontSize: ".9rem", textDecoration: "none" }}>
              Iniciar sesión
            </Link>
            <Link to="/register" style={{ background: "var(--color-bg-muted)", color: "var(--color-text)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "10px 20px", fontSize: ".9rem", textDecoration: "none" }}>
              Registrarse
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Sin curriculum */}
          {!curriculum.length && !metaQ.isLoading && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 24px", gap: 16, textAlign: "center" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--color-bg-muted)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--color-border)" }}>
                <Lock size={26} style={{ color: "var(--color-primary)" }} />
              </div>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.15rem", color: "var(--color-text)" }}>
                Sin contenido disponible
              </h2>
              <p style={{ color: "var(--color-text-muted)", maxWidth: 360, lineHeight: 1.6, fontSize: ".9rem" }}>
                Este curso aún no tiene lecciones disponibles.
              </p>
            </div>
          )}

          {/* Viewer */}
          {curriculum.length > 0 && (
        <div style={{ display: "flex", height: "calc(100vh - 140px)", overflow: "hidden" }}>

          {/* Sidebar */}
          <aside style={{ width: 280, flexShrink: 0, borderRight: "1px solid var(--color-border)", background: "var(--color-bg-muted)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "12px 16px 10px", borderBottom: "1px solid var(--color-border)" }}>
              <span style={{ fontSize: ".72rem", fontWeight: 700, color: "var(--color-text-muted)", letterSpacing: ".06em", textTransform: "uppercase" }}>Contenido del curso</span>
              <div style={{ fontSize: ".75rem", color: "var(--color-text-muted)", marginTop: 3 }}>{allLessons.length} lecciones</div>
            </div>
            <div style={{ flex: 1, overflowY: "auto", overscrollBehavior: "contain" }}>
              {curriculum.map((section) => (
                <div key={section.id}>
                  <button
                    onClick={() => setCollapsed(c => ({ ...c, [section.id]: !c[section.id] }))}
                    style={{ width: "100%", textAlign: "left", padding: "10px 14px", background: "var(--color-surface)", border: "none", borderBottom: "1px solid var(--color-border)", cursor: "pointer", display: "flex", alignItems: "center", gap: 7, fontFamily: "var(--font-body)" }}
                  >
                    {collapsed[section.id]
                      ? <ChevronRight size={13} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
                      : <ChevronDown  size={13} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
                    }
                    <span style={{ flex: 1, fontSize: ".83rem", fontWeight: 600, color: "var(--color-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{section.title}</span>
                    <span style={{ fontSize: ".7rem", color: "var(--color-text-muted)", flexShrink: 0 }}>{section.lessons.length}</span>
                  </button>
                  {!collapsed[section.id] && section.lessons.map((l) => {
                    const isActive = l.slug === activeSlug;
                    const isDone   = activeIdx > allLessons.findIndex(x => x.slug === l.slug);
                    return (
                      <button key={l.id} onClick={() => setActiveSlug(l.slug)}
                        style={{ width: "100%", textAlign: "left", border: "none", cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 9, padding: "9px 14px 9px 24px", background: isActive ? "var(--color-primary)" : "transparent", color: isActive ? "#fff" : "var(--color-text)", borderLeft: isActive ? "3px solid var(--color-accent)" : "3px solid transparent", transition: "background .15s", fontFamily: "var(--font-body)" }}
                      >
                        <span style={{ fontSize: ".7rem", marginTop: 2, flexShrink: 0, opacity: .6 }}>{isDone ? "✓" : isActive ? "▶" : "○"}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: ".83rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.4 }}>{l.title}</div>
                          <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2, opacity: .65, fontSize: ".7rem" }}>
                            {videoIcon(l.video_type)}
                            {l.duration_seconds > 0 && <span>{fmtDuration(l.duration_seconds)}</span>}
                            {l.is_free_preview && <span style={{ background: "rgba(251,191,36,.2)", color: "#f59e0b", padding: "0 4px", borderRadius: 3, fontSize: ".65rem", fontWeight: 600 }}>GRATIS</span>}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </aside>

          {/* Panel principal */}
          <main style={{ flex: 1, overflowY: "auto", background: "var(--color-bg)", overscrollBehavior: "contain" }}>
            {lessonQ.isLoading && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "50%", gap: 8, color: "var(--color-text-muted)" }}>
                <RefreshCw size={14} /> Cargando lección…
              </div>
            )}
            {lessonQ.isError && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60%", gap: 14, textAlign: "center", padding: 32 }}>
                <Lock size={36} style={{ color: "var(--color-primary)", opacity: .5 }} />
                <p style={{ color: "var(--color-text-muted)", fontSize: ".9rem", maxWidth: 320, lineHeight: 1.6 }}>
                  Esta lección requiere iniciar sesión con una cuenta de estudiante.
                </p>
                <Link to="/login" style={{ background: "var(--color-primary)", color: "#fff", borderRadius: "var(--radius-md)", padding: "9px 20px", fontWeight: 600, fontSize: ".88rem", textDecoration: "none" }}>
                  Iniciar sesión
                </Link>
              </div>
            )}
            {lesson && !lessonQ.isLoading && (
              <div>
                {lesson.video.type !== "none" && (
                  <div style={{ background: "#000", borderBottom: "1px solid var(--color-border)" }}>
                    <div style={{ maxWidth: 960, margin: "0 auto" }}>
                      <VideoPlayer video={lesson.video} />
                    </div>
                  </div>
                )}
                <div style={{ maxWidth: 860, margin: "0 auto", padding: "28px 32px" }}>
                  <div style={{ marginBottom: 24, paddingBottom: 18, borderBottom: "1px solid var(--color-border)" }}>
                    <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.5rem", color: "var(--color-text)", marginBottom: 6 }}>
                      {lesson.lesson.title}
                    </h2>
                    <div style={{ display: "flex", alignItems: "center", gap: 14, color: "var(--color-text-muted)", fontSize: ".8rem" }}>
                      <span style={{ fontFamily: "var(--font-mono)" }}>Lección {activeIdx + 1} de {allLessons.length}</span>
                      {lesson.lesson.duration_seconds > 0 && (
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <Clock size={12} /> {fmtDuration(lesson.lesson.duration_seconds)} min
                        </span>
                      )}
                    </div>
                  </div>
                  {lesson.markdown ? (
                    <div
                      style={{ fontFamily: "var(--font-body)", color: "var(--color-text)", lineHeight: 1.75 }}
                      dangerouslySetInnerHTML={{ __html: mdToHtml(lesson.markdown) }}
                    />
                  ) : (
                    <p style={{ color: "var(--color-text-muted)", fontStyle: "italic", fontSize: ".9rem" }}>
                      Esta lección no tiene notas adicionales.
                    </p>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 44, paddingTop: 20, borderTop: "1px solid var(--color-border)" }}>
                    <div>
                      {lesson.nav.prev && (
                        <button onClick={() => navigate(lesson.nav.prev)}
                          style={{ display: "flex", alignItems: "center", gap: 7, background: "var(--color-bg-muted)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "9px 16px", color: "var(--color-text)", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: ".85rem" }}>
                          <ChevronLeft size={15} /> Anterior
                        </button>
                      )}
                    </div>
                    <div>
                      {lesson.nav.next && (
                        <button onClick={() => navigate(lesson.nav.next)}
                          style={{ display: "flex", alignItems: "center", gap: 7, background: "var(--color-primary)", border: "none", borderRadius: "var(--radius-md)", padding: "9px 16px", color: "#fff", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: ".85rem", fontWeight: 600 }}>
                          Siguiente <ChevronRight size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
          )}
        </>
      )}
    </div>
  );
}
