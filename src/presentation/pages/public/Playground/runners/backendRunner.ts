import { playgroundUseCases } from "../../../../../infrastructure/factories/playground-module.factory";
import type { VirtualFile } from "../store/playgroundStore";
import type { RunResult } from "../../../../../domain/entities/playground.entity";

export type { RunResult };

export async function runOnBackend(
  language: string,
  files: VirtualFile[]
): Promise<RunResult> {
  const codeFiles = files
    .filter((f) => !f.is_folder && f.content.trim() !== "")
    .map((f) => ({ name: f.name, content: f.content }));

  return playgroundUseCases.execute(language, codeFiles);
}
