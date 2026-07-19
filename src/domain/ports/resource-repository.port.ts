import { Resource } from "../entities/resource.entity";
import { Paginated } from "../shared/pagination";

export interface ResourceRepositoryPort {
  // ── Admin ──
  list(params?: { search?: string; page?: number }): Promise<Paginated<Resource>>;
  create(body: Partial<Resource>): Promise<Resource>;
  update(id: string, body: Partial<Resource>): Promise<Resource>;
  delete(id: string): Promise<void>;

  // ── Público ──
  listPublic(params?: {
    search?: string;
    page?: number;
    page_size?: number;
  }): Promise<Paginated<Resource>>;
}
