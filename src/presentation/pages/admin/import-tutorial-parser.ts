/**
 * import-tutorial-parser.ts
 * Deriva la jerarquía Sección→Lección a partir de archivos Markdown locales,
 * usando la convención: H1 = título del curso, H2 "Módulo N · Título" = sección,
 * H3 = título de la lección/página. Si un archivo no tiene H2 de módulo, cae en
 * una sección única "Contenido" (mismo fallback que ya usa TutorialEditor.tsx
 * para cursos creados a mano).
 */

const FALLBACK_SECTION_ORDER = 0;
const FALLBACK_SECTION_TITLE = "Contenido";

const H1_RE = /^#\s+(.+)$/m;
const MODULE_RE = /^##\s*M[oó]dulo\s+(\d+)\s*[·:\-]?\s*(.*)$/im;
const H3_RE = /^###\s+(.+)$/m;
const TRAILING_NUMBER_RE = /(\d+)(?!.*\d)/;

export interface RawFile {
  filename: string;
  content: string;
}

export interface ParsedLesson {
  filename: string;
  slug: string;
  title: string;
  order: number;
  markdown: string;
}

export interface ParsedSection {
  order: number;
  title: string;
  lessons: ParsedLesson[];
}

function slugifyFilename(filename: string): string {
  const base = filename.replace(/\.mdx?$/i, "");
  return base
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function orderFromFilename(filename: string, fallbackIndex: number): number {
  const base = filename.replace(/\.mdx?$/i, "");
  const match = base.match(TRAILING_NUMBER_RE);
  return match ? parseInt(match[1], 10) : fallbackIndex + 1;
}

function parseOne(file: RawFile, index: number): { sectionOrder: number; sectionTitle: string; lesson: ParsedLesson } {
  const moduleMatch = file.content.match(MODULE_RE);
  const h3Match = file.content.match(H3_RE);
  const h1Match = file.content.match(H1_RE);

  const sectionOrder = moduleMatch ? parseInt(moduleMatch[1], 10) : FALLBACK_SECTION_ORDER;
  const sectionTitle = moduleMatch
    ? `Módulo ${moduleMatch[1]}${moduleMatch[2] ? ` · ${moduleMatch[2].trim()}` : ""}`
    : FALLBACK_SECTION_TITLE;

  const title = (h3Match?.[1] || h1Match?.[1] || file.filename).trim();

  return {
    sectionOrder,
    sectionTitle,
    lesson: {
      filename: file.filename,
      slug: slugifyFilename(file.filename),
      title,
      order: orderFromFilename(file.filename, index),
      markdown: file.content,
    },
  };
}

export function parseTutorialFiles(files: RawFile[]): ParsedSection[] {
  const sections = new Map<number, ParsedSection>();

  files.forEach((file, index) => {
    const { sectionOrder, sectionTitle, lesson } = parseOne(file, index);
    const existing = sections.get(sectionOrder);
    if (existing) {
      existing.lessons.push(lesson);
    } else {
      sections.set(sectionOrder, { order: sectionOrder, title: sectionTitle, lessons: [lesson] });
    }
  });

  const result = Array.from(sections.values());
  result.forEach((s) => s.lessons.sort((a, b) => a.order - b.order));
  result.sort((a, b) => a.order - b.order);
  return result;
}

export function suggestCourseTitle(files: RawFile[]): string {
  for (const file of files) {
    const match = file.content.match(H1_RE);
    if (match) return match[1].replace(/[—-]\s*P[aá]gina\s*\d+\s*$/i, "").trim();
  }
  return "";
}

export interface SingleLesson {
  slug: string;
  title: string;
  markdown: string;
}

/** Igual que parseOne() pero sin detección de módulo — para agregar/reemplazar
 *  páginas sueltas en un curso que ya tiene una sola sección (TutorialEditor.tsx). */
export function parseSingleLesson(file: RawFile): SingleLesson {
  const h3Match = file.content.match(H3_RE);
  const h1Match = file.content.match(H1_RE);
  const title = (h3Match?.[1] || h1Match?.[1] || file.filename).trim();
  return { slug: slugifyFilename(file.filename), title, markdown: file.content };
}

export function readFilesAsText(fileList: FileList): Promise<RawFile[]> {
  const files = Array.from(fileList);
  return Promise.all(
    files.map(
      (file) =>
        new Promise<RawFile>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve({ filename: file.name, content: String(reader.result || "") });
          reader.onerror = () => reject(reader.error);
          reader.readAsText(file, "UTF-8");
        })
    )
  );
}
