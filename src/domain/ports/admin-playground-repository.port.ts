import { AdminPlayground } from "../entities/admin-playground.entity";

export interface AdminPlaygroundRepositoryPort {
  listAll(): Promise<AdminPlayground[]>;
}
