import { Lesson } from "../entities/lesson.entity";

export interface LessonRepositoryPort {
  list(sectionId: string): Promise<Lesson[]>;
  create(body: Partial<Lesson>): Promise<Lesson>;
  update(id: string, body: Partial<Lesson>): Promise<Lesson>;
  delete(id: string): Promise<void>;
  reorder(items: { id: string; order: number }[]): Promise<void>;
}
