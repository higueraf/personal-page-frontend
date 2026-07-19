import { Project } from "../entities/project.entity";
import { Paginated } from "../shared/pagination";

export interface ProjectRepositoryPort {
  // ── Admin ──
  list(params?: {
    search?: string;
    page?: number;
    page_size?: number;
  }): Promise<Paginated<Project>>;
  create(body: Partial<Project>): Promise<Project>;
  update(id: string, body: Partial<Project>): Promise<Project>;
  delete(id: string): Promise<void>;

  // ── Público ──
  listPublic(params?: {
    search?: string;
    page?: number;
    page_size?: number;
  }): Promise<Paginated<Project>>;
  getPublicBySlug(slug: string): Promise<Project>;
  listFeatured(): Promise<Project[]>;
}
