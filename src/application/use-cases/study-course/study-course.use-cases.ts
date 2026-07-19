import { StudyCourseRepositoryPort } from "../../../domain/ports/study-course-repository.port";
import { StudyCourse } from "../../../domain/entities/study-course.entity";

export class StudyCourseUseCases {
  constructor(private readonly repository: StudyCourseRepositoryPort) {}

  listPublic(): Promise<StudyCourse[]> {
    return this.repository.listPublic();
  }
  listAdmin(institution_id?: string): Promise<StudyCourse[]> {
    return this.repository.listAdmin(institution_id);
  }

  create(body: {
    name: string;
    description?: string;
    institution_id?: string;
  }): Promise<StudyCourse> {
    return this.repository.create(body);
  }

  update(
    id: string,
    body: { name?: string; description?: string; institution_id?: string | null }
  ): Promise<StudyCourse> {
    return this.repository.update(id, body);
  }

  delete(id: string): Promise<void> {
    return this.repository.delete(id);
  }
}
