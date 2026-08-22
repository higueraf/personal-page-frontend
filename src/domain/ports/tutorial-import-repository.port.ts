export interface ImportLessonPayload {
  slug: string;
  title: string;
  order: number;
  markdown: string;
}

export interface ImportSectionPayload {
  title: string;
  order: number;
  lessons: ImportLessonPayload[];
}

export interface ImportCoursePayload {
  title: string;
  slug?: string;
  description?: string;
  level?: string;
  status?: string;
  is_public?: boolean;
}

export interface ImportTutorialPayload {
  courseId?: string;
  course?: ImportCoursePayload;
  sections: ImportSectionPayload[];
}

export interface ImportTutorialResult {
  courseId: string;
  sections: { created: number; updated: number };
  lessons: { created: number; updated: number };
}

export interface TutorialImportRepositoryPort {
  import(payload: ImportTutorialPayload): Promise<ImportTutorialResult>;
}
