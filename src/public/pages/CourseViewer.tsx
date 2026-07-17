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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
        className="block aspect-video w-full rounded-md border-none"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen />
    );
  }
  if (video.type === "vimeo" && video.embed_url) {
    return (
      <iframe src={video.embed_url}
        className="block aspect-video w-full rounded-md border-none"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen />
    );
  }
  if (video.type === "file" && video.stream_url) {
    return (
      <video src={video.stream_url} controls preload="metadata"
        className="block w-full rounded-md bg-black" />
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
    <div className="flex h-[60vh] items-center justify-center gap-2 text-muted-foreground">
      <RefreshCw size={16} className="animate-spin" /> Cargando…
    </div>
  );

  return (
    <div className="min-h-screen bg-background">

      {/* Header */}
      <div className="border-b border-border bg-card px-8 py-[18px]">
        <Link to="/courses" className="mb-2.5 inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
          <ArrowLeft size={14} /> Todos los cursos
        </Link>
        <div className="flex flex-wrap items-center gap-2.5">
          <Video size={20} className="shrink-0 text-primary" />
          <h1 className="font-display text-xl font-bold text-foreground sm:text-2xl">
            {course?.title}
          </h1>
          {course?.level && (
            <Badge variant="secondary" className="font-normal">
              {course.level}
            </Badge>
          )}
        </div>
        {course?.description && (
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted-foreground">
            {course.description}
          </p>
        )}
      </div>

      {/* Sin acceso */}
      {!canAccess ? (
        <div className="flex flex-col items-center justify-center gap-4 px-6 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-border bg-muted">
            <Lock size={28} className="text-primary" />
          </div>
          <h2 className="font-display text-xl font-bold text-foreground">
            Contenido restringido
          </h2>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            Necesitas una cuenta con rol <strong className="text-foreground">student</strong>,{" "}
            <strong className="text-foreground">teacher</strong> o{" "}
            <strong className="text-foreground">admin</strong> para acceder al contenido de este curso.
          </p>
          <div className="mt-2 flex gap-2.5">
            <Button asChild>
              <Link to="/login">Iniciar sesión</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/register">Registrarse</Link>
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Sin curriculum */}
          {!curriculum.length && !metaQ.isLoading && (
            <div className="flex flex-col items-center justify-center gap-4 px-6 py-20 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-border bg-muted">
                <Lock size={26} className="text-primary" />
              </div>
              <h2 className="font-display text-lg font-bold text-foreground">
                Sin contenido disponible
              </h2>
              <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                Este curso aún no tiene lecciones disponibles.
              </p>
            </div>
          )}

          {/* Viewer */}
          {curriculum.length > 0 && (
        <div className="flex h-[calc(100vh-140px)] overflow-hidden">

          {/* Sidebar */}
          <aside className="flex w-[280px] shrink-0 flex-col overflow-hidden border-r border-border bg-muted/40">
            <div className="border-b border-border px-4 py-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Contenido del curso</span>
              <div className="mt-0.5 text-xs text-muted-foreground">{allLessons.length} lecciones</div>
            </div>
            <div className="flex-1 overflow-y-auto [overscroll-behavior:contain]">
              {curriculum.map((section) => (
                <div key={section.id}>
                  <button
                    onClick={() => setCollapsed(c => ({ ...c, [section.id]: !c[section.id] }))}
                    className="flex w-full items-center gap-2 border-b border-border bg-card px-3.5 py-2.5 text-left"
                  >
                    {collapsed[section.id]
                      ? <ChevronRight size={13} className="shrink-0 text-muted-foreground" />
                      : <ChevronDown  size={13} className="shrink-0 text-muted-foreground" />
                    }
                    <span className="flex-1 truncate text-sm font-semibold text-foreground">{section.title}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{section.lessons.length}</span>
                  </button>
                  {!collapsed[section.id] && section.lessons.map((l) => {
                    const isActive = l.slug === activeSlug;
                    const isDone   = activeIdx > allLessons.findIndex(x => x.slug === l.slug);
                    return (
                      <button key={l.id} onClick={() => setActiveSlug(l.slug)}
                        className={cn(
                          "flex w-full items-start gap-2.5 border-l-[3px] py-2.5 pl-6 pr-3.5 text-left transition-colors",
                          isActive
                            ? "border-brand-accent bg-primary text-primary-foreground"
                            : "border-transparent text-foreground hover:bg-muted"
                        )}
                      >
                        <span className="mt-0.5 shrink-0 text-xs opacity-60">{isDone ? "✓" : isActive ? "▶" : "○"}</span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm leading-snug">{l.title}</div>
                          <div className="mt-0.5 flex items-center gap-1.5 text-xs opacity-65">
                            {videoIcon(l.video_type)}
                            {l.duration_seconds > 0 && <span>{fmtDuration(l.duration_seconds)}</span>}
                            {l.is_free_preview && (
                              <span className="rounded bg-brand-accent/20 px-1 text-[10px] font-semibold text-brand-accent">
                                GRATIS
                              </span>
                            )}
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
          <main className="flex-1 overflow-y-auto bg-background [overscroll-behavior:contain]">
            {lessonQ.isLoading && (
              <div className="flex h-1/2 items-center justify-center gap-2 text-muted-foreground">
                <RefreshCw size={14} className="animate-spin" /> Cargando lección…
              </div>
            )}
            {lessonQ.isError && (
              <div className="flex h-[60%] flex-col items-center justify-center gap-3.5 px-8 text-center">
                <Lock size={36} className="text-primary/50" />
                <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
                  Esta lección requiere iniciar sesión con una cuenta de estudiante.
                </p>
                <Button asChild>
                  <Link to="/login">Iniciar sesión</Link>
                </Button>
              </div>
            )}
            {lesson && !lessonQ.isLoading && (
              <div>
                {lesson.video.type !== "none" && (
                  <div className="border-b border-border bg-black">
                    <div className="mx-auto max-w-[960px]">
                      <VideoPlayer video={lesson.video} />
                    </div>
                  </div>
                )}
                <div className="mx-auto max-w-3xl px-8 py-7">
                  <div className="mb-6 border-b border-border pb-[18px]">
                    <h2 className="mb-1.5 font-display text-2xl font-bold text-foreground">
                      {lesson.lesson.title}
                    </h2>
                    <div className="flex items-center gap-3.5 text-sm text-muted-foreground">
                      <span className="font-mono">Lección {activeIdx + 1} de {allLessons.length}</span>
                      {lesson.lesson.duration_seconds > 0 && (
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> {fmtDuration(lesson.lesson.duration_seconds)} min
                        </span>
                      )}
                    </div>
                  </div>
                  {lesson.markdown ? (
                    <div
                      className="leading-relaxed text-foreground"
                      dangerouslySetInnerHTML={{ __html: mdToHtml(lesson.markdown) }}
                    />
                  ) : (
                    <p className="text-sm italic text-muted-foreground">
                      Esta lección no tiene notas adicionales.
                    </p>
                  )}
                  <div className="mt-11 flex justify-between border-t border-border pt-5">
                    <div>
                      {lesson.nav.prev && (
                        <Button variant="outline" onClick={() => navigate(lesson.nav.prev)} className="gap-1.5">
                          <ChevronLeft size={15} /> Anterior
                        </Button>
                      )}
                    </div>
                    <div>
                      {lesson.nav.next && (
                        <Button onClick={() => navigate(lesson.nav.next)} className="gap-1.5">
                          Siguiente <ChevronRight size={15} />
                        </Button>
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
