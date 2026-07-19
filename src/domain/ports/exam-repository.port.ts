import { ExamGroup, ExamProject, AssignExamPayload } from "../entities/exam.entity";

export interface ExamRepositoryPort {
  listGroups(): Promise<ExamGroup[]>;
  listGroupProjects(groupId: string): Promise<ExamProject[]>;
  assign(payload: AssignExamPayload): Promise<{ data: ExamProject[]; count: number; exam_group_id: string }>;
  updateGroup(
    groupId: string,
    body: { name?: string; start_time?: string; end_time?: string; allow_copy_paste?: boolean; require_seb?: boolean }
  ): Promise<ExamProject[]>;
  deleteGroup(groupId: string): Promise<ExamProject[]>;
  changeProjectStatus(id: string, status: string): Promise<ExamProject>;
  changeGroupStatus(groupId: string, status: string): Promise<ExamProject[]>;
  downloadSebConfig(groupId: string): Promise<Blob>;
}
