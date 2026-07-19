import axiosClient from "../http/axios-client";
import { AdminUserRepositoryPort } from "../../domain/ports/admin-user-repository.port";
import { AdminUser, AdminRole, UserStatus, UserType } from "../../domain/entities/admin-user.entity";
import { Paginated } from "../../domain/shared/pagination";

export class AxiosAdminUserRepositoryAdapter implements AdminUserRepositoryPort {
  async list(params: {
    page?: number;
    page_size?: number;
    status?: string;
    search?: string;
    user_type?: string;
  }): Promise<Paginated<AdminUser>> {
    const { data } = await axiosClient.get<Paginated<AdminUser>>("/admin/users", { params });
    return data;
  }

  async listRoles(): Promise<AdminRole[]> {
    const { data } = await axiosClient.get<{ data: AdminRole[] }>("/admin/users/roles");
    return data.data;
  }

  async update(
    id: string,
    body: {
      status?: UserStatus;
      role_id?: string;
      user_type?: UserType;
      institution_id?: string | null;
      study_course_ids?: string[];
    }
  ): Promise<AdminUser> {
    const { data } = await axiosClient.patch<{ data: AdminUser }>(`/admin/users/${id}`, body);
    return data.data;
  }
}
