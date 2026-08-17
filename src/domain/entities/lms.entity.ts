export type LmsCourseStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface LmsStudyCourseRef {
  id: string;
  name: string;
}

export interface LmsTeacherRef {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
}

export interface LmsCourse {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  status: LmsCourseStatus;
  cover_image?: string;
  teacher_id: string;
  teacher?: LmsTeacherRef;
  study_courses?: LmsStudyCourseRef[];
  units?: LmsCourseUnit[];
  created_at?: string;
  updated_at?: string;
}

export interface LmsCourseUnit {
  id: string;
  course_id: string;
  title: string;
  order: number;
  status: string;
  activities?: LmsActivity[];
}

/** Catálogo abierto: agregar un tipo nuevo no requiere cambios aquí, solo su propio render/gestión. */
export type LmsActivityType = "presentation" | "forum" | "assignment" | "quiz" | "exam" | string;

export interface LmsActivity {
  id: string;
  unit_id: string;
  type: LmsActivityType;
  title: string;
  instructions?: string | null;
  order: number;
  status: string;
  due_at?: string | null;
  max_score?: number | null;
  config: Record<string, any>;
  created_at?: string;
}

export type LmsActivityProgressStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";

export interface LmsActivityProgress {
  id: string;
  activity_id: string;
  student_id: string;
  status: LmsActivityProgressStatus;
  score: number | null;
  completed_at: string | null;
}

export type LmsEnrollmentStatus = "ACTIVE" | "COMPLETED" | "DROPPED";

export interface LmsEnrollment {
  enrollment_id: string;
  status: LmsEnrollmentStatus;
  progress_percent: number;
  last_activity_at: string | null;
  enrolled_at?: string;
  course: LmsCourse;
}

export interface LmsRosterEntry {
  enrollment_id: string;
  status: LmsEnrollmentStatus;
  progress_percent: number;
  last_activity_at: string | null;
  enrolled_at: string;
  student: { id: string; first_name: string; last_name: string; email: string };
}

// ── Foro ─────────────────────────────────────────────────────────────────────

export interface LmsForumAuthorRef {
  id: string;
  first_name: string;
  last_name: string;
}

export interface LmsForumPost {
  id: string;
  thread_id: string;
  author_id: string;
  author?: LmsForumAuthorRef;
  body: string;
  parent_post_id?: string;
  created_at: string;
}

export interface LmsForumThread {
  id: string;
  activity_id: string;
  author_id: string;
  author?: LmsForumAuthorRef;
  title: string;
  body: string;
  is_pinned: boolean;
  is_locked: boolean;
  created_at: string;
  posts?: LmsForumPost[];
}

// ── Tareas / entregas ────────────────────────────────────────────────────────

export type LmsSubmissionStatus = "PENDING" | "SUBMITTED" | "LATE" | "GRADED";

export interface LmsSubmission {
  id: string;
  activity_id: string;
  student_id: string;
  student?: { id: string; first_name: string; last_name: string; email: string };
  content_text: string | null;
  file_url?: string;
  status: LmsSubmissionStatus;
  submitted_at: string | null;
  grade: number | null;
  feedback: string | null;
  graded_at?: string | null;
}

// ── Quiz / examen ────────────────────────────────────────────────────────────

export type LmsQuestionType = "MULTIPLE_CHOICE" | "OPEN";

export interface LmsQuizOption {
  id: string;
  text: string;
  is_correct?: boolean;
  order: number;
}

export interface LmsQuizQuestion {
  id: string;
  activity_id: string;
  text: string;
  type: LmsQuestionType;
  order: number;
  feedback?: string | null;
  options: LmsQuizOption[];
}

export interface LmsQuizAnswerFeedback {
  question_id: string;
  question_text: string;
  selected_option_id?: string;
  text_answer?: string;
  is_correct?: boolean;
  feedback?: string | null;
}

export interface LmsQuizAttempt {
  id: string;
  activity_id: string;
  student_id: string;
  score: number | null;
  submitted_at: string | null;
  answers?: LmsQuizAnswerFeedback[];
}
