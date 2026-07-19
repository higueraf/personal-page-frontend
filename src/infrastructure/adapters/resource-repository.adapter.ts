import axiosClient from "../http/axios-client";
import { ResourceRepositoryPort } from "../../domain/ports/resource-repository.port";
import { Resource } from "../../domain/entities/resource.entity";
import { Paginated } from "../../domain/shared/pagination";

export class AxiosResourceRepositoryAdapter implements ResourceRepositoryPort {
  // ── Admin ──
  async list(params?: { search?: string; page?: number }): Promise<Paginated<Resource>> {
    const { data } = await axiosClient.get<Paginated<Resource>>("/resources", {
      params,
    });
    return data;
  }

  async create(body: Partial<Resource>): Promise<Resource> {
    const { data } = await axiosClient.post<{ data: Resource }>(
      "/resources",
      body
    );
    return data.data;
  }

  async update(id: string, body: Partial<Resource>): Promise<Resource> {
    const { data } = await axiosClient.put<{ data: Resource }>(
      `/resources/${id}`,
      body
    );
    return data.data;
  }

  async delete(id: string): Promise<void> {
    await axiosClient.delete(`/resources/${id}`);
  }

  // ── Público ──
  async listPublic(params?: {
    search?: string;
    page?: number;
    page_size?: number;
  }): Promise<Paginated<Resource>> {
    const { data } = await axiosClient.get<Paginated<Resource>>(
      "/public/resources",
      { params }
    );
    return data;
  }
}
