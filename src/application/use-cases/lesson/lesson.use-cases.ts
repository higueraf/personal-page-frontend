import { LessonRepositoryPort } from "../../../domain/ports/lesson-repository.port";
import { Lesson } from "../../../domain/entities/lesson.entity";

export class LessonUseCases {
  constructor(private readonly repository: LessonRepositoryPort) {}

  list(sectionId: string): Promise<Lesson[]> {
    return this.repository.list(sectionId);
  }
  create(body: Partial<Lesson>): Promise<Lesson> {
    return this.repository.create(body);
  }
  update(id: string, body: Partial<Lesson>): Promise<Lesson> {
    return this.repository.update(id, body);
  }
  delete(id: string): Promise<void> {
    return this.repository.delete(id);
  }
  reorder(items: { id: string; order: number }[]): Promise<void> {
    return this.repository.reorder(items);
  }
}
