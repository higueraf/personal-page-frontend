export type ContentBlockType =
  | "heading"
  | "paragraph"
  | "list"
  | "code"
  | "table"
  | "callout"
  | "divider"
  | "markdown";

export interface ContentBlock {
  id: string;
  /** UUID de la Page padre */
  page: string;
  type: ContentBlockType;
  order: number;
  data: Record<string, any>;
}
