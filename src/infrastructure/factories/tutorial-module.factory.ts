import { AxiosTutorialRepositoryAdapter } from "../adapters/tutorial-repository.adapter";
import { AxiosTutorialSectionRepositoryAdapter } from "../adapters/tutorial-section-repository.adapter";
import { AxiosLessonRepositoryAdapter } from "../adapters/lesson-repository.adapter";
import { AxiosPageRepositoryAdapter } from "../adapters/page-repository.adapter";
import { AxiosContentBlockRepositoryAdapter } from "../adapters/content-block-repository.adapter";
import { AxiosStudyCourseRepositoryAdapter } from "../adapters/study-course-repository.adapter";
import { AxiosInstitutionRepositoryAdapter } from "../adapters/institution-repository.adapter";

import { TutorialUseCases } from "../../application/use-cases/tutorial/tutorial.use-cases";
import { TutorialSectionUseCases } from "../../application/use-cases/tutorial-section/tutorial-section.use-cases";
import { LessonUseCases } from "../../application/use-cases/lesson/lesson.use-cases";
import { PageUseCases } from "../../application/use-cases/page/page.use-cases";
import { ContentBlockUseCases } from "../../application/use-cases/content-block/content-block.use-cases";
import { StudyCourseUseCases } from "../../application/use-cases/study-course/study-course.use-cases";
import { InstitutionUseCases } from "../../application/use-cases/institution/institution.use-cases";

export const tutorialUseCases = new TutorialUseCases(
  new AxiosTutorialRepositoryAdapter()
);
export const tutorialSectionUseCases = new TutorialSectionUseCases(
  new AxiosTutorialSectionRepositoryAdapter()
);
export const lessonUseCases = new LessonUseCases(
  new AxiosLessonRepositoryAdapter()
);
export const pageUseCases = new PageUseCases(new AxiosPageRepositoryAdapter());
export const contentBlockUseCases = new ContentBlockUseCases(
  new AxiosContentBlockRepositoryAdapter()
);
export const studyCourseUseCases = new StudyCourseUseCases(
  new AxiosStudyCourseRepositoryAdapter()
);
export const institutionUseCases = new InstitutionUseCases(
  new AxiosInstitutionRepositoryAdapter()
);
