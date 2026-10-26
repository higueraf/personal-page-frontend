export interface PlaygroundTemplateFile {
  name: string;
  path: string;
  content: string;
  is_folder: boolean;
}

export type StatementType = "text" | "pdf";

export interface PlaygroundTemplate {
  id: string;
  name: string;
  description?: string;
  language: string;
  files: PlaygroundTemplateFile[];
  statement_type?: StatementType;
  statement_pdf_url?: string | null;
  statement_pdf_original_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SavePlaygroundTemplatePayload {
  name: string;
  description?: string;
  language: string;
  files: PlaygroundTemplateFile[];
}
