import axiosClient from "../http/axios-client";
import { StudyCourseRepositoryPort } from "../../domain/ports/study-course-repository.port";
import { StudyCourse } from "../../domain/entities/study-course.entity";

export class AxiosStudyCourseRepositoryAdapter
  implements StudyCourseRepositoryPort
{
  async listPublic(): Promise<StudyCourse[]> {
    const { data } = await axiosClient.get<{ data: StudyCourse[] }>(
      "/public/study-courses"
    );
    return data.data;
  }

  async listAdmin(institution_id?: string): Promise<StudyCourse[]> {
    const params: Record<string, string> = {};
    if (institution_id) params.institution_id = institution_id;
    const { data } = await axiosClient.get<{ data: StudyCourse[] }>(
      "/admin/study-courses",
      { params }
    );
    return data.data;
  }

  async create(body: {
    name: string;
    description?: string;
    institution_id?: string;
  }): Promise<StudyCourse> {
    const { data } = await axiosClient.post<{ data: StudyCourse }>(
      "/admin/study-courses",
      body
    );
    return data.data;
  }

  async update(
    id: string,
    body: { name?: string; description?: string; institution_id?: string | null }
  ): Promise<StudyCourse> {
    const { data } = await axiosClient.patch<{ data: StudyCourse }>(
      `/admin/study-courses/${id}`,
      body
    );
    return data.data;
  }

  async delete(id: string): Promise<void> {
    await axiosClient.delete(`/admin/study-courses/${id}`);
  }
}
