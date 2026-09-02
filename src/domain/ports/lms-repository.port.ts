import { Paginated } from "../shared/pagination";
import {
  LmsActivity,
  LmsActivityProgress,
  LmsCourse,
  LmsCourseUnit,
  LmsEnrollment,
  LmsForumPost,
  LmsForumThread,
  LmsQuizAttempt,
  LmsQuizFileFormat,
  LmsQuizImportMode,
  LmsQuizImportResult,
  LmsQuizQuestion,
  LmsRosterEntry,
  LmsSubmission,
  LmsSurveyQuestion,
  LmsSurveyResponse,
  LmsSurveyResults,
} from "../entities/lms.entity";

export interface LmsRepositoryPort {
  // ── Profesor/admin: cursos y unidades ─────────────────────────────────────
  listForTeacher(params?: { search?: string; page?: number; page_size?: number }): Promise<Paginated<LmsCourse>>;
  getCourseForManage(id: string): Promise<LmsCourse>;
  createCourse(body: Partial<LmsCourse>): Promise<LmsCourse>;
  updateCourse(id: string, body: Partial<LmsCourse>): Promise<LmsCourse>;
  archiveCourse(id: string): Promise<LmsCourse>;
  uploadCourseCover(id: string, file: File): Promise<LmsCourse>;
  listUnits(courseId: string): Promise<LmsCourseUnit[]>;
  createUnit(body: { course: string; title: string; order?: number; status?: string; starts_at?: string | null; ends_at?: string | null }): Promise<LmsCourseUnit>;
  updateUnit(id: string, body: Partial<{ title: string; order: number; status: string; starts_at: string | null; ends_at: string | null }>): Promise<LmsCourseUnit>;
  deleteUnit(id: string): Promise<void>;
  generateWeeklyUnits(courseId: string, body: { start_date: string; weeks: number }): Promise<LmsCourseUnit[]>;
  roster(courseId: string): Promise<LmsRosterEntry[]>;

  // ── Profesor/admin: actividades ───────────────────────────────────────────
  listActivities(unitId: string): Promise<LmsActivity[]>;
  getActivityForManage(id: string): Promise<LmsActivity & { unit_id: string; unit?: { id: string; course_id: string } }>;
  createActivity(body: Partial<LmsActivity> & { unit: string }): Promise<LmsActivity>;
  updateActivity(id: string, body: Partial<LmsActivity>): Promise<LmsActivity>;
  deleteActivity(id: string): Promise<void>;
  downloadSebConfig(activityId: string): Promise<{ filename: string; blob: Blob }>;

  // ── Profesor/admin: foro, entregas y quizzes ─────────────────────────────
  listThreadsForManage(activityId: string): Promise<LmsForumThread[]>;
  moderateThread(id: string, patch: { is_pinned?: boolean; is_locked?: boolean }): Promise<LmsForumThread>;
  listSubmissions(activityId: string): Promise<LmsSubmission[]>;
  gradeSubmission(id: string, body: { grade: number; feedback?: string }): Promise<LmsSubmission>;
  listQuestionsForManage(activityId: string): Promise<LmsQuizQuestion[]>;
  upsertQuestion(body: Partial<LmsQuizQuestion> & { activity: string }): Promise<LmsQuizQuestion>;
  deleteQuestion(id: string): Promise<void>;
  importQuizQuestions(activityId: string, body: { format: LmsQuizFileFormat; content: string; mode: LmsQuizImportMode }): Promise<LmsQuizImportResult>;
  exportQuizQuestions(activityId: string, format: LmsQuizFileFormat): Promise<{ filename: string; blob: Blob }>;
  createQuizFromFile(unitId: string, body: { title?: string; format: LmsQuizFileFormat; content: string }): Promise<{ activity: LmsActivity; warnings: string[] }>;

  // ── Profesor/admin: encuestas ─────────────────────────────────────────────
  listSurveyQuestionsForManage(activityId: string): Promise<LmsSurveyQuestion[]>;
  upsertSurveyQuestion(body: Partial<LmsSurveyQuestion> & { activity: string }): Promise<LmsSurveyQuestion>;
  deleteSurveyQuestion(id: string): Promise<void>;
  importSurveyQuestions(activityId: string, markdown: string): Promise<LmsSurveyQuestion[]>;
  getSurveyResults(activityId: string): Promise<LmsSurveyResults>;

  // ── Catálogo público ──────────────────────────────────────────────────────
  catalog(params?: { search?: string; study_course_id?: string; page?: number; page_size?: number }): Promise<Paginated<LmsCourse>>;
  detail(slug: string): Promise<LmsCourse>;

  // ── Alumno ─────────────────────────────────────────────────────────────────
  enroll(courseId: string): Promise<LmsEnrollment>;
  myCourses(): Promise<LmsEnrollment[]>;
  getActivity(id: string): Promise<{ activity: LmsActivity; progress: LmsActivityProgress; course_id: string; course_slug: string }>;
  markActivityComplete(id: string): Promise<LmsActivityProgress>;
  listThreads(activityId: string): Promise<LmsForumThread[]>;
  getThread(id: string): Promise<LmsForumThread>;
  createThread(body: { activity: string; title: string; body: string }): Promise<LmsForumThread>;
  createPost(body: { thread: string; body: string; parent_post?: string }): Promise<LmsForumPost>;
  mySubmission(activityId: string): Promise<LmsSubmission | null>;
  submitAssignment(activityId: string, body: { content_text?: string; file_url?: string }): Promise<LmsSubmission>;
  submitAssignmentFiles(activityId: string, body: { content_text?: string; files: File[] }): Promise<LmsSubmission>;
  listQuestionsForStudent(activityId: string): Promise<LmsQuizQuestion[]>;
  submitQuizAttempt(activityId: string, body: { answers: { question_id: string; selected_option_id?: string; selected_option_ids?: string[]; text_answer?: string }[] }): Promise<LmsQuizAttempt>;
  myQuizAttempts(activityId: string): Promise<LmsQuizAttempt[]>;

  // ── Alumno: encuestas ──────────────────────────────────────────────────────
  listSurveyQuestionsForStudent(activityId: string): Promise<LmsSurveyQuestion[]>;
  mySurveyResponse(activityId: string): Promise<LmsSurveyResponse | null>;
  submitSurveyResponse(activityId: string, body: { answers: { question_id: string; selected_option_ids?: string[]; scale_value?: number; text_answer?: string }[] }): Promise<LmsSurveyResponse>;
}
