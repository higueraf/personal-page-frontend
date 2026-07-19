import { InstitutionRepositoryPort } from "../../../domain/ports/institution-repository.port";
import { Institution } from "../../../domain/entities/institution.entity";

export class InstitutionUseCases {
  constructor(private readonly repository: InstitutionRepositoryPort) {}

  listAdmin(): Promise<Institution[]> {
    return this.repository.listAdmin();
  }

  create(body: { name: string; description?: string }): Promise<Institution> {
    return this.repository.create(body);
  }

  update(
    id: string,
    body: { name?: string; description?: string }
  ): Promise<Institution> {
    return this.repository.update(id, body);
  }

  delete(id: string): Promise<void> {
    return this.repository.delete(id);
  }
}
