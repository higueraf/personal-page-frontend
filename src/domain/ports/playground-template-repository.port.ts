import { PlaygroundTemplate, SavePlaygroundTemplatePayload } from "../entities/playground-template.entity";

export interface PlaygroundTemplateRepositoryPort {
  list(language?: string): Promise<PlaygroundTemplate[]>;
  get(id: string): Promise<PlaygroundTemplate>;
  create(payload: SavePlaygroundTemplatePayload): Promise<PlaygroundTemplate>;
  update(id: string, payload: Partial<SavePlaygroundTemplatePayload>): Promise<PlaygroundTemplate>;
  remove(id: string): Promise<void>;
}
