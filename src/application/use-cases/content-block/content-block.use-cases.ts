import { ContentBlockRepositoryPort } from "../../../domain/ports/content-block-repository.port";
import { ContentBlock } from "../../../domain/entities/content-block.entity";

export class ContentBlockUseCases {
  constructor(private readonly repository: ContentBlockRepositoryPort) {}

  list(pageId: string): Promise<ContentBlock[]> {
    return this.repository.list(pageId);
  }
  create(body: Partial<ContentBlock>): Promise<ContentBlock> {
    return this.repository.create(body);
  }
  update(id: string, body: Partial<ContentBlock>): Promise<ContentBlock> {
    return this.repository.update(id, body);
  }
  delete(id: string): Promise<void> {
    return this.repository.delete(id);
  }
}
