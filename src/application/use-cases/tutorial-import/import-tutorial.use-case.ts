import {
  TutorialImportRepositoryPort,
  ImportTutorialPayload,
  ImportTutorialResult,
} from "../../../domain/ports/tutorial-import-repository.port";

export class TutorialImportUseCases {
  constructor(private readonly repository: TutorialImportRepositoryPort) {}

  import(payload: ImportTutorialPayload): Promise<ImportTutorialResult> {
    return this.repository.import(payload);
  }
}
