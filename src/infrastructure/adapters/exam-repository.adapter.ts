import axiosClient from "../http/axios-client";
import { ExamRepositoryPort } from "../../domain/ports/exam-repository.port";
import { ExamGroup, ExamProject, AssignExamPayload } from "../../domain/entities/exam.entity";

export class AxiosExamRepositoryAdapter implements ExamRepositoryPort {
  async listGroups(): Promise<ExamGroup[]> {
    const { data } = await axiosClient.get<{ data: ExamGroup[] }>("/playground/admin/exam-groups");
    return data.data;
  }

  async listGroupProjects(groupId: string): Promise<ExamProject[]> {
    const { data } = await axiosClient.get<{ data: ExamProject[] }>(
      `/playground/admin/exam-groups/${groupId}/projects`
    );
    return data.data;
  }

  async assign(
    payload: AssignExamPayload
  ): Promise<{ data: ExamProject[]; count: number; exam_group_id: string }> {
    const { data } = await axiosClient.post("/playground/admin/assign-exam", payload);
    return data;
  }

  async updateGroup(
    groupId: string,
    body: { name?: string; start_time?: string; end_time?: string; allow_copy_paste?: boolean; require_seb?: boolean }
  ): Promise<ExamProject[]> {
    const { data } = await axiosClient.patch(`/playground/admin/exam-groups/${groupId}`, body);
    return data;
  }

  async deleteGroup(groupId: string): Promise<ExamProject[]> {
    const { data } = await axiosClient.delete(`/playground/admin/exam-groups/${groupId}`);
    return data;
  }

  async changeProjectStatus(id: string, status: string): Promise<ExamProject> {
    const { data } = await axiosClient.patch(`/playground/admin/exam/${id}/status`, { status });
    return data;
  }

  async changeGroupStatus(groupId: string, status: string): Promise<ExamProject[]> {
    const { data } = await axiosClient.patch(`/playground/admin/exam-groups/${groupId}/status`, { status });
    return data;
  }

  async downloadSebConfig(groupId: string): Promise<Blob> {
    const { data } = await axiosClient.get(`/playground/admin/exam-groups/${groupId}/seb-config`, {
      responseType: "blob",
    });
    return data;
  }
}
