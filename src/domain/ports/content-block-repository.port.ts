import { ContentBlock } from "../entities/content-block.entity";

export interface ContentBlockRepositoryPort {
  list(pageId: string): Promise<ContentBlock[]>;
  create(body: Partial<ContentBlock>): Promise<ContentBlock>;
  update(id: string, body: Partial<ContentBlock>): Promise<ContentBlock>;
  delete(id: string): Promise<void>;
}
