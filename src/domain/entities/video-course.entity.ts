export type VideoType = "youtube" | "vimeo" | "file" | "none";
export type VCStatus = "DRAFT" | "PUBLISHED" | "HIDDEN" | "ARCHIVED";
export type VLStatus = "DRAFT" | "PUBLISHED" | "HIDDEN";

export interface VideoCourse {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  level?: string | null;
  status: VCStatus;
  thumbnail?: string | null;
}

export interface VideoSection {
  id: string;
  course: string;
  title: string;
  order: number;
}

export interface VideoLesson {
  id: string;
  section: string;
  title: string;
  slug: string;
  order: number;
  status: VLStatus;
  video_type: VideoType;
  video_url?: string | null;
  video_file?: string | null;
  duration_seconds: number;
  markdown: string;
  is_free_preview: boolean;
}

export interface CourseCurriculumLesson {
  id: string;
  title: string;
  slug: string;
  order: number;
  video_type: string;
  duration_seconds: number;
  is_free_preview: boolean;
}

export interface CourseCurriculumSection {
  id: string;
  title: string;
  order: number;
  lessons: CourseCurriculumLesson[];
}

export interface CourseMeta {
  id: string;
  title: string;
  slug: string;
  description?: string;
  level?: string;
  thumbnail?: string;
  curriculum: CourseCurriculumSection[] | null;
}

export interface LessonContent {
  lesson: { id: string; title: string; slug: string; order: number; duration_seconds: number };
  video: { type: string; embed_url?: string; stream_url?: string };
  markdown: string;
  nav: { prev: string | null; next: string | null };
}
