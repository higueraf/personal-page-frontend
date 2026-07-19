import { AxiosAdminPlaygroundRepositoryAdapter } from "../adapters/admin-playground-repository.adapter";
import { AdminPlaygroundUseCases } from "../../application/use-cases/admin-playground/admin-playground.use-cases";

export const adminPlaygroundUseCases = new AdminPlaygroundUseCases(
  new AxiosAdminPlaygroundRepositoryAdapter()
);
