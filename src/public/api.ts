/**
 * public/api.ts
 * ──────────────────────────────────────────────────────────────────
 * Capa de acceso a los endpoints PÚBLICOS del módulo learning.
 *
 * Endpoints reales (prefix /api/):
 *  GET  public/courses
 *       → { data: Course[], meta: { total_records, page, page_size } }
 *  GET  public/courses/:course_slug
 *       → { id, title, slug, description, level }
 *  GET  public/courses/:course_slug/curriculum
 *       → { course: { title, slug }, curriculum: SectionWithLessons[] }
 *  GET  public/lessons/:course_slug/:lesson_slug/pages/:page_order
 *       → { course, lesson, page, blocks, nav }
 * ──────────────────────────────────────────────────────────────────
 */
import http from "../shared/api/http";

// ── Tipos ──────────────────────────────────────────────────────────

export interface Course {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  level?: string | null;
}

export interface PaginatedCourses {
  data: Course[];
  meta: {
    total_records: number;
    page: number;
    page_size: number;
  };
}

export interface LessonBrief {
  id: string;
  title: string;
  slug: string;
  order: number;
  pages_count: number;
}

export interface SectionWithLessons {
  section: { id: string; title: string; order: number };
  lessons: LessonBrief[];
}

export interface Curriculum {
  course: { title: string; slug: string };
  curriculum: SectionWithLessons[];
}

export interface Block {
  id: string;
  type:
    | "heading"
    | "paragraph"
    | "list"
    | "code"
    | "table"
    | "callout"
    | "divider";
  order: number;
  data: Record<string, any>;
}

export interface LessonPage {
  course: { title: string; slug: string };
  lesson: { title: string; slug: string };
  page: {
    title?: string | null;
    order: number;
    estimated_minutes: number;
    total_pages: number;
  };
  blocks: Block[];
  nav: { prev: number | null; next: number | null };
}

// ── Funciones de acceso ────────────────────────────────────────────

/**
 * GET /api/public/courses
 * Soporta: ?search=<term>&page=<n>&page_size=<n>
 */
export async function getPublicCourses(params?: {
  search?: string;
  page?: number;
  page_size?: number;
}): Promise<PaginatedCourses> {
  const { data } = await http.get<PaginatedCourses>("/public/courses", {
    params,
  });
  return data;
}

/**
 * GET /api/public/courses/:course_slug
 */
export async function getPublicCourse(courseSlug: string): Promise<Course> {
  const { data } = await http.get<Course>(`/public/courses/${courseSlug}`);
  return data;
}

/**
 * GET /api/public/courses/:course_slug/curriculum
 */
export async function getCurriculum(courseSlug: string): Promise<Curriculum> {
  const { data } = await http.get<Curriculum>(
    `/public/courses/${courseSlug}/curriculum`
  );
  return data;
}

/**
 * GET /api/public/lessons/:course_slug/:lesson_slug/pages/:page_order
 */
export async function getLessonPage(
  courseSlug: string,
  lessonSlug: string,
  pageOrder: number
): Promise<LessonPage> {
  const { data } = await http.get<LessonPage>(
    `/public/lessons/${courseSlug}/${lessonSlug}/pages/${pageOrder}`
  );
  return data;
}
