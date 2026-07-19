import { Page } from "../entities/page.entity";

export interface PageRepositoryPort {
  list(lessonId: string): Promise<Page[]>;
  create(body: Partial<Page>): Promise<Page>;
  update(id: string, body: Partial<Page>): Promise<Page>;
  delete(id: string): Promise<void>;
}
