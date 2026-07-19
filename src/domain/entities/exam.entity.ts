export interface ExamGroup {
  group_id: string;
  name: string;
  materia: string | null;
  language: string;
  start_time: string | null;
  end_time: string | null;
  allow_copy_paste: boolean;
  require_seb: boolean;
  created_at: string;
  total_count: number;
  submitted_count: number;
  cheating_count: number;
}

export interface ExamProject {
  id: string;
  name: string;
  materia: string | null;
  status: string;
  start_time: string | null;
  end_time: string | null;
  allow_copy_paste: boolean;
  cheating_logs: Array<{ timestamp: string; action: string; details?: string }>;
  user?: { id: string; first_name: string; last_name: string; email: string };
  exam_group_id: string | null;
}

export interface AssignExamPayload {
  name: string;
  language: string;
  materia?: string;
  start_time?: string;
  end_time?: string;
  allow_copy_paste?: boolean;
  require_seb?: boolean;
  files?: Array<{ id?: string; name: string; content?: string; path?: string }>;
  studentIds?: string[];
  studentId?: string;
  courseId?: string;
}
