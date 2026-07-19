export type TutorialStatus =
  | "DRAFT"
  | "IN_REVIEW"
  | "PUBLISHED"
  | "HIDDEN"
  | "ARCHIVED";

export interface StudyCourseRef {
  id: string;
  name: string;
}

export interface Tutorial {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  level?: string | null;
  status: TutorialStatus;
  is_public?: boolean;
  study_courses?: StudyCourseRef[];
  created_at?: string;
  updated_at?: string;
}
