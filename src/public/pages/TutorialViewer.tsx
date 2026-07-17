/**
 * TutorialViewer.tsx
 * Vista pública de un tutorial con acceso restringido por rol.
 */

import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, ChevronRight, Lock, ArrowLeft, ChevronLeft, RefreshCw, FileText } from "lucide-react";
import http from "../../shared/api/http";
import { useAuth } from "../../shared/auth/useAuth";
import hljs from "highlight.js";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import EmptyState from "@/components/patterns/EmptyState";
import { cn } from "@/lib/utils";

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface TutorialMeta {
  id: string;
  title: string;
  slug: string;
  description?: string;
  level?: string;
  is_public?: boolean;
  study_courses?: { id: string; name: string }[];
}

interface TutorialPage {
  id: string;
  title: string;
  slug: string;
  order: number;
}

interface PageContent {
  lesson: { title: string; slug: string; order: number };
  markdown: string;
  nav: { prev: string | null; next: string | null };
}

// ── Acceso ────────────────────────────────────────────────────────────────────

const ALLOWED = new Set(["admin", "teacher", "student"]);

function canAccessContent(role?: { name: string } | string | null): boolean {
  if (!role) return false;
  const name = typeof role === "string" ? role : role.name;
  return ALLOWED.has(name.toLowerCase());
}

/** Extrae la lista de carreras del mensaje JSON del 403 de carrera restringida */
function parseCourseRestriction(error: unknown): string[] | null {
  try {
    const msg = (error as any)?.response?.data?.message ?? "";
    const parsed = JSON.parse(msg);
    if (parsed?.code === "COURSE_RESTRICTED" && Array.isArray(parsed.courses)) {
      return parsed.courses as string[];
    }
  } catch { /* no es JSON */ }
  return null;
}

// ── API ───────────────────────────────────────────────────────────────────────

async function fetchMeta(slug: string): Promise<TutorialMeta> {
  const r = await http.get(`/public/tutorials/${slug}`);
  return r.data;
}

async function fetchPages(slug: string): Promise<TutorialPage[]> {
  const r = await http.get(`/public/tutorials/${slug}/pages`);
  return r.data.pages;
}

async function fetchPageContent(courseSlug: string, lessonSlug: string): Promise<PageContent> {
  const r = await http.get(`/public/tutorials/${courseSlug}/pages/${lessonSlug}`);
  return r.data;
}

// ── Parser Markdown ───────────────────────────────────────────────────────────

/**
 * esc() — escapa los 3 caracteres HTML peligrosos.
 * Se aplica SIEMPRE sobre texto crudo antes de construir HTML,
 * tanto en bloques de código como en texto normal (párrafos,
 * headings, listas, blockquotes).
 *
 * Orden crítico: & primero para no doble-escapar entidades.
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
 * inl() — aplica estilos inline (negrita, cursiva, código inline, links).
 *
 * FLUJO CORRECTO:
 *   1. esc(texto)  →  convierte < > & en entidades HTML seguras
 *   2. inl(escaped) → aplica patrones Markdown sobre texto ya seguro
 *
 * El código inline usa [^`]+ para capturar el contenido crudo,
 * y lo pasa por esc() internamente antes de inyectarlo en el HTML.
 * El resto de patrones operan sobre texto ya escapado, así que
 * los caracteres especiales están neutralizados.
 */
function inl(raw: string): string {
  // Primero escapamos el texto plano
  const s = esc(raw);

  return s
    // código inline: el contenido ya está escapado por esc() de arriba
    .replace(/`([^`]+)`/g,
      '<code style="background:var(--color-bg-muted);padding:1px 6px;border-radius:4px;' +
      'font-family:var(--font-mono);font-size:.87em;color:var(--color-primary)">$1</code>')
    // negrita
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:var(--color-text)">$1</strong>')
    .replace(/__(.+?)__/g,     '<strong style="color:var(--color-text)">$1</strong>')
    // cursiva
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/_(.+?)_/g,   '<em>$1</em>')
    // links: la URL ya está escapada (& → &amp; etc.)
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

    // ── Tablas Markdown ──────────────────────────────────────────────────
    if (line.includes("|") && line.trim() !== "") {
      const table: string[] = [];
      let headerProcessed = false;
      
      // Procesar la tabla completa
      while (i < lines.length && (lines[i].includes("|") || lines[i].trim() === "" || lines[i].includes("|---"))) {
        const currentLine = lines[i];
        
        // Línea separadora (|---|---|---)
        if (currentLine.match(/^\|[\s\-\|:]+\|$/)) {
          i++;
          continue;
        }
        
        // Línea de tabla con contenido
        if (currentLine.includes("|") && currentLine.trim() !== "") {
          const cells = currentLine.split("|").map(cell => cell.trim()).filter(cell => cell !== "");
          const isHeader = !headerProcessed;
          
          const rowHtml = cells.map(cell => {
            const cellTag = isHeader ? "th" : "td";
            const cellStyle = isHeader 
              ? 'style="background:var(--color-primary-soft);color:var(--color-primary);font-weight:600;padding:12px 16px;border:1px solid var(--color-border);text-align:left;font-family:var(--font-display);"'
              : 'style="padding:12px 16px;border:1px solid var(--color-border);text-align:left;"';
            
            return `<${cellTag} ${cellStyle}>${inl(cell)}</${cellTag}>`;
          }).join("");
          
          const rowTag = isHeader ? "thead" : "tbody";
          const rowStyle = isHeader 
            ? 'style="background:var(--color-surface);"' 
            : '';
          
          table.push(`<${rowTag}><tr ${rowStyle}>${rowHtml}</tr></${rowTag}>`);
          headerProcessed = true;
        }
        
        i++;
      }
      
      if (table.length > 0) {
        const tableHtml = `
          <div style="margin:1.5rem 0;overflow-x:auto;border:1px solid var(--color-border);border-radius:8px;background:var(--color-surface);box-shadow:0 2px 8px rgba(0,0,0,0.05);">
            <table style="width:100%;border-collapse:collapse;">
              ${table.join("")}
            </table>
          </div>
        `;
        out.push(tableHtml);
      }
      continue;
    }

    // ── Bloque de código (```) ──────────────────────────────────────────────
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim() || "code";
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        code.push(lines[i]);
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
          '<div style="display:flex;align-items:center;justify-content:space-between;' +
               'background:var(--color-bg-muted);border-radius:6px 6px 0 0;padding:6px 14px;' +
               'border:1px solid var(--color-border);border-bottom:none">' +
            '<span style="font-family:var(--font-mono);font-size:.73rem;color:var(--color-text-muted)">' + lang + '</span>' +
            '<button onclick="(function(b){var t=b.innerText;navigator.clipboard.writeText(document.getElementById(\'' + id + '\').innerText);b.innerText=\'Copiado!\';setTimeout(()=>b.innerText=t,1500)})(this)" ' +
              'style="background:var(--color-surface);color:var(--color-primary);border:1px solid var(--color-border);' +
                     'padding:3px 10px;font-size:.72rem;border-radius:4px;cursor:pointer;font-family:var(--font-body)">Copiar</button>' +
          '</div>' +
          '<pre id="' + id + '" style="background:var(--color-bg-muted);margin:0;padding:1.1rem 1.25rem;border-radius:0 0 6px 6px;' +
               'overflow-x:auto;border:1px solid var(--color-border);border-top:none;' +
               'font-family:var(--font-mono);font-size:.87rem;line-height:1.6;color:var(--color-text)">' +
            '<code>' + highlightedCode + '</code></pre></div>'
      );
      i++;
      continue;
    }

    // ── Headings ──────────────────────────────────────────────────
    const hm = line.match(/^(#{1,6})\s+(.+)/);
    if (hm) {
      const lvl = hm[1].length;
      const sz = ["1.85rem","1.45rem","1.18rem","1rem","0.9rem","0.85rem"][lvl - 1];
      const mt = ["2rem","1.75rem","1.5rem","1.25rem","1rem","1rem"][lvl - 1];
      out.push(
        '<h' + lvl + ' style="color:var(--color-primary);margin:' + mt + ' 0 .5rem;font-size:' + sz +
        ';font-family:var(--font-display);font-weight:700">' +
        inl(hm[2]) +   // ← inl() ya llama esc() internamente
        '</h' + lvl + '>'
      );
      i++;
      continue;
    }

    // ── Línea horizontal ──────────────────────────────────────────────────
    if (/^[-*_]{3,}\s*$/.test(line)) {
      out.push('<hr style="border:none;border-top:1px solid var(--color-border);margin:2rem 0"/>');
      i++;
      continue;
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
      out.push(
        '<div style="border-left:3px solid var(--color-primary);background:var(--color-bg-muted);' +
          'padding:.8rem 1.1rem;border-radius:0 6px 6px 0;margin:1rem 0;color:var(--color-text-muted);font-style:italic">' +
          inl(line.slice(2)) +
          '</div>'
      );
      i++;
      continue;
    }

    // ── Línea vacía ───────────────────────────────────────────────────────
    if (line.trim() === "") {
      out.push("");
      i++;
      continue;
    }

    // ── Párrafo ───────────────────────────────────────────────────────────
    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].startsWith("#") &&
      !lines[i].startsWith("```") &&
      !/^[-*+]\s/.test(lines[i]) &&
      !/^\d+\.\s/.test(lines[i]) &&
      !/^[-*_]{3,}/.test(lines[i]) &&
      !lines[i].startsWith("> ")
    ) {
      para.push(inl(lines[i]));   // ← inl() ya llama esc() internamente
      i++;
    }
    if (para.length) {
      out.push('<p style="margin:.6rem 0;line-height:1.75;color:var(--color-text)">' + para.join("<br/>") + '</p>');
    }
  }

  return out.join("\n");
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function TutorialViewer() {
  const { courseSlug } = useParams<{ courseSlug: string }>();
  const { user } = useAuth();

  const hasAccess = canAccessContent(user?.role);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  const metaQ = useQuery({
    queryKey: ["tutorial-meta", courseSlug],
    queryFn: () => fetchMeta(courseSlug!),
    enabled: !!courseSlug,
  });
  const tutorial = metaQ.data;
  const isPublicTutorial = tutorial?.is_public === true;
  const canView = hasAccess || isPublicTutorial;

  const pagesQ = useQuery({
    queryKey: ["tutorial-pages", courseSlug],
    queryFn: () => fetchPages(courseSlug!),
    enabled: !!courseSlug && canView,
    retry: false,
  });
  const pages: TutorialPage[] = pagesQ.data ?? [];
  const restrictedCourses: string[] | null = pagesQ.isError
    ? parseCourseRestriction(pagesQ.error)
    : null;

  useEffect(() => {
    if (pages.length > 0 && !activeSlug) setActiveSlug(pages[0].slug);
  }, [pages]);

  const contentQ = useQuery({
    queryKey: ["tutorial-content", courseSlug, activeSlug],
    queryFn: () => fetchPageContent(courseSlug!, activeSlug!),
    enabled: !!courseSlug && !!activeSlug && canView,
  });
  const content = contentQ.data;

  const SIDEBAR_W = 260;

  // Measure sticky header height so the sidebar sticks right below it
  const [headerH, setHeaderH] = useState(0);
  const roRef = useRef<ResizeObserver | null>(null);
  useEffect(() => {
    const header = document.querySelector(".site-header") as HTMLElement | null;
    if (!header) return;
    const update = () => setHeaderH(header.getBoundingClientRect().height);
    update();
    roRef.current = new ResizeObserver(update);
    roRef.current.observe(header);
    return () => roRef.current?.disconnect();
  }, []);

  return (
    <div className="bg-background">

      {/* Header del tutorial */}
      <div className="shrink-0 border-b border-border bg-card px-8 py-5">
        <Button variant="ghost" size="sm" asChild className="mb-3 -ml-3 text-primary hover:text-primary">
          <Link to="/tutorials">
            <ArrowLeft size={14}/> Todos los tutoriales
          </Link>
        </Button>
        {metaQ.isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <RefreshCw size={14} className="animate-spin"/> Cargando…
          </div>
        ) : (
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <BookOpen size={22} className="shrink-0 text-primary" />
              <h1 className="font-display text-2xl font-bold text-foreground">
                {tutorial?.title}
              </h1>
              {tutorial?.level && <Badge variant="secondary">{tutorial.level}</Badge>}
            </div>
            {tutorial?.description && (
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                {tutorial.description}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Body */}
      {!canView ? (
        /* ── Sin acceso: requiere login o rol válido ───────────────────── */
        <div className="flex flex-col items-center justify-center gap-4 px-6 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-border bg-muted">
            <Lock size={28} className="text-primary" />
          </div>
          <h2 className="font-display text-xl font-bold text-foreground">
            Contenido restringido
          </h2>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            Necesitas una cuenta con rol <strong className="text-foreground">student</strong>, <strong className="text-foreground">teacher</strong> o <strong className="text-foreground">admin</strong> para acceder al contenido de este tutorial.
          </p>
          <div className="mt-2 flex gap-3">
            <Button asChild>
              <Link to="/login">Iniciar sesión</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/register">Registrarse</Link>
            </Button>
          </div>
        </div>
      ) : restrictedCourses ? (
        /* ── Tiene rol válido pero no pertenece a la carrera ─────────── */
        <div className="flex flex-col items-center justify-center gap-4 px-6 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10">
            <Lock size={28} className="text-amber-500" />
          </div>
          <h2 className="font-display text-xl font-bold text-foreground">
            Tutorial exclusivo de carrera
          </h2>
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
            Este tutorial está disponible únicamente para alumnos de:
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {restrictedCourses.map((name) => (
              <Badge
                key={name}
                variant="outline"
                className="border-amber-500/30 bg-amber-500/10 px-3 py-1 text-sm font-semibold text-amber-600 dark:text-amber-400"
              >
                {name}
              </Badge>
            ))}
          </div>
          <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
            Contacta a tu institución o administrador para que te asignen la carrera correspondiente.
          </p>
          <Button variant="outline" size="sm" asChild className="mt-1">
            <Link to="/tutorials">← Volver a tutoriales</Link>
          </Button>
        </div>
      ) : (
        <div className="flex items-start">
          <aside
            className="flex shrink-0 flex-col overflow-y-auto border-r border-border bg-muted/40"
            style={{ width: SIDEBAR_W, position: "sticky", top: headerH, height: `calc(100vh - ${headerH}px)` }}
          >
            <div className="shrink-0 border-b border-border px-4 py-3">
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Páginas del tutorial
              </span>
            </div>
            <div className="flex-1 overflow-y-auto py-1.5" style={{ overscrollBehavior: "contain" }}>
              {pagesQ.isLoading && (
                <div className="flex items-center gap-2 px-4 py-4 text-sm text-muted-foreground">
                  <RefreshCw size={13} className="animate-spin"/> Cargando…
                </div>
              )}
              {!pagesQ.isLoading && pages.length === 0 && (
                <EmptyState
                  icon={FileText}
                  title="Sin páginas publicadas"
                  className="rounded-none border-none py-8"
                />
              )}
              {pages.map((p, idx) => {
                const isActive = p.slug === activeSlug;
                return (
                  <button
                    key={p.id}
                    onClick={() => setActiveSlug(p.slug)}
                    className={cn(
                      "flex w-full items-center gap-2.5 border-l-[3px] px-4 py-2.5 text-left font-body transition-colors",
                      isActive
                        ? "border-l-brand-accent bg-primary text-primary-foreground"
                        : "border-l-transparent text-foreground hover:bg-muted"
                    )}
                  >
                    <span className="shrink-0 font-mono text-xs opacity-55">
                      {String(p.order || idx + 1).padStart(2, "0")}
                    </span>
                    <span className="flex-1 truncate text-sm leading-tight">
                      {p.title}
                    </span>
                    {isActive && <ChevronRight size={13} className="shrink-0 opacity-70"/>}
                  </button>
                );
              })}
            </div>
          </aside>

          <main className="min-w-0 flex-1 bg-background px-11 py-8">
            {!activeSlug && (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
                <BookOpen size={48} className="opacity-15"/>
                <p className="text-sm">Selecciona una página</p>
              </div>
            )}
            {activeSlug && contentQ.isLoading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <RefreshCw size={14} className="animate-spin"/> Cargando contenido…
              </div>
            )}
            {content && !contentQ.isLoading && (
              <>
                <div className="mb-7 border-b border-border pb-5">
                  <h2 className="mb-1.5 font-display text-2xl font-bold text-foreground">
                    {content.lesson.title}
                  </h2>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="font-mono">
                      Página {content.lesson.order} de {pages.length}
                    </span>
                  </div>
                </div>
                {content.markdown ? (
                  <div
                    className="max-w-[820px] font-body leading-relaxed text-foreground"
                    dangerouslySetInnerHTML={{ __html: mdToHtml(content.markdown) }}
                  />
                ) : (
                  <div className="text-sm italic text-muted-foreground">
                    Esta página aún no tiene contenido.
                  </div>
                )}
                <Separator className="mt-12" />
                <div className="flex justify-between pt-5">
                  <div>
                    {content.nav.prev && (
                      <Button variant="outline" onClick={() => setActiveSlug(content.nav.prev!)}>
                        <ChevronLeft size={15}/> Página anterior
                      </Button>
                    )}
                  </div>
                  <div>
                    {content.nav.next && (
                      <Button onClick={() => setActiveSlug(content.nav.next!)}>
                        Siguiente página <ChevronRight size={15}/>
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}
          </main>
        </div>
      )}
    </div>
  );
}
