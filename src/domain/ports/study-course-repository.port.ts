import { StudyCourse } from "../entities/study-course.entity";

export interface StudyCourseRepositoryPort {
  listPublic(): Promise<StudyCourse[]>;
  listAdmin(institution_id?: string): Promise<StudyCourse[]>;
  create(body: {
    name: string;
    description?: string;
    institution_id?: string;
  }): Promise<StudyCourse>;
  update(
    id: string,
    body: { name?: string; description?: string; institution_id?: string | null }
  ): Promise<StudyCourse>;
  delete(id: string): Promise<void>;
}
