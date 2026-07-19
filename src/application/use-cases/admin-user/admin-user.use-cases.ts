import { AdminUserRepositoryPort } from "../../../domain/ports/admin-user-repository.port";
import { AdminUser, AdminRole, UserStatus, UserType } from "../../../domain/entities/admin-user.entity";
import { Paginated } from "../../../domain/shared/pagination";

export class AdminUserUseCases {
  constructor(private readonly repository: AdminUserRepositoryPort) {}

  list(params: {
    page?: number;
    page_size?: number;
    status?: string;
    search?: string;
    user_type?: string;
  }): Promise<Paginated<AdminUser>> {
    return this.repository.list(params);
  }

  listRoles(): Promise<AdminRole[]> {
    return this.repository.listRoles();
  }

  update(
    id: string,
    body: {
      status?: UserStatus;
      role_id?: string;
      user_type?: UserType;
      institution_id?: string | null;
      study_course_ids?: string[];
    }
  ): Promise<AdminUser> {
    return this.repository.update(id, body);
  }
}
