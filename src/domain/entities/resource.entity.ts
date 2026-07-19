export type ResourceType = "LINK" | "BOOK" | "TOOL" | "COURSE" | "VIDEO" | "ARTICLE" | "OTHER";

export interface Resource {
  id: string;
  title: string;
  description?: string | null;
  type: ResourceType;
  url?: string | null;
  tags?: string[];
  is_free: boolean;
  is_published: boolean;
  order: number;
  created_at?: string;
}
