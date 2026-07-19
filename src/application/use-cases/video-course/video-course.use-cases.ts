import { VideoCourseRepositoryPort } from "../../../domain/ports/video-course-repository.port";
import {
  VideoCourse,
  VideoSection,
  VideoLesson,
  CourseMeta,
  LessonContent,
} from "../../../domain/entities/video-course.entity";
import { Paginated } from "../../../domain/shared/pagination";

export class VideoCourseUseCases {
  constructor(private readonly repository: VideoCourseRepositoryPort) {}

  // ── Admin: cursos ──
  listCourses(params?: { search?: string }): Promise<Paginated<VideoCourse>> {
    return this.repository.listCourses(params);
  }

  getCourse(id: string): Promise<VideoCourse> {
    return this.repository.getCourse(id);
  }

  createCourse(body: Partial<VideoCourse>): Promise<VideoCourse> {
    return this.repository.createCourse(body);
  }

  updateCourse(id: string, body: Partial<VideoCourse>): Promise<VideoCourse> {
    return this.repository.updateCourse(id, body);
  }

  deleteCourse(id: string): Promise<void> {
    return this.repository.deleteCourse(id);
  }

  // ── Admin: secciones ──
  listSections(params?: { course_id?: string }): Promise<Paginated<VideoSection>> {
    return this.repository.listSections(params);
  }

  createSection(body: Partial<VideoSection>): Promise<VideoSection> {
    return this.repository.createSection(body);
  }

  updateSection(id: string, body: Partial<VideoSection>): Promise<VideoSection> {
    return this.repository.updateSection(id, body);
  }

  deleteSection(id: string): Promise<void> {
    return this.repository.deleteSection(id);
  }

  // ── Admin: lecciones ──
  listLessons(params?: { section_id?: string }): Promise<Paginated<VideoLesson>> {
    return this.repository.listLessons(params);
  }

  createLesson(body: Partial<VideoLesson>): Promise<VideoLesson> {
    return this.repository.createLesson(body);
  }

  updateLesson(id: string, body: Partial<VideoLesson>): Promise<VideoLesson> {
    return this.repository.updateLesson(id, body);
  }

  deleteLesson(id: string): Promise<void> {
    return this.repository.deleteLesson(id);
  }

  // ── Público ──
  listPublicCourses(params?: {
    search?: string;
    page?: number;
    page_size?: number;
  }): Promise<Paginated<VideoCourse>> {
    return this.repository.listPublicCourses(params);
  }

  getPublicCourseMeta(slug: string): Promise<CourseMeta> {
    return this.repository.getPublicCourseMeta(slug);
  }

  getPublicLesson(courseSlug: string, lessonSlug: string): Promise<LessonContent> {
    return this.repository.getPublicLesson(courseSlug, lessonSlug);
  }
}
