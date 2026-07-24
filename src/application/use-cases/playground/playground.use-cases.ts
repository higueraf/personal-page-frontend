import { PlaygroundRepositoryPort } from "../../../domain/ports/playground-repository.port";
import {
  PlaygroundProject,
  PlaygroundDetail,
  CreatePlaygroundPayload,
  PlaygroundFile,
  RunResult,
} from "../../../domain/entities/playground.entity";

export class PlaygroundUseCases {
  constructor(private readonly repository: PlaygroundRepositoryPort) {}

  list(): Promise<PlaygroundProject[]> {
    return this.repository.list();
  }

  create(payload: CreatePlaygroundPayload): Promise<PlaygroundProject> {
    return this.repository.create(payload);
  }

  remove(id: string): Promise<void> {
    return this.repository.remove(id);
  }

  get(id: string): Promise<PlaygroundDetail> {
    return this.repository.get(id);
  }

  getServerTime(): Promise<string | null> {
    return this.repository.getServerTime();
  }

  saveAll(id: string, files: PlaygroundFile[]): Promise<void> {
    return this.repository.saveAll(id, files);
  }

  renameFile(id: string, fileId: string, name: string): Promise<void> {
    return this.repository.renameFile(id, fileId, name);
  }

  submit(id: string): Promise<void> {
    return this.repository.submit(id);
  }

  logCheat(id: string, action: string, details?: string): Promise<void> {
    return this.repository.logCheat(id, action, details);
  }

  execute(language: string, files: PlaygroundFile[]): Promise<RunResult> {
    return this.repository.execute(language, files);
  }

  getMyProjectInExamGroup(groupId: string): Promise<string> {
    return this.repository.getMyProjectInExamGroup(groupId);
  }
}
