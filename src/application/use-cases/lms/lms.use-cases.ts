import { LmsRepositoryPort } from "../../../domain/ports/lms-repository.port";

/** Passthrough sobre el puerto, igual que el resto de *.use-cases.ts del proyecto. */
export class LmsUseCases implements LmsRepositoryPort {
  constructor(private readonly repository: LmsRepositoryPort) {}

  listForTeacher(params?: any) { return this.repository.listForTeacher(params); }
  getCourseForManage(id: string) { return this.repository.getCourseForManage(id); }
  createCourse(body: any) { return this.repository.createCourse(body); }
  updateCourse(id: string, body: any) { return this.repository.updateCourse(id, body); }
  archiveCourse(id: string) { return this.repository.archiveCourse(id); }
  uploadCourseCover(id: string, file: File) { return this.repository.uploadCourseCover(id, file); }
  listUnits(courseId: string) { return this.repository.listUnits(courseId); }
  createUnit(body: any) { return this.repository.createUnit(body); }
  updateUnit(id: string, body: any) { return this.repository.updateUnit(id, body); }
  deleteUnit(id: string) { return this.repository.deleteUnit(id); }
  generateWeeklyUnits(courseId: string, body: any) { return this.repository.generateWeeklyUnits(courseId, body); }
  roster(courseId: string) { return this.repository.roster(courseId); }

  listActivities(unitId: string) { return this.repository.listActivities(unitId); }
  getActivityForManage(id: string) { return this.repository.getActivityForManage(id); }
  createActivity(body: any) { return this.repository.createActivity(body); }
  updateActivity(id: string, body: any) { return this.repository.updateActivity(id, body); }
  deleteActivity(id: string) { return this.repository.deleteActivity(id); }
  downloadSebConfig(activityId: string) { return this.repository.downloadSebConfig(activityId); }

  listThreadsForManage(activityId: string) { return this.repository.listThreadsForManage(activityId); }
  moderateThread(id: string, patch: any) { return this.repository.moderateThread(id, patch); }
  listSubmissions(activityId: string) { return this.repository.listSubmissions(activityId); }
  gradeSubmission(id: string, body: any) { return this.repository.gradeSubmission(id, body); }
  listQuestionsForManage(activityId: string) { return this.repository.listQuestionsForManage(activityId); }
  upsertQuestion(body: any) { return this.repository.upsertQuestion(body); }
  deleteQuestion(id: string) { return this.repository.deleteQuestion(id); }
  importQuizQuestions(activityId: string, body: any) { return this.repository.importQuizQuestions(activityId, body); }
  exportQuizQuestions(activityId: string, format: any) { return this.repository.exportQuizQuestions(activityId, format); }
  createQuizFromFile(unitId: string, body: any) { return this.repository.createQuizFromFile(unitId, body); }

  listSurveyQuestionsForManage(activityId: string) { return this.repository.listSurveyQuestionsForManage(activityId); }
  upsertSurveyQuestion(body: any) { return this.repository.upsertSurveyQuestion(body); }
  deleteSurveyQuestion(id: string) { return this.repository.deleteSurveyQuestion(id); }
  importSurveyQuestions(activityId: string, markdown: string) { return this.repository.importSurveyQuestions(activityId, markdown); }
  getSurveyResults(activityId: string) { return this.repository.getSurveyResults(activityId); }

  catalog(params?: any) { return this.repository.catalog(params); }
  detail(slug: string) { return this.repository.detail(slug); }

  enroll(courseId: string) { return this.repository.enroll(courseId); }
  myCourses() { return this.repository.myCourses(); }
  myProgressForCourse(courseId: string) { return this.repository.myProgressForCourse(courseId); }
  getActivity(id: string) { return this.repository.getActivity(id); }
  markActivityComplete(id: string) { return this.repository.markActivityComplete(id); }
  listThreads(activityId: string) { return this.repository.listThreads(activityId); }
  getThread(id: string) { return this.repository.getThread(id); }
  createThread(body: any) { return this.repository.createThread(body); }
  createPost(body: any) { return this.repository.createPost(body); }
  mySubmission(activityId: string) { return this.repository.mySubmission(activityId); }
  submitAssignment(activityId: string, body: any) { return this.repository.submitAssignment(activityId, body); }
  submitAssignmentFiles(activityId: string, body: any) { return this.repository.submitAssignmentFiles(activityId, body); }
  listQuestionsForStudent(activityId: string) { return this.repository.listQuestionsForStudent(activityId); }
  startQuizAttempt(activityId: string) { return this.repository.startQuizAttempt(activityId); }
  submitQuizAttempt(activityId: string, body: any) { return this.repository.submitQuizAttempt(activityId, body); }
  myQuizAttempts(activityId: string) { return this.repository.myQuizAttempts(activityId); }

  listSurveyQuestionsForStudent(activityId: string) { return this.repository.listSurveyQuestionsForStudent(activityId); }
  mySurveyResponse(activityId: string) { return this.repository.mySurveyResponse(activityId); }
  submitSurveyResponse(activityId: string, body: any) { return this.repository.submitSurveyResponse(activityId, body); }
}
