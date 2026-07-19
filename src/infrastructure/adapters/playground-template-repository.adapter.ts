import axiosClient from "../http/axios-client";
import { PlaygroundTemplateRepositoryPort } from "../../domain/ports/playground-template-repository.port";
import { PlaygroundTemplate, SavePlaygroundTemplatePayload } from "../../domain/entities/playground-template.entity";

export class AxiosPlaygroundTemplateRepositoryAdapter implements PlaygroundTemplateRepositoryPort {
  async list(language?: string): Promise<PlaygroundTemplate[]> {
    const { data } = await axiosClient.get<{ data: PlaygroundTemplate[] }>("/playground/admin/templates", {
      params: language ? { language } : undefined,
    });
    return data.data;
  }

  async get(id: string): Promise<PlaygroundTemplate> {
    const { data } = await axiosClient.get<PlaygroundTemplate>(`/playground/admin/templates/${id}`);
    return data;
  }

  async create(payload: SavePlaygroundTemplatePayload): Promise<PlaygroundTemplate> {
    const { data } = await axiosClient.post<PlaygroundTemplate>("/playground/admin/templates", payload);
    return data;
  }

  async update(id: string, payload: Partial<SavePlaygroundTemplatePayload>): Promise<PlaygroundTemplate> {
    const { data } = await axiosClient.patch<PlaygroundTemplate>(`/playground/admin/templates/${id}`, payload);
    return data;
  }

  async remove(id: string): Promise<void> {
    await axiosClient.delete(`/playground/admin/templates/${id}`);
  }
}
