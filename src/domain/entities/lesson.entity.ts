export type LessonStatus =
  | "DRAFT"
  | "IN_REVIEW"
  | "PUBLISHED"
  | "HIDDEN"
  | "ARCHIVED";

export interface Lesson {
  id: string;
  /** UUID de la TutorialSection padre */
  section: string;
  title: string;
  slug: string;
  summary?: string | null;
  order: number;
  status: LessonStatus;
  pages_count?: number;
}
