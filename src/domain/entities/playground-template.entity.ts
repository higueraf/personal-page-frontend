export interface PlaygroundTemplateFile {
  name: string;
  path: string;
  content: string;
  is_folder: boolean;
}

export interface PlaygroundTemplate {
  id: string;
  name: string;
  description?: string;
  language: string;
  files: PlaygroundTemplateFile[];
  created_at: string;
  updated_at: string;
}

export interface SavePlaygroundTemplatePayload {
  name: string;
  description?: string;
  language: string;
  files: PlaygroundTemplateFile[];
}
