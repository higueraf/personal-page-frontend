import { AxiosExamTemplateRepositoryAdapter } from "../adapters/exam-template-repository.adapter";
import { ExamTemplateUseCases } from "../../application/use-cases/exam-template/exam-template.use-cases";

export const examTemplateUseCases = new ExamTemplateUseCases(
  new AxiosExamTemplateRepositoryAdapter()
);
