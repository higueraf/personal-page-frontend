import axiosClient from "../http/axios-client";
import { ExamTemplateRepositoryPort } from "../../domain/ports/exam-template-repository.port";
import { ExamTemplateSummary, SaveExamTemplatePayload } from "../../domain/entities/exam-template.entity";

export class AxiosExamTemplateRepositoryAdapter implements ExamTemplateRepositoryPort {
  async list(): Promise<ExamTemplateSummary[]> {
    const { data } = await axiosClient.get<{ data: ExamTemplateSummary[] }>("/playground/admin/exam-templates");
    return data.data;
  }

  async get(id: string): Promise<ExamTemplateSummary> {
    const { data } = await axiosClient.get<ExamTemplateSummary>(`/playground/admin/exam-templates/${id}`);
    return data;
  }

  async create(payload: SaveExamTemplatePayload): Promise<ExamTemplateSummary> {
    const { data } = await axiosClient.post<ExamTemplateSummary>("/playground/admin/exam-templates", payload);
    return data;
  }

  async update(id: string, payload: Partial<SaveExamTemplatePayload>): Promise<ExamTemplateSummary> {
    const { data } = await axiosClient.patch<ExamTemplateSummary>(`/playground/admin/exam-templates/${id}`, payload);
    return data;
  }

  async remove(id: string): Promise<void> {
    await axiosClient.delete(`/playground/admin/exam-templates/${id}`);
  }
}
