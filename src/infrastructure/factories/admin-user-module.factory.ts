import { AxiosAdminUserRepositoryAdapter } from "../adapters/admin-user-repository.adapter";
import { AdminUserUseCases } from "../../application/use-cases/admin-user/admin-user.use-cases";

export const adminUserUseCases = new AdminUserUseCases(
  new AxiosAdminUserRepositoryAdapter()
);
