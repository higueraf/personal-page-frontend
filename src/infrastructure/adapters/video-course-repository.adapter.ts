import axiosClient from "../http/axios-client";
import { VideoCourseRepositoryPort } from "../../domain/ports/video-course-repository.port";
import {
  VideoCourse,
  VideoSection,
  VideoLesson,
  CourseMeta,
  LessonContent,
} from "../../domain/entities/video-course.entity";
import { Paginated } from "../../domain/shared/pagination";

export class AxiosVideoCourseRepositoryAdapter implements VideoCourseRepositoryPort {
  // ── Admin: cursos ──
  async listCourses(params?: { search?: string }): Promise<Paginated<VideoCourse>> {
    const { data } = await axiosClient.get<Paginated<VideoCourse>>("/video-courses", {
      params,
    });
    return data;
  }

  async getCourse(id: string): Promise<VideoCourse> {
    const { data } = await axiosClient.get<{ data: VideoCourse }>(`/video-courses/${id}`);
    return data.data;
  }

  async createCourse(body: Partial<VideoCourse>): Promise<VideoCourse> {
    const { data } = await axiosClient.post<{ data: VideoCourse }>("/video-courses", body);
    return data.data;
  }

  async updateCourse(id: string, body: Partial<VideoCourse>): Promise<VideoCourse> {
    const { data } = await axiosClient.put<{ data: VideoCourse }>(
      `/video-courses/${id}`,
      body
    );
    return data.data;
  }

  async deleteCourse(id: string): Promise<void> {
    await axiosClient.delete(`/video-courses/${id}`);
  }

  // ── Admin: secciones ──
  async listSections(params?: { course_id?: string }): Promise<Paginated<VideoSection>> {
    const { data } = await axiosClient.get<Paginated<VideoSection>>("/video-sections", {
      params,
    });
    return data;
  }

  async createSection(body: Partial<VideoSection>): Promise<VideoSection> {
    const { data } = await axiosClient.post<{ data: VideoSection }>(
      "/video-sections",
      body
    );
    return data.data;
  }

  async updateSection(id: string, body: Partial<VideoSection>): Promise<VideoSection> {
    const { data } = await axiosClient.put<{ data: VideoSection }>(
      `/video-sections/${id}`,
      body
    );
    return data.data;
  }

  async deleteSection(id: string): Promise<void> {
    await axiosClient.delete(`/video-sections/${id}`);
  }

  // ── Admin: lecciones ──
  async listLessons(params?: { section_id?: string }): Promise<Paginated<VideoLesson>> {
    const { data } = await axiosClient.get<Paginated<VideoLesson>>("/video-lessons", {
      params,
    });
    return data;
  }

  async createLesson(body: Partial<VideoLesson>): Promise<VideoLesson> {
    const { data } = await axiosClient.post<{ data: VideoLesson }>(
      "/video-lessons",
      body
    );
    return data.data;
  }

  async updateLesson(id: string, body: Partial<VideoLesson>): Promise<VideoLesson> {
    const { data } = await axiosClient.put<{ data: VideoLesson }>(
      `/video-lessons/${id}`,
      body
    );
    return data.data;
  }

  async deleteLesson(id: string): Promise<void> {
    await axiosClient.delete(`/video-lessons/${id}`);
  }

  // ── Público ──
  async listPublicCourses(params?: {
    search?: string;
    page?: number;
    page_size?: number;
  }): Promise<Paginated<VideoCourse>> {
    const { data } = await axiosClient.get<Paginated<VideoCourse>>(
      "/public/video-courses",
      { params }
    );
    return data;
  }

  async getPublicCourseMeta(slug: string): Promise<CourseMeta> {
    const { data } = await axiosClient.get<CourseMeta>(`/public/video-courses/${slug}`);
    return data;
  }

  async getPublicLesson(courseSlug: string, lessonSlug: string): Promise<LessonContent> {
    const { data } = await axiosClient.get<LessonContent>(
      `/public/video-courses/${courseSlug}/lessons/${lessonSlug}`
    );
    return data;
  }
}
