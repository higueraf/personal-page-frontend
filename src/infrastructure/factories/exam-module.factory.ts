import { AxiosExamRepositoryAdapter } from "../adapters/exam-repository.adapter";
import { ExamUseCases } from "../../application/use-cases/exam/exam.use-cases";

export const examUseCases = new ExamUseCases(
  new AxiosExamRepositoryAdapter()
);
