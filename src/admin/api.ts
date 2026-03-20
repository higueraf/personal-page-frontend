/**
 * admin/api.ts
 * ──────────────────────────────────────────────────────────────────
 * Endpoints PROTEGIDOS del módulo learning (requieren cookie "jwt").
 *
 * Patrón de respuesta:
 *   LIST  → { data: T[], meta: { total_records, page, page_size } }
 *   GET   → { data: T }
 *   POST  → { data: T }
 *   PUT   → { data: T }
 *   DELETE→ 204
 *
 * Rutas:
 *  /api/courses                   GET list  | POST
 *  /api/courses/:pk               GET one   | PUT | DELETE
 *  /api/course-sections           GET list  | POST   (?course_id=)
 *  /api/course-sections/:pk       GET | PUT | DELETE
 *  /api/lessons                   GET list  | POST   (?section_id=)
 *  /api/lessons/:pk               GET | PUT | DELETE
 *  /api/lesson-pages              GET list  | POST   (?lesson_id=)
 *  /api/lesson-pages/:pk          GET | PUT | DELETE
 *  /api/content-blocks            GET list  | POST   (?page_id=)
 *  /api/content-blocks/:pk        GET | PUT | DELETE
 * ──────────────────────────────────────────────────────────────────
 */
import http from "../shared/api/http";

// ── Tipos comunes ──────────────────────────────────────────────────

export type CourseStatus =
  | "DRAFT"
  | "IN_REVIEW"
  | "PUBLISHED"
  | "HIDDEN"
  | "ARCHIVED";

export type LessonStatus =
  | "DRAFT"
  | "IN_REVIEW"
  | "PUBLISHED"
  | "HIDDEN"
  | "ARCHIVED";

export type PageStatus = "DRAFT" | "PUBLISHED" | "HIDDEN";

export type BlockType =
  | "heading"
  | "paragraph"
  | "list"
  | "code"
  | "table"
  | "callout"
  | "divider"
  | "markdown";

export interface AdminCourse {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  level?: string | null;
  status: CourseStatus;
  created_at: string;
  updated_at: string;
}

export interface AdminSection {
  id: string;
  course: string; // UUID
  title: string;
  order: number;
  status?: string;
}

export interface AdminLesson {
  id: string;
  section: string; // UUID
  title: string;
  slug: string;
  summary?: string | null;
  order: number;
  status: LessonStatus;
}

export interface AdminPage {
  id: string;
  lesson: string; // UUID
  title?: string | null;
  order: number;
  estimated_minutes: number;
  status: PageStatus;
}

export interface AdminBlock {
  id: string;
  page: string; // UUID
  type: BlockType;
  order: number;
  data: Record<string, any>;
}

export interface Paginated<T> {
  data: T[];
  meta: { total_records: number; page: number; page_size: number };
}

// ── Helpers ────────────────────────────────────────────────────────

function list<T>(url: string, params?: Record<string, any>) {
  return http
    .get<Paginated<T>>(url, { params })
    .then((r) => r.data);
}

function one<T>(url: string) {
  return http.get<{ data: T }>(url).then((r) => r.data.data);
}

function create<T>(url: string, body: Partial<T>) {
  return http.post<{ data: T }>(url, body).then((r) => r.data.data);
}

function update<T>(url: string, body: Partial<T>) {
  return http.put<{ data: T }>(url, body).then((r) => r.data.data);
}

function remove(url: string) {
  return http.delete(url);
}

// ── Cursos ─────────────────────────────────────────────────────────

export const adminCourses = {
  list: (params?: { search?: string; page?: number; page_size?: number }) =>
    list<AdminCourse>("/courses", params),
  get: (pk: string) => one<AdminCourse>(`/courses/${pk}`),
  create: (body: Partial<AdminCourse>) => create<AdminCourse>("/courses", body),
  update: (pk: string, body: Partial<AdminCourse>) =>
    update<AdminCourse>(`/courses/${pk}`, body),
  delete: (pk: string) => remove(`/courses/${pk}`),
};

// ── Secciones ──────────────────────────────────────────────────────

export const adminSections = {
  list: (params?: { course_id?: string; page?: number }) =>
    list<AdminSection>("/course-sections", params),
  get: (pk: string) => one<AdminSection>(`/course-sections/${pk}`),
  create: (body: Partial<AdminSection>) =>
    create<AdminSection>("/course-sections", body),
  update: (pk: string, body: Partial<AdminSection>) =>
    update<AdminSection>(`/course-sections/${pk}`, body),
  delete: (pk: string) => remove(`/course-sections/${pk}`),
};

// ── Lecciones ──────────────────────────────────────────────────────

export const adminLessons = {
  list: (params?: { section_id?: string; search?: string; page?: number }) =>
    list<AdminLesson>("/lessons", params),
  get: (pk: string) => one<AdminLesson>(`/lessons/${pk}`),
  create: (body: Partial<AdminLesson>) =>
    create<AdminLesson>("/lessons", body),
  update: (pk: string, body: Partial<AdminLesson>) =>
    update<AdminLesson>(`/lessons/${pk}`, body),
  reorder: (items: { id: string; order: number }[]) =>
    http.post("/lessons/reorder", { items }).then((r) => r.data),
  delete: (pk: string) => remove(`/lessons/${pk}`),
};

// ── Páginas ────────────────────────────────────────────────────────

export const adminPages = {
  list: (params?: { lesson_id?: string; page?: number }) =>
    list<AdminPage>("/lesson-pages", params),
  get: (pk: string) => one<AdminPage>(`/lesson-pages/${pk}`),
  create: (body: Partial<AdminPage>) =>
    create<AdminPage>("/lesson-pages", body),
  update: (pk: string, body: Partial<AdminPage>) =>
    update<AdminPage>(`/lesson-pages/${pk}`, body),
  delete: (pk: string) => remove(`/lesson-pages/${pk}`),
};

// ── Video Cursos ─────────────────────────────────────────────────

export type VideoType = "youtube" | "vimeo" | "file" | "none";
export type VCStatus  = "DRAFT" | "PUBLISHED" | "HIDDEN" | "ARCHIVED";
export type VLStatus  = "DRAFT" | "PUBLISHED" | "HIDDEN";

export interface AdminVideoCourse {
  id: string; title: string; slug: string;
  description?: string | null; level?: string | null;
  status: VCStatus; thumbnail?: string | null;
}
export interface AdminVideoSection {
  id: string; course: string; title: string; order: number;
}
export interface AdminVideoLesson {
  id: string; section: string; title: string; slug: string;
  order: number; status: VLStatus;
  video_type: VideoType; video_url?: string | null; video_file?: string | null;
  duration_seconds: number; markdown: string; is_free_preview: boolean;
}

export const adminVideoCourses = {
  list:   (p?: { search?: string }) => list<AdminVideoCourse>("/video-courses", p),
  get:    (pk: string)              => one<AdminVideoCourse>(`/video-courses/${pk}`),
  create: (b: Partial<AdminVideoCourse>) => create<AdminVideoCourse>("/video-courses", b),
  update: (pk: string, b: Partial<AdminVideoCourse>) => update<AdminVideoCourse>(`/video-courses/${pk}`, b),
  delete: (pk: string) => remove(`/video-courses/${pk}`),
};
export const adminVideoSections = {
  list:   (p?: { course_id?: string }) => list<AdminVideoSection>("/video-sections", p),
  create: (b: Partial<AdminVideoSection>) => create<AdminVideoSection>("/video-sections", b),
  update: (pk: string, b: Partial<AdminVideoSection>) => update<AdminVideoSection>(`/video-sections/${pk}`, b),
  delete: (pk: string) => remove(`/video-sections/${pk}`),
};
export const adminVideoLessons = {
  list:   (p?: { section_id?: string }) => list<AdminVideoLesson>("/video-lessons", p),
  create: (b: Partial<AdminVideoLesson>) => create<AdminVideoLesson>("/video-lessons", b),
  update: (pk: string, b: Partial<AdminVideoLesson>) => update<AdminVideoLesson>(`/video-lessons/${pk}`, b),
  delete: (pk: string) => remove(`/video-lessons/${pk}`),
};

// ── Bloques ────────────────────────────────────────────────────────

export const adminBlocks = {
  list: (params?: { page_id?: string; page?: number }) =>
    list<AdminBlock>("/content-blocks", params),
  get: (pk: string) => one<AdminBlock>(`/content-blocks/${pk}`),
  create: (body: Partial<AdminBlock>) =>
    create<AdminBlock>("/content-blocks", body),
  update: (pk: string, body: Partial<AdminBlock>) =>
    update<AdminBlock>(`/content-blocks/${pk}`, body),
  delete: (pk: string) => remove(`/content-blocks/${pk}`),
};
