import { AxiosPlaygroundTemplateRepositoryAdapter } from "../adapters/playground-template-repository.adapter";
import { PlaygroundTemplateUseCases } from "../../application/use-cases/playground-template/playground-template.use-cases";

export const playgroundTemplateUseCases = new PlaygroundTemplateUseCases(
  new AxiosPlaygroundTemplateRepositoryAdapter()
);
