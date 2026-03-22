import http from "../../../../shared/api/http";
import type { VirtualFile } from "../store/playgroundStore";

export interface RunResult {
  stdout: string;
  stderr: string;
  output: string;
  code: number;
  signal: string;
  execution_time?: number;
}

export async function runOnBackend(
  language: string,
  files: VirtualFile[]
): Promise<RunResult> {
  const codeFiles = files
    .filter((f) => !f.is_folder && f.content.trim() !== "")
    .map((f) => ({ name: f.name, content: f.content }));

  const { data } = await http.post<RunResult>("/playground/execute", {
    language,
    files: codeFiles,
  });

  return data;
}
