export type PageStatus = "DRAFT" | "PUBLISHED" | "HIDDEN";

export interface Page {
  id: string;
  /** UUID de la Lesson padre */
  lesson: string;
  title?: string | null;
  order: number;
  estimated_minutes: number;
  status: PageStatus;
}
