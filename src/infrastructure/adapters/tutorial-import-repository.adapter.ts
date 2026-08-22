import axiosClient from "../http/axios-client";
import {
  TutorialImportRepositoryPort,
  ImportTutorialPayload,
  ImportTutorialResult,
} from "../../domain/ports/tutorial-import-repository.port";

export class AxiosTutorialImportRepositoryAdapter
  implements TutorialImportRepositoryPort
{
  async import(payload: ImportTutorialPayload): Promise<ImportTutorialResult> {
    const { data } = await axiosClient.post<{ data: ImportTutorialResult }>(
      "/courses/import",
      payload
    );
    return data.data;
  }
}
