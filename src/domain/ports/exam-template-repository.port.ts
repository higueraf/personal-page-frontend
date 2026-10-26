import { ExamTemplateSummary, ExamVersion, SaveExamTemplatePayload } from "../entities/exam-template.entity";

export interface ExamTemplateRepositoryPort {
  list(): Promise<ExamTemplateSummary[]>;
  get(id: string): Promise<ExamTemplateSummary>;
  create(payload: SaveExamTemplatePayload): Promise<ExamTemplateSummary>;
  update(id: string, payload: Partial<SaveExamTemplatePayload>): Promise<ExamTemplateSummary>;
  remove(id: string): Promise<void>;
  resetPracticeData(): Promise<void>;
  uploadVersionStatementPdf(versionId: string, file: File): Promise<ExamVersion>;
  removeVersionStatementPdf(versionId: string): Promise<ExamVersion>;
}
