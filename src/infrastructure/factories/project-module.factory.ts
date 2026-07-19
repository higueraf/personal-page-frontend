import { AxiosProjectRepositoryAdapter } from "../adapters/project-repository.adapter";
import { ProjectUseCases } from "../../application/use-cases/project/project.use-cases";

export const projectUseCases = new ProjectUseCases(
  new AxiosProjectRepositoryAdapter()
);
