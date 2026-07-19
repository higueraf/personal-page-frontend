import axiosClient from "../http/axios-client";
import { InstitutionRepositoryPort } from "../../domain/ports/institution-repository.port";
import { Institution } from "../../domain/entities/institution.entity";

export class AxiosInstitutionRepositoryAdapter
  implements InstitutionRepositoryPort
{
  async listAdmin(): Promise<Institution[]> {
    const { data } = await axiosClient.get<{ data: Institution[] }>(
      "/admin/institutions"
    );
    return data.data;
  }

  async create(body: {
    name: string;
    description?: string;
  }): Promise<Institution> {
    const { data } = await axiosClient.post<{ data: Institution }>(
      "/admin/institutions",
      body
    );
    return data.data;
  }

  async update(
    id: string,
    body: { name?: string; description?: string }
  ): Promise<Institution> {
    const { data } = await axiosClient.patch<{ data: Institution }>(
      `/admin/institutions/${id}`,
      body
    );
    return data.data;
  }

  async delete(id: string): Promise<void> {
    await axiosClient.delete(`/admin/institutions/${id}`);
  }
}
