import { TutorialSectionRepositoryPort } from "../../../domain/ports/tutorial-section-repository.port";
import { TutorialSection } from "../../../domain/entities/tutorial-section.entity";

export class TutorialSectionUseCases {
  constructor(private readonly repository: TutorialSectionRepositoryPort) {}

  list(tutorialId: string): Promise<TutorialSection[]> {
    return this.repository.list(tutorialId);
  }
  create(body: Partial<TutorialSection>): Promise<TutorialSection> {
    return this.repository.create(body);
  }
  update(
    id: string,
    body: Partial<TutorialSection>
  ): Promise<TutorialSection> {
    return this.repository.update(id, body);
  }
  delete(id: string): Promise<void> {
    return this.repository.delete(id);
  }
}
