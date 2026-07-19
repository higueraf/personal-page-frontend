import { Paginated } from "../shared/pagination";
import { AdminUser, AdminRole, UserStatus, UserType } from "../entities/admin-user.entity";

export interface AdminUserRepositoryPort {
  list(params: {
    page?: number;
    page_size?: number;
    status?: string;
    search?: string;
    user_type?: string;
  }): Promise<Paginated<AdminUser>>;

  listRoles(): Promise<AdminRole[]>;

  update(
    id: string,
    body: {
      status?: UserStatus;
      role_id?: string;
      user_type?: UserType;
      institution_id?: string | null;
      study_course_ids?: string[];
    }
  ): Promise<AdminUser>;
}
