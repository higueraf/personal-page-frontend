export interface ExamTemplateQuestion {
  order: number;
  title: string;
  points: number;
  statement: string;
}

export interface ExamVersion {
  id: string;
  theme_name: string;
  order_index: number;
  questions: ExamTemplateQuestion[];
}

export interface ExamTemplateSummary {
  id: string;
  name: string;
  description?: string;
  language: string;
  versions?: ExamVersion[];
  created_at: string;
  updated_at: string;
}

export interface SaveExamTemplatePayload {
  name: string;
  description?: string;
  language: string;
  versions: Array<{
    theme_name: string;
    order_index: number;
    questions: ExamTemplateQuestion[];
  }>;
}
