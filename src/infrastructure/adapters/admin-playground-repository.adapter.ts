import axiosClient from "../http/axios-client";
import { AdminPlaygroundRepositoryPort } from "../../domain/ports/admin-playground-repository.port";
import { AdminPlayground } from "../../domain/entities/admin-playground.entity";

export class AxiosAdminPlaygroundRepositoryAdapter implements AdminPlaygroundRepositoryPort {
  async listAll(): Promise<AdminPlayground[]> {
    const { data } = await axiosClient.get<{ data: AdminPlayground[] }>("/playground/admin/playgrounds");
    return data.data;
  }
}
