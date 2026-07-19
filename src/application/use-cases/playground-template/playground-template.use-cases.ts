import { PlaygroundTemplateRepositoryPort } from "../../../domain/ports/playground-template-repository.port";
import { PlaygroundTemplate, SavePlaygroundTemplatePayload } from "../../../domain/entities/playground-template.entity";

export class PlaygroundTemplateUseCases {
  constructor(private readonly repository: PlaygroundTemplateRepositoryPort) {}

  list(language?: string): Promise<PlaygroundTemplate[]> {
    return this.repository.list(language);
  }

  get(id: string): Promise<PlaygroundTemplate> {
    return this.repository.get(id);
  }

  create(payload: SavePlaygroundTemplatePayload): Promise<PlaygroundTemplate> {
    return this.repository.create(payload);
  }

  update(id: string, payload: Partial<SavePlaygroundTemplatePayload>): Promise<PlaygroundTemplate> {
    return this.repository.update(id, payload);
  }

  remove(id: string): Promise<void> {
    return this.repository.remove(id);
  }
}
