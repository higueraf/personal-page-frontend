/**
 * TutorialViewer.tsx
 * Vista pública de un tutorial con acceso restringido por rol.
 */

import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, ChevronRight, Lock, ArrowLeft, ChevronLeft, RefreshCw, FileText } from "lucide-react";
import http from "../../shared/api/http";
import { useAuth } from "../../shared/auth/useAuth";
import hljs from "highlight.js";

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

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--color-bg)" }}>

      {/* Header del tutorial */}
      <div style={{ flexShrink: 0, background: "var(--color-surface)", borderBottom: "1px solid var(--color-border)", padding: "20px 32px" }}>
        <Link to="/tutorials" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--color-primary)", fontSize: ".83rem", textDecoration: "none", marginBottom: 12 }}>
          <ArrowLeft size={14}/> Todos los tutoriales
        </Link>
        {metaQ.isLoading ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--color-text-muted)" }}>
            <RefreshCw size={14}/> Cargando…
          </div>
        ) : (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <BookOpen size={22} style={{ color: "var(--color-primary)", flexShrink: 0 }} />
              <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.5rem", color: "var(--color-text)" }}>
                {tutorial?.title}
              </h1>
              {tutorial?.level && <span className="badge badge--blue">{tutorial.level}</span>}
            </div>
            {tutorial?.description && (
              <p style={{ marginTop: 8, color: "var(--color-text-muted)", fontSize: ".93rem", maxWidth: 680, lineHeight: 1.6 }}>
                {tutorial.description}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Body */}
      {!canView ? (
        /* ── Sin acceso: requiere login o rol válido ───────────────────── */
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 24px", gap: 16, textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--color-bg-muted)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--color-border)" }}>
            <Lock size={28} style={{ color: "var(--color-primary)" }} />
          </div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.2rem", color: "var(--color-text)" }}>
            Contenido restringido
          </h2>
          <p style={{ color: "var(--color-text-muted)", maxWidth: 380, lineHeight: 1.6, fontSize: ".93rem" }}>
            Necesitas una cuenta con rol <strong>student</strong>, <strong>teacher</strong> o <strong>admin</strong> para acceder al contenido de este tutorial.
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
      ) : restrictedCourses ? (
        /* ── Tiene rol válido pero no pertenece a la carrera ─────────── */
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 24px", gap: 16, textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(245,158,11,.1)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(245,158,11,.3)" }}>
            <Lock size={28} style={{ color: "#f59e0b" }} />
          </div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.2rem", color: "var(--color-text)" }}>
            Tutorial exclusivo de carrera
          </h2>
          <p style={{ color: "var(--color-text-muted)", maxWidth: 420, lineHeight: 1.6, fontSize: ".93rem" }}>
            Este tutorial está disponible únicamente para alumnos de:
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
            {restrictedCourses.map((name) => (
              <span key={name} style={{
                background: "rgba(245,158,11,.12)", color: "#d97706",
                border: "1px solid rgba(245,158,11,.3)",
                padding: "4px 14px", borderRadius: 99,
                fontSize: ".88rem", fontWeight: 600,
              }}>
                {name}
              </span>
            ))}
          </div>
          <p style={{ color: "var(--color-text-muted)", fontSize: ".83rem", maxWidth: 380, lineHeight: 1.5 }}>
            Contacta a tu institución o administrador para que te asignen la carrera correspondiente.
          </p>
          <Link to="/tutorials" style={{
            marginTop: 4, background: "var(--color-bg-muted)", color: "var(--color-text)",
            border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)",
            padding: "9px 18px", fontSize: ".88rem", textDecoration: "none",
            display: "inline-flex", alignItems: "center", gap: 6,
          }}>
            ← Volver a tutoriales
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden" }}>
          <aside style={{
            width: SIDEBAR_W, flexShrink: 0,
            borderRight: "1px solid var(--color-border)",
            background: "var(--color-bg-muted)",
            display: "flex", flexDirection: "column", minHeight: 0,
          }}>
            <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid var(--color-border)" }}>
              <span style={{ fontSize: ".72rem", fontWeight: 700, color: "var(--color-text-muted)", letterSpacing: ".06em", textTransform: "uppercase" }}>
                Páginas del tutorial
              </span>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "6px 0", overscrollBehavior: "contain" }}>
              {pagesQ.isLoading && (
                <div style={{ padding: "16px", color: "var(--color-text-muted)", fontSize: ".83rem", display: "flex", alignItems: "center", gap: 6 }}>
                  <RefreshCw size={13}/> Cargando…
                </div>
              )}
              {!pagesQ.isLoading && pages.length === 0 && (
                <div style={{ padding: "24px 16px", textAlign: "center", color: "var(--color-text-muted)", fontSize: ".83rem" }}>
                  <FileText size={28} style={{ opacity: .25, display: "block", margin: "0 auto 8px" }}/>
                  Sin páginas publicadas
                </div>
              )}
              {pages.map((p, idx) => {
                const isActive = p.slug === activeSlug;
                return (
                  <button
                    key={p.id}
                    onClick={() => setActiveSlug(p.slug)}
                    style={{
                      width: "100%", textAlign: "left", border: "none", cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 10, padding: "10px 16px",
                      background: isActive ? "var(--color-primary)" : "transparent",
                      color: isActive ? "#fff" : "var(--color-text)",
                      borderLeft: isActive ? "3px solid var(--color-accent)" : "3px solid transparent",
                      transition: "background .15s", fontFamily: "var(--font-body)",
                    }}
                  >
                    <span style={{ fontSize: ".7rem", fontFamily: "var(--font-mono)", opacity: .55, flexShrink: 0 }}>
                      {String(p.order || idx + 1).padStart(2, "0")}
                    </span>
                    <span style={{ flex: 1, fontSize: ".85rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.4 }}>
                      {p.title}
                    </span>
                    {isActive && <ChevronRight size={13} style={{ flexShrink: 0, opacity: .7 }}/>}
                  </button>
                );
              })}
            </div>
          </aside>

          <main style={{ flex: 1, overflowY: "auto", padding: "32px 44px", background: "var(--color-bg)", overscrollBehavior: "contain" }}>
            {!activeSlug && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--color-text-muted)", gap: 12 }}>
                <BookOpen size={48} style={{ opacity: .15 }}/>
                <p style={{ fontSize: ".9rem" }}>Selecciona una página</p>
              </div>
            )}
            {activeSlug && contentQ.isLoading && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--color-text-muted)" }}>
                <RefreshCw size={14}/> Cargando contenido…
              </div>
            )}
            {content && !contentQ.isLoading && (
              <>
                <div style={{ marginBottom: 28, paddingBottom: 20, borderBottom: "1px solid var(--color-border)" }}>
                  <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.6rem", color: "var(--color-text)", marginBottom: 6 }}>
                    {content.lesson.title}
                  </h2>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--color-text-muted)", fontSize: ".8rem" }}>
                    <span style={{ fontFamily: "var(--font-mono)" }}>
                      Página {content.lesson.order} de {pages.length}
                    </span>
                  </div>
                </div>
                {content.markdown ? (
                  <div
                    style={{ fontFamily: "var(--font-body)", color: "var(--color-text)", lineHeight: 1.75, maxWidth: 820 }}
                    dangerouslySetInnerHTML={{ __html: mdToHtml(content.markdown) }}
                  />
                ) : (
                  <div style={{ color: "var(--color-text-muted)", fontSize: ".9rem", fontStyle: "italic" }}>
                    Esta página aún no tiene contenido.
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 48, paddingTop: 20, borderTop: "1px solid var(--color-border)" }}>
                  <div>
                    {content.nav.prev && (
                      <button onClick={() => setActiveSlug(content.nav.prev!)}
                        style={{ display: "flex", alignItems: "center", gap: 7, background: "var(--color-bg-muted)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "9px 16px", color: "var(--color-text)", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: ".85rem" }}>
                        <ChevronLeft size={15}/> Página anterior
                      </button>
                    )}
                  </div>
                  <div>
                    {content.nav.next && (
                      <button onClick={() => setActiveSlug(content.nav.next!)}
                        style={{ display: "flex", alignItems: "center", gap: 7, background: "var(--color-primary)", border: "none", borderRadius: "var(--radius-md)", padding: "9px 16px", color: "#fff", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: ".85rem", fontWeight: 600 }}>
                        Siguiente página <ChevronRight size={15}/>
                      </button>
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
