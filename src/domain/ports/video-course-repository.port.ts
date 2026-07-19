import {
  VideoCourse,
  VideoSection,
  VideoLesson,
  CourseMeta,
  LessonContent,
} from "../entities/video-course.entity";
import { Paginated } from "../shared/pagination";

export interface VideoCourseRepositoryPort {
  // ── Admin: cursos ──
  listCourses(params?: { search?: string }): Promise<Paginated<VideoCourse>>;
  getCourse(id: string): Promise<VideoCourse>;
  createCourse(body: Partial<VideoCourse>): Promise<VideoCourse>;
  updateCourse(id: string, body: Partial<VideoCourse>): Promise<VideoCourse>;
  deleteCourse(id: string): Promise<void>;

  // ── Admin: secciones ──
  listSections(params?: { course_id?: string }): Promise<Paginated<VideoSection>>;
  createSection(body: Partial<VideoSection>): Promise<VideoSection>;
  updateSection(id: string, body: Partial<VideoSection>): Promise<VideoSection>;
  deleteSection(id: string): Promise<void>;

  // ── Admin: lecciones ──
  listLessons(params?: { section_id?: string }): Promise<Paginated<VideoLesson>>;
  createLesson(body: Partial<VideoLesson>): Promise<VideoLesson>;
  updateLesson(id: string, body: Partial<VideoLesson>): Promise<VideoLesson>;
  deleteLesson(id: string): Promise<void>;

  // ── Público ──
  listPublicCourses(params?: {
    search?: string;
    page?: number;
    page_size?: number;
  }): Promise<Paginated<VideoCourse>>;
  getPublicCourseMeta(slug: string): Promise<CourseMeta>;
  getPublicLesson(courseSlug: string, lessonSlug: string): Promise<LessonContent>;
}
