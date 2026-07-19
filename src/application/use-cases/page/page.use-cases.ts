import { PageRepositoryPort } from "../../../domain/ports/page-repository.port";
import { Page } from "../../../domain/entities/page.entity";

export class PageUseCases {
  constructor(private readonly repository: PageRepositoryPort) {}

  list(lessonId: string): Promise<Page[]> {
    return this.repository.list(lessonId);
  }
  create(body: Partial<Page>): Promise<Page> {
    return this.repository.create(body);
  }
  update(id: string, body: Partial<Page>): Promise<Page> {
    return this.repository.update(id, body);
  }
  delete(id: string): Promise<void> {
    return this.repository.delete(id);
  }
}
