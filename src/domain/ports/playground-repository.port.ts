import {
  PlaygroundProject,
  PlaygroundDetail,
  CreatePlaygroundPayload,
  PlaygroundFile,
  RunResult,
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
  logCheat(id: string, action: string, details?: string): Promise<void>;
  execute(language: string, files: PlaygroundFile[]): Promise<RunResult>;
}
