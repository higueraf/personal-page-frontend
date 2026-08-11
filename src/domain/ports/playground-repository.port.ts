import {
  PlaygroundProject,
  PlaygroundDetail,
  CreatePlaygroundPayload,
  PlaygroundFile,
  RunResult,
  PlaygroundSnapshotSummary,
  PlaygroundSnapshotDetail,
} from "../entities/playground.entity";

export interface PlaygroundRepositoryPort {
  list(): Promise<PlaygroundProject[]>;
  create(payload: CreatePlaygroundPayload): Promise<PlaygroundProject>;
  remove(id: string): Promise<void>;
  get(id: string): Promise<PlaygroundDetail>;
  getServerTime(): Promise<string | null>;
  saveAll(id: string, files: PlaygroundFile[]): Promise<void>;
  renameFile(id: string, fileId: string, name: string): Promise<void>;
  submit(id: string): Promise<void>;
  logCheat(id: string, action: string, details?: string): Promise<{ security_locked: boolean }>;
  execute(language: string, files: PlaygroundFile[]): Promise<RunResult>;
  getMyProjectInExamGroup(groupId: string): Promise<string>;
  getProjectHistory(projectId: string): Promise<PlaygroundSnapshotSummary[]>;
  getProjectSnapshot(projectId: string, snapshotId: string): Promise<PlaygroundSnapshotDetail>;
  unlockProject(projectId: string): Promise<void>;
}
