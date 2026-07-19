import { ProjectRepositoryPort } from "../../../domain/ports/project-repository.port";
import { Project } from "../../../domain/entities/project.entity";
import { Paginated } from "../../../domain/shared/pagination";

export class ProjectUseCases {
  constructor(private readonly repository: ProjectRepositoryPort) {}

  // ── Admin ──
  list(params?: {
    search?: string;
    page?: number;
    page_size?: number;
  }): Promise<Paginated<Project>> {
    return this.repository.list(params);
  }
  create(body: Partial<Project>): Promise<Project> {
    return this.repository.create(body);
  }
  update(id: string, body: Partial<Project>): Promise<Project> {
    return this.repository.update(id, body);
  }
  delete(id: string): Promise<void> {
    return this.repository.delete(id);
  }

  // ── Público ──
  listPublic(params?: {
    search?: string;
    page?: number;
    page_size?: number;
  }): Promise<Paginated<Project>> {
    return this.repository.listPublic(params);
  }
  getPublicBySlug(slug: string): Promise<Project> {
    return this.repository.getPublicBySlug(slug);
  }
  listFeatured(): Promise<Project[]> {
    return this.repository.listFeatured();
  }
}
