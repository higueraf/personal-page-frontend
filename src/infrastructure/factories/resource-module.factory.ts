import { AxiosResourceRepositoryAdapter } from "../adapters/resource-repository.adapter";
import { ResourceUseCases } from "../../application/use-cases/resource/resource.use-cases";

export const resourceUseCases = new ResourceUseCases(
  new AxiosResourceRepositoryAdapter()
);
