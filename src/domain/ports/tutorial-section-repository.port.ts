import { TutorialSection } from "../entities/tutorial-section.entity";

export interface ConsolidateSectionsResult {
  sections_removed: number;
  lessons_moved: number;
}

export interface TutorialSectionRepositoryPort {
  list(tutorialId: string): Promise<TutorialSection[]>;
  create(body: Partial<TutorialSection>): Promise<TutorialSection>;
  update(
    id: string,
    body: Partial<TutorialSection>
  ): Promise<TutorialSection>;
  delete(id: string): Promise<void>;
  consolidate(tutorialId: string): Promise<ConsolidateSectionsResult>;
}
