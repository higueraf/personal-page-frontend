import { ExamTemplateRepositoryPort } from "../../../domain/ports/exam-template-repository.port";
import { ExamTemplateSummary, SaveExamTemplatePayload } from "../../../domain/entities/exam-template.entity";

export class ExamTemplateUseCases {
  constructor(private readonly repository: ExamTemplateRepositoryPort) {}

  list(): Promise<ExamTemplateSummary[]> {
    return this.repository.list();
  }

  get(id: string): Promise<ExamTemplateSummary> {
    return this.repository.get(id);
  }

  create(payload: SaveExamTemplatePayload): Promise<ExamTemplateSummary> {
    return this.repository.create(payload);
  }

  update(id: string, payload: Partial<SaveExamTemplatePayload>): Promise<ExamTemplateSummary> {
    return this.repository.update(id, payload);
  }

  remove(id: string): Promise<void> {
    return this.repository.remove(id);
  }
}
