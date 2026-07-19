import { Tutorial } from "../entities/tutorial.entity";
import { Paginated } from "../shared/pagination";

export interface PublicTutorialPage {
  id: string;
  title: string;
  slug: string;
  order: number;
}

export interface PublicPageContent {
  lesson: { title: string; slug: string; order: number };
  markdown: string;
  nav: { prev: string | null; next: string | null };
}

export interface TutorialRepositoryPort {
  // ── Admin ──
  list(params?: {
    search?: string;
    page?: number;
    page_size?: number;
  }): Promise<Paginated<Tutorial>>;
  get(id: string): Promise<Tutorial>;
  create(body: Partial<Tutorial>): Promise<Tutorial>;
  update(id: string, body: Partial<Tutorial>): Promise<Tutorial>;
  delete(id: string): Promise<void>;

  // ── Público ──
  listPublic(params?: {
    search?: string;
    page?: number;
    page_size?: number;
  }): Promise<Paginated<Tutorial>>;
  getPublicBySlug(slug: string): Promise<Tutorial>;
  getPublicPages(slug: string): Promise<PublicTutorialPage[]>;
  getPublicPageContent(
    courseSlug: string,
    lessonSlug: string
  ): Promise<PublicPageContent>;
}
