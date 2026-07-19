import axiosClient from "../http/axios-client";
import { ProfileItemRepositoryPort } from "../../domain/ports/profile-item-repository.port";
import { ProfileItem } from "../../domain/entities/profile-item.entity";

export class AxiosProfileItemRepositoryAdapter implements ProfileItemRepositoryPort {
  // ── Admin ──
  async list(params?: { type?: string }): Promise<ProfileItem[]> {
    const { data } = await axiosClient.get<{ data: ProfileItem[] }>("/profile", {
      params,
    });
    return data.data;
  }

  async create(body: Partial<ProfileItem>): Promise<ProfileItem> {
    const { data } = await axiosClient.post<{ data: ProfileItem }>(
      "/profile",
      body
    );
    return data.data;
  }

  async update(id: string, body: Partial<ProfileItem>): Promise<ProfileItem> {
    const { data } = await axiosClient.put<{ data: ProfileItem }>(
      `/profile/${id}`,
      body
    );
    return data.data;
  }

  async delete(id: string): Promise<void> {
    await axiosClient.delete(`/profile/${id}`);
  }

  // ── Público ──
  async listPublic(params?: { type?: string }): Promise<ProfileItem[]> {
    const { data } = await axiosClient.get<{ data: ProfileItem[] }>(
      "/public/profile",
      { params }
    );
    return data.data;
  }
}
