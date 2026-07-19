import axiosClient from "../http/axios-client";
import { ProjectRepositoryPort } from "../../domain/ports/project-repository.port";
import { Project } from "../../domain/entities/project.entity";
import { Paginated } from "../../domain/shared/pagination";

export class AxiosProjectRepositoryAdapter implements ProjectRepositoryPort {
  // ── Admin ──
  async list(params?: {
    search?: string;
    page?: number;
    page_size?: number;
  }): Promise<Paginated<Project>> {
    const { data } = await axiosClient.get<Paginated<Project>>("/projects", {
      params,
    });
    return data;
  }

  async create(body: Partial<Project>): Promise<Project> {
    const { data } = await axiosClient.post<{ data: Project }>(
      "/projects",
      body
    );
    return data.data;
  }

  async update(id: string, body: Partial<Project>): Promise<Project> {
    const { data } = await axiosClient.put<{ data: Project }>(
      `/projects/${id}`,
      body
    );
    return data.data;
  }

  async delete(id: string): Promise<void> {
    await axiosClient.delete(`/projects/${id}`);
  }

  // ── Público ──
  async listPublic(params?: {
    search?: string;
    page?: number;
    page_size?: number;
  }): Promise<Paginated<Project>> {
    const { data } = await axiosClient.get<Paginated<Project>>(
      "/public/projects",
      { params }
    );
    return data;
  }

  async getPublicBySlug(slug: string): Promise<Project> {
    const { data } = await axiosClient.get<{ data: Project }>(
      `/public/projects/${slug}`
    );
    return data.data;
  }

  async listFeatured(): Promise<Project[]> {
    const { data } = await axiosClient.get<{ data: Project[] }>(
      "/public/projects/featured"
    );
    return data.data;
  }
}
