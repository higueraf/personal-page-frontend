export interface PlaygroundFile {
  id?: string;
  name: string;
  content?: string;
  path?: string;
  language?: string;
  is_folder?: boolean;
}

export interface PlaygroundProject {
  id: string;
  name: string;
  language: string;
  is_exam?: boolean;
  updated_at?: string;
  created_at?: string;
}

export interface PlaygroundDetail {
  id: string;
  name: string;
  language: string;
  is_exam?: boolean;
  status?: string;
  allow_copy_paste?: boolean;
  require_seb?: boolean;
  start_time?: string;
  end_time?: string;
  files?: PlaygroundFile[];
}

export interface CreatePlaygroundPayload {
  name: string;
  language: string;
  files: PlaygroundFile[];
}

export interface RunResult {
  stdout: string;
  stderr: string;
  output: string;
  code: number;
  signal: string;
  execution_time?: number;
}
