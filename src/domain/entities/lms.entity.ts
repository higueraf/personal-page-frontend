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
  starts_at?: string | null;
  ends_at?: string | null;
  activities?: LmsActivity[];
}

/** Catálogo abierto: agregar un tipo nuevo no requiere cambios aquí, solo su propio render/gestión. */
export type LmsActivityType = "presentation" | "forum" | "assignment" | "quiz" | "exam" | "survey" | string;

export interface LmsActivity {
  id: string;
  unit_id: string;
  type: LmsActivityType;
  title: string;
  instructions?: string | null;
  order: number;
  status: string;
  starts_at?: string | null;
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

export interface LmsSubmissionFile {
  id: string;
  file_url: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
}

export interface LmsSubmission {
  id: string;
  activity_id: string;
  student_id: string;
  student?: { id: string; first_name: string; last_name: string; email: string };
  content_text: string | null;
  /** Legado: URL suelta pegada a mano antes de que existiera la subida real de archivos. */
  file_url?: string;
  files?: LmsSubmissionFile[];
  status: LmsSubmissionStatus;
  submitted_at: string | null;
  grade: number | null;
  feedback: string | null;
  graded_at?: string | null;
}

// ── Quiz / examen ────────────────────────────────────────────────────────────

/** MULTIPLE_CHOICE es, pese al nombre, de una sola respuesta correcta (radio); MULTI_ANSWER es de varias (checkboxes). */
export type LmsQuestionType = "MULTIPLE_CHOICE" | "MULTI_ANSWER" | "OPEN";

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
  selected_option_ids?: string[];
  text_answer?: string;
  is_correct?: boolean;
  feedback?: string | null;
}

// ── Import/export de banco de preguntas (quiz y encuesta comparten estos formatos de archivo) ──

export type LmsQuizFileFormat = "own" | "gift" | "aiken" | "moodle_xml";
export type LmsQuizImportMode = "append" | "replace";

export interface LmsQuizImportResult {
  created: LmsQuizQuestion[];
  warnings: string[];
}

export interface LmsQuizAttempt {
  id: string;
  activity_id: string;
  student_id: string;
  score: number | null;
  started_at: string | null;
  submitted_at: string | null;
  answers?: LmsQuizAnswerFeedback[];
}

// ── Encuestas ────────────────────────────────────────────────────────────────

export type LmsSurveyQuestionType = "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "SCALE" | "TEXT";

export interface LmsSurveyOption {
  id: string;
  text: string;
  order: number;
}

export interface LmsSurveyQuestion {
  id: string;
  activity_id: string;
  text: string;
  type: LmsSurveyQuestionType;
  order: number;
  scale_min: number | null;
  scale_max: number | null;
  options: LmsSurveyOption[];
}

export interface LmsSurveyAnswer {
  question_id: string;
  selected_option_ids?: string[];
  scale_value?: number;
  text_answer?: string;
}

export interface LmsSurveyResponse {
  id: string;
  activity_id: string;
  student_id: string;
  submitted_at: string | null;
  answers?: LmsSurveyAnswer[];
}

export interface LmsSurveyResultOption {
  id: string;
  text: string;
  count: number;
}

export interface LmsSurveyResultQuestion {
  question_id: string;
  text: string;
  type: LmsSurveyQuestionType;
  options?: LmsSurveyResultOption[];
  scale_min?: number | null;
  scale_max?: number | null;
  average?: number | null;
  count?: number;
  answers?: { text: string; student?: { first_name: string; last_name: string } }[];
}

export interface LmsSurveyResults {
  total_responses: number;
  anonymous: boolean;
  questions: LmsSurveyResultQuestion[];
}
