import { AxiosPlaygroundRepositoryAdapter } from "../adapters/playground-repository.adapter";
import { PlaygroundUseCases } from "../../application/use-cases/playground/playground.use-cases";

export const playgroundUseCases = new PlaygroundUseCases(
  new AxiosPlaygroundRepositoryAdapter()
);
