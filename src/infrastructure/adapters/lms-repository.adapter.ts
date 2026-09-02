import axiosClient from "../http/axios-client";
import { LmsRepositoryPort } from "../../domain/ports/lms-repository.port";
import { Paginated } from "../../domain/shared/pagination";
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
} from "../../domain/entities/lms.entity";

export class AxiosLmsRepositoryAdapter implements LmsRepositoryPort {
  // ── Profesor/admin: cursos y unidades ─────────────────────────────────────
  async listForTeacher(params?: { search?: string; page?: number; page_size?: number }): Promise<Paginated<LmsCourse>> {
    const { data } = await axiosClient.get<Paginated<LmsCourse>>("/lms/courses", { params });
    return data;
  }
  async getCourseForManage(id: string): Promise<LmsCourse> {
    const { data } = await axiosClient.get<LmsCourse>(`/lms/courses/${id}`);
    return data;
  }
  async createCourse(body: Partial<LmsCourse>): Promise<LmsCourse> {
    const { data } = await axiosClient.post<LmsCourse>("/lms/courses", body);
    return data;
  }
  async updateCourse(id: string, body: Partial<LmsCourse>): Promise<LmsCourse> {
    const { data } = await axiosClient.put<LmsCourse>(`/lms/courses/${id}`, body);
    return data;
  }
  async archiveCourse(id: string): Promise<LmsCourse> {
    const { data } = await axiosClient.put<LmsCourse>(`/lms/courses/${id}/archive`, {});
    return data;
  }
  async uploadCourseCover(id: string, file: File): Promise<LmsCourse> {
    const formData = new FormData();
    formData.append("cover", file);
    const { data } = await axiosClient.post<LmsCourse>(`/lms/courses/${id}/cover`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  }
  async listUnits(courseId: string): Promise<LmsCourseUnit[]> {
    const { data } = await axiosClient.get<LmsCourseUnit[]>(`/lms/courses/${courseId}/units`);
    return data;
  }
  async createUnit(body: { course: string; title: string; order?: number; status?: string; starts_at?: string | null; ends_at?: string | null }): Promise<LmsCourseUnit> {
    const { data } = await axiosClient.post<LmsCourseUnit>("/lms/units", body);
    return data;
  }
  async updateUnit(id: string, body: Partial<{ title: string; order: number; status: string; starts_at: string | null; ends_at: string | null }>): Promise<LmsCourseUnit> {
    const { data } = await axiosClient.put<LmsCourseUnit>(`/lms/units/${id}`, body);
    return data;
  }
  async deleteUnit(id: string): Promise<void> {
    await axiosClient.delete(`/lms/units/${id}`);
  }
  async generateWeeklyUnits(courseId: string, body: { start_date: string; weeks: number }): Promise<LmsCourseUnit[]> {
    const { data } = await axiosClient.post<LmsCourseUnit[]>(`/lms/courses/${courseId}/units/generate-weeks`, body);
    return data;
  }
  async roster(courseId: string): Promise<LmsRosterEntry[]> {
    const { data } = await axiosClient.get<LmsRosterEntry[]>(`/lms/courses/${courseId}/roster`);
    return data;
  }

  // ── Profesor/admin: actividades ───────────────────────────────────────────
  async listActivities(unitId: string): Promise<LmsActivity[]> {
    const { data } = await axiosClient.get<LmsActivity[]>(`/lms/units/${unitId}/activities`);
    return data;
  }
  async getActivityForManage(id: string): Promise<LmsActivity & { unit_id: string; unit?: { id: string; course_id: string } }> {
    const { data } = await axiosClient.get(`/lms/activities/${id}`);
    return data;
  }
  async createActivity(body: Partial<LmsActivity> & { unit: string }): Promise<LmsActivity> {
    const { data } = await axiosClient.post<LmsActivity>("/lms/activities", body);
    return data;
  }
  async updateActivity(id: string, body: Partial<LmsActivity>): Promise<LmsActivity> {
    const { data } = await axiosClient.put<LmsActivity>(`/lms/activities/${id}`, body);
    return data;
  }
  async deleteActivity(id: string): Promise<void> {
    await axiosClient.delete(`/lms/activities/${id}`);
  }
  async downloadSebConfig(activityId: string): Promise<{ filename: string; blob: Blob }> {
    const response = await axiosClient.get(`/lms/activities/${activityId}/seb-config`, {
      responseType: "blob",
    });
    const disposition = response.headers["content-disposition"] as string | undefined;
    const match = disposition?.match(/filename="?([^"]+)"?/);
    return { filename: match?.[1] ?? "examen.seb", blob: response.data };
  }

  // ── Profesor/admin: foro, entregas y quizzes ─────────────────────────────
  async listThreadsForManage(activityId: string): Promise<LmsForumThread[]> {
    const { data } = await axiosClient.get<LmsForumThread[]>(`/lms/activities/${activityId}/forum-threads`);
    return data;
  }
  async moderateThread(id: string, patch: { is_pinned?: boolean; is_locked?: boolean }): Promise<LmsForumThread> {
    const { data } = await axiosClient.put<LmsForumThread>(`/lms/forum-threads/${id}/moderate`, patch);
    return data;
  }
  async listSubmissions(activityId: string): Promise<LmsSubmission[]> {
    const { data } = await axiosClient.get<LmsSubmission[]>(`/lms/activities/${activityId}/submissions`);
    return data;
  }
  async gradeSubmission(id: string, body: { grade: number; feedback?: string }): Promise<LmsSubmission> {
    const { data } = await axiosClient.put<LmsSubmission>(`/lms/submissions/${id}/grade`, body);
    return data;
  }
  async listQuestionsForManage(activityId: string): Promise<LmsQuizQuestion[]> {
    const { data } = await axiosClient.get<LmsQuizQuestion[]>(`/lms/activities/${activityId}/quiz-questions`);
    return data;
  }
  async upsertQuestion(body: Partial<LmsQuizQuestion> & { activity: string }): Promise<LmsQuizQuestion> {
    const { data } = await axiosClient.post<LmsQuizQuestion>("/lms/quiz-questions", body);
    return data;
  }
  async deleteQuestion(id: string): Promise<void> {
    await axiosClient.delete(`/lms/quiz-questions/${id}`);
  }
  async importQuizQuestions(
    activityId: string,
    body: { format: LmsQuizFileFormat; content: string; mode: LmsQuizImportMode },
  ): Promise<LmsQuizImportResult> {
    const { data } = await axiosClient.post<LmsQuizImportResult>(`/lms/activities/${activityId}/quiz-questions/import`, body);
    return data;
  }
  async exportQuizQuestions(activityId: string, format: LmsQuizFileFormat): Promise<{ filename: string; blob: Blob }> {
    const response = await axiosClient.get(`/lms/activities/${activityId}/quiz-questions/export`, {
      params: { format },
      responseType: "blob",
    });
    const disposition = response.headers["content-disposition"] as string | undefined;
    const match = disposition?.match(/filename="?([^"]+)"?/);
    return { filename: match?.[1] ?? `quiz.${format}`, blob: response.data };
  }
  async createQuizFromFile(
    unitId: string,
    body: { title?: string; format: LmsQuizFileFormat; content: string },
  ): Promise<{ activity: LmsActivity; warnings: string[] }> {
    const { data } = await axiosClient.post(`/lms/units/${unitId}/quiz-import`, body);
    return data;
  }

  // ── Profesor/admin: encuestas ─────────────────────────────────────────────
  async listSurveyQuestionsForManage(activityId: string): Promise<LmsSurveyQuestion[]> {
    const { data } = await axiosClient.get<LmsSurveyQuestion[]>(`/lms/activities/${activityId}/survey-questions`);
    return data;
  }
  async upsertSurveyQuestion(body: Partial<LmsSurveyQuestion> & { activity: string }): Promise<LmsSurveyQuestion> {
    const { data } = await axiosClient.post<LmsSurveyQuestion>("/lms/survey-questions", body);
    return data;
  }
  async deleteSurveyQuestion(id: string): Promise<void> {
    await axiosClient.delete(`/lms/survey-questions/${id}`);
  }
  async importSurveyQuestions(activityId: string, markdown: string): Promise<LmsSurveyQuestion[]> {
    const { data } = await axiosClient.post<LmsSurveyQuestion[]>(`/lms/activities/${activityId}/survey-questions/import`, { markdown });
    return data;
  }
  async getSurveyResults(activityId: string): Promise<LmsSurveyResults> {
    const { data } = await axiosClient.get<LmsSurveyResults>(`/lms/activities/${activityId}/survey-results`);
    return data;
  }

  // ── Catálogo público ──────────────────────────────────────────────────────
  async catalog(params?: { search?: string; study_course_id?: string; page?: number; page_size?: number }): Promise<Paginated<LmsCourse>> {
    const { data } = await axiosClient.get<Paginated<LmsCourse>>("/public/lms/courses", { params });
    return data;
  }
  async detail(slug: string): Promise<LmsCourse> {
    const { data } = await axiosClient.get<LmsCourse>(`/public/lms/courses/${slug}`);
    return data;
  }

  // ── Alumno ─────────────────────────────────────────────────────────────────
  async enroll(courseId: string): Promise<LmsEnrollment> {
    const { data } = await axiosClient.post<LmsEnrollment>(`/public/lms/courses/${courseId}/enroll`, {});
    return data;
  }
  async myCourses(): Promise<LmsEnrollment[]> {
    const { data } = await axiosClient.get<LmsEnrollment[]>("/public/lms/my-courses");
    return data;
  }
  async getActivity(id: string): Promise<{ activity: LmsActivity; progress: LmsActivityProgress; course_id: string; course_slug: string }> {
    const { data } = await axiosClient.get(`/public/lms/activities/${id}`);
    return data;
  }
  async markActivityComplete(id: string): Promise<LmsActivityProgress> {
    const { data } = await axiosClient.post<LmsActivityProgress>(`/public/lms/activities/${id}/complete`, {});
    return data;
  }
  async listThreads(activityId: string): Promise<LmsForumThread[]> {
    const { data } = await axiosClient.get<LmsForumThread[]>(`/public/lms/activities/${activityId}/forum-threads`);
    return data;
  }
  async getThread(id: string): Promise<LmsForumThread> {
    const { data } = await axiosClient.get<LmsForumThread>(`/public/lms/forum-threads/${id}`);
    return data;
  }
  async createThread(body: { activity: string; title: string; body: string }): Promise<LmsForumThread> {
    const { data } = await axiosClient.post<LmsForumThread>("/public/lms/forum-threads", body);
    return data;
  }
  async createPost(body: { thread: string; body: string; parent_post?: string }): Promise<LmsForumPost> {
    const { data } = await axiosClient.post<LmsForumPost>("/public/lms/forum-posts", body);
    return data;
  }
  async mySubmission(activityId: string): Promise<LmsSubmission | null> {
    const { data } = await axiosClient.get<LmsSubmission | null>(`/public/lms/activities/${activityId}/submission`);
    return data;
  }
  async submitAssignment(activityId: string, body: { content_text?: string; file_url?: string }): Promise<LmsSubmission> {
    const { data } = await axiosClient.post<LmsSubmission>(`/public/lms/activities/${activityId}/submit`, body);
    return data;
  }
  async submitAssignmentFiles(activityId: string, body: { content_text?: string; files: File[] }): Promise<LmsSubmission> {
    const formData = new FormData();
    if (body.content_text) formData.append("content_text", body.content_text);
    body.files.forEach((file) => formData.append("files", file));
    const { data } = await axiosClient.post<LmsSubmission>(
      `/public/lms/activities/${activityId}/submit-files`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data;
  }
  async listQuestionsForStudent(activityId: string): Promise<LmsQuizQuestion[]> {
    const { data } = await axiosClient.get<LmsQuizQuestion[]>(`/public/lms/activities/${activityId}/quiz-questions`);
    return data;
  }
  async submitQuizAttempt(
    activityId: string,
    body: { answers: { question_id: string; selected_option_id?: string; selected_option_ids?: string[]; text_answer?: string }[] },
  ): Promise<LmsQuizAttempt> {
    const { data } = await axiosClient.post<LmsQuizAttempt>(`/public/lms/activities/${activityId}/quiz-attempts`, body);
    return data;
  }
  async myQuizAttempts(activityId: string): Promise<LmsQuizAttempt[]> {
    const { data } = await axiosClient.get<LmsQuizAttempt[]>(`/public/lms/activities/${activityId}/quiz-attempts`);
    return data;
  }

  // ── Alumno: encuestas ──────────────────────────────────────────────────────
  async listSurveyQuestionsForStudent(activityId: string): Promise<LmsSurveyQuestion[]> {
    const { data } = await axiosClient.get<LmsSurveyQuestion[]>(`/public/lms/activities/${activityId}/survey-questions`);
    return data;
  }
  async mySurveyResponse(activityId: string): Promise<LmsSurveyResponse | null> {
    const { data } = await axiosClient.get<LmsSurveyResponse | null>(`/public/lms/activities/${activityId}/survey-responses/me`);
    return data;
  }
  async submitSurveyResponse(
    activityId: string,
    body: { answers: { question_id: string; selected_option_ids?: string[]; scale_value?: number; text_answer?: string }[] },
  ): Promise<LmsSurveyResponse> {
    const { data } = await axiosClient.post<LmsSurveyResponse>(`/public/lms/activities/${activityId}/survey-responses`, body);
    return data;
  }
}
