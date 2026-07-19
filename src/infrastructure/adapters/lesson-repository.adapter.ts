import axiosClient from "../http/axios-client";
import { LessonRepositoryPort } from "../../domain/ports/lesson-repository.port";
import { Lesson } from "../../domain/entities/lesson.entity";
import { Paginated } from "../../domain/shared/pagination";

export class AxiosLessonRepositoryAdapter implements LessonRepositoryPort {
  async list(sectionId: string): Promise<Lesson[]> {
    const { data } = await axiosClient.get<Paginated<Lesson>>("/lessons", {
      params: { section_id: sectionId },
    });
    return data.data;
  }

  async create(body: Partial<Lesson>): Promise<Lesson> {
    const { data } = await axiosClient.post<{ data: Lesson }>(
      "/lessons",
      body
    );
    return data.data;
  }

  async update(id: string, body: Partial<Lesson>): Promise<Lesson> {
    const { data } = await axiosClient.put<{ data: Lesson }>(
      `/lessons/${id}`,
      body
    );
    return data.data;
  }

  async delete(id: string): Promise<void> {
    await axiosClient.delete(`/lessons/${id}`);
  }

  async reorder(items: { id: string; order: number }[]): Promise<void> {
    await axiosClient.post("/lessons/reorder", { items });
  }
}
