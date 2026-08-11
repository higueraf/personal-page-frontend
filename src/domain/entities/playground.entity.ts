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
  security_locked?: boolean;
  start_time?: string;
  end_time?: string;
  files?: PlaygroundFile[];
  user?: { first_name: string; last_name: string; email: string };
  grade?: number | null;
  feedback?: string | null;
}

/** Lightweight entry in a project's change history (see `PlaygroundSnapshot` backend entity). */
export interface PlaygroundSnapshotSummary {
  id: string;
  created_at: string;
  file_count: number;
}

/** Full contents of a single point-in-time snapshot. */
export interface PlaygroundSnapshotDetail {
  id: string;
  created_at: string;
  files: PlaygroundFile[];
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
