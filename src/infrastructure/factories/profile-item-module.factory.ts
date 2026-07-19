import { AxiosProfileItemRepositoryAdapter } from "../adapters/profile-item-repository.adapter";
import { ProfileItemUseCases } from "../../application/use-cases/profile-item/profile-item.use-cases";

export const profileItemUseCases = new ProfileItemUseCases(
  new AxiosProfileItemRepositoryAdapter()
);
