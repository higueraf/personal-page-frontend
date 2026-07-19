import axiosClient from "../http/axios-client";
import { PageRepositoryPort } from "../../domain/ports/page-repository.port";
import { Page } from "../../domain/entities/page.entity";
import { Paginated } from "../../domain/shared/pagination";

export class AxiosPageRepositoryAdapter implements PageRepositoryPort {
  async list(lessonId: string): Promise<Page[]> {
    const { data } = await axiosClient.get<Paginated<Page>>("/lesson-pages", {
      params: { lesson_id: lessonId },
    });
    return data.data;
  }

  async create(body: Partial<Page>): Promise<Page> {
    const { data } = await axiosClient.post<{ data: Page }>(
      "/lesson-pages",
      body
    );
    return data.data;
  }

  async update(id: string, body: Partial<Page>): Promise<Page> {
    const { data } = await axiosClient.put<{ data: Page }>(
      `/lesson-pages/${id}`,
      body
    );
    return data.data;
  }

  async delete(id: string): Promise<void> {
    await axiosClient.delete(`/lesson-pages/${id}`);
  }
}
