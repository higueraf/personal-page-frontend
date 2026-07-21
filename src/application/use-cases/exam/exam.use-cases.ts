import { ExamRepositoryPort } from "../../../domain/ports/exam-repository.port";
import { ExamGroup, ExamProject, AssignExamPayload } from "../../../domain/entities/exam.entity";

export class ExamUseCases {
  constructor(private readonly repository: ExamRepositoryPort) {}

  listGroups(): Promise<ExamGroup[]> {
    return this.repository.listGroups();
  }

  listGroupProjects(groupId: string): Promise<ExamProject[]> {
    return this.repository.listGroupProjects(groupId);
  }

  assign(payload: AssignExamPayload): Promise<{ data: ExamProject[]; count: number; exam_group_id: string }> {
    return this.repository.assign(payload);
  }

  updateGroup(payload: {
    groupId: string;
    name?: string;
    start_time?: string;
    end_time?: string;
    allow_copy_paste?: boolean;
    require_seb?: boolean;
  }): Promise<ExamProject[]> {
    const { groupId, ...body } = payload;
    return this.repository.updateGroup(groupId, body);
  }

  deleteGroup(groupId: string): Promise<ExamProject[]> {
    return this.repository.deleteGroup(groupId);
  }

  changeProjectStatus(payload: { id: string; status: string }): Promise<ExamProject> {
    return this.repository.changeProjectStatus(payload.id, payload.status);
  }

  changeGroupStatus(payload: { groupId: string; status: string }): Promise<ExamProject[]> {
    return this.repository.changeGroupStatus(payload.groupId, payload.status);
  }

  downloadSebConfig(groupId: string): Promise<Blob> {
    return this.repository.downloadSebConfig(groupId);
  }

  getGradingPrompt(id: string): Promise<{ prompt: string }> {
    return this.repository.getGradingPrompt(id);
  }

  gradeProject(payload: { id: string; grade: number; feedback?: string }): Promise<ExamProject> {
    return this.repository.gradeProject(payload.id, payload.grade, payload.feedback);
  }
}
