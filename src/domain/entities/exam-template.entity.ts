export interface ExamTemplateQuestion {
  order: number;
  title: string;
  points: number;
  statement: string;
}

export type StatementType = "text" | "pdf";

export interface ExamVersion {
  id: string;
  theme_name: string;
  order_index: number;
  questions: ExamTemplateQuestion[];
  statement_type?: StatementType;
  statement_pdf_url?: string | null;
  statement_pdf_original_name?: string | null;
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
    statement_type?: StatementType;
    statement_pdf_url?: string | null;
    statement_pdf_original_name?: string | null;
  }>;
}
