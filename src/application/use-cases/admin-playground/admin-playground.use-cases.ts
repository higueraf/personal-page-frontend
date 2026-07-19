import { AdminPlaygroundRepositoryPort } from "../../../domain/ports/admin-playground-repository.port";
import { AdminPlayground } from "../../../domain/entities/admin-playground.entity";

export class AdminPlaygroundUseCases {
  constructor(private readonly repository: AdminPlaygroundRepositoryPort) {}

  listAll(): Promise<AdminPlayground[]> {
    return this.repository.listAll();
  }
}
