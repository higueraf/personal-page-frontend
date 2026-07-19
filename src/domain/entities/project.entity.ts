export type ProjectStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface Project {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  long_description?: string | null;
  tech_stack?: string[];
  url?: string | null;
  repo_url?: string | null;
  thumbnail?: string | null;
  order: number;
  status: ProjectStatus;
  created_at?: string;
  updated_at?: string;
}
