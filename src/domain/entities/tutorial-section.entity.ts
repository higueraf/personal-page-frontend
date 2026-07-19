export interface TutorialSection {
  id: string;
  /** UUID del Tutorial (Course) padre */
  tutorial: string;
  title: string;
  order: number;
  status?: string;
}
