import { ResourceRepositoryPort } from "../../../domain/ports/resource-repository.port";
import { Resource } from "../../../domain/entities/resource.entity";
import { Paginated } from "../../../domain/shared/pagination";

export class ResourceUseCases {
  constructor(private readonly repository: ResourceRepositoryPort) {}

  list(params?: { search?: string; page?: number }): Promise<Paginated<Resource>> {
    return this.repository.list(params);
  }

  create(body: Partial<Resource>): Promise<Resource> {
    return this.repository.create(body);
  }

  update(id: string, body: Partial<Resource>): Promise<Resource> {
    return this.repository.update(id, body);
  }

  delete(id: string): Promise<void> {
    return this.repository.delete(id);
  }

  listPublic(params?: {
    search?: string;
    page?: number;
    page_size?: number;
  }): Promise<Paginated<Resource>> {
    return this.repository.listPublic(params);
  }
}
