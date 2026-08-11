import axiosClient from "../http/axios-client";
import { PlaygroundRepositoryPort } from "../../domain/ports/playground-repository.port";
import {
  PlaygroundProject,
  PlaygroundDetail,
  CreatePlaygroundPayload,
  PlaygroundFile,
  RunResult,
  PlaygroundSnapshotSummary,
  PlaygroundSnapshotDetail,
} from "../../domain/entities/playground.entity";

export class AxiosPlaygroundRepositoryAdapter implements PlaygroundRepositoryPort {
  async list(): Promise<PlaygroundProject[]> {
    const { data } = await axiosClient.get("/playground");
    return Array.isArray(data) ? data : [];
  }

  async create(payload: CreatePlaygroundPayload): Promise<PlaygroundProject> {
    const { data } = await axiosClient.post("/playground", payload);
    return data;
  }

  async remove(id: string): Promise<void> {
    await axiosClient.delete(`/playground/${id}`);
  }

  async get(id: string): Promise<PlaygroundDetail> {
    const { data } = await axiosClient.get(`/playground/${id}`);
    return data;
  }

  async getServerTime(): Promise<string | null> {
    try {
      const { data } = await axiosClient.get("/playground/server-time");
      return data?.serverTime ?? null;
    } catch {
      return null;
    }
  }

  async saveAll(id: string, files: PlaygroundFile[]): Promise<void> {
    await axiosClient.put(`/playground/${id}/save-all`, { files });
  }

  async renameFile(id: string, fileId: string, name: string): Promise<void> {
    await axiosClient.patch(`/playground/${id}/files/${fileId}/rename`, { name });
  }

  async submit(id: string): Promise<void> {
    await axiosClient.post(`/playground/${id}/submit`);
  }

  async logCheat(id: string, action: string, details?: string): Promise<{ security_locked: boolean }> {
    const { data } = await axiosClient.post(`/playground/${id}/log-cheat`, { action, details });
    return { security_locked: !!data?.security_locked };
  }

  async execute(language: string, files: PlaygroundFile[]): Promise<RunResult> {
    const { data } = await axiosClient.post<RunResult>("/playground/execute", { language, files });
    return data;
  }

  async getMyProjectInExamGroup(groupId: string): Promise<string> {
    const { data } = await axiosClient.get(`/playground/exam-group/${groupId}/my-project`);
    return data.id;
  }

  async getProjectHistory(projectId: string): Promise<PlaygroundSnapshotSummary[]> {
    const { data } = await axiosClient.get(`/playground/admin/projects/${projectId}/history`);
    return data?.data ?? [];
  }

  async getProjectSnapshot(projectId: string, snapshotId: string): Promise<PlaygroundSnapshotDetail> {
    const { data } = await axiosClient.get(`/playground/admin/projects/${projectId}/history/${snapshotId}`);
    return data;
  }

  async unlockProject(projectId: string): Promise<void> {
    await axiosClient.post(`/playground/admin/projects/${projectId}/unlock`);
  }
}
