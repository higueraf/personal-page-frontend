import { Institution } from "../entities/institution.entity";

export interface InstitutionRepositoryPort {
  listAdmin(): Promise<Institution[]>;
  create(body: { name: string; description?: string }): Promise<Institution>;
  update(
    id: string,
    body: { name?: string; description?: string }
  ): Promise<Institution>;
  delete(id: string): Promise<void>;
}
