import {
  TutorialRepositoryPort,
  PublicTutorialPage,
  PublicPageContent,
} from "../../../domain/ports/tutorial-repository.port";
import { Tutorial } from "../../../domain/entities/tutorial.entity";
import { Paginated } from "../../../domain/shared/pagination";

export class TutorialUseCases {
  constructor(private readonly repository: TutorialRepositoryPort) {}

  // ── Admin ──
  list(params?: {
    search?: string;
    page?: number;
    page_size?: number;
  }): Promise<Paginated<Tutorial>> {
    return this.repository.list(params);
  }
  get(id: string): Promise<Tutorial> {
    return this.repository.get(id);
  }
  create(body: Partial<Tutorial>): Promise<Tutorial> {
    return this.repository.create(body);
  }
  update(id: string, body: Partial<Tutorial>): Promise<Tutorial> {
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
  }): Promise<Paginated<Tutorial>> {
    return this.repository.listPublic(params);
  }
  getPublicBySlug(slug: string): Promise<Tutorial> {
    return this.repository.getPublicBySlug(slug);
  }
  getPublicPages(slug: string): Promise<PublicTutorialPage[]> {
    return this.repository.getPublicPages(slug);
  }
  getPublicPageContent(
    courseSlug: string,
    lessonSlug: string
  ): Promise<PublicPageContent> {
    return this.repository.getPublicPageContent(courseSlug, lessonSlug);
  }
}
