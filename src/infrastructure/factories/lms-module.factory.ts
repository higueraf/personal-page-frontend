import { AxiosLmsRepositoryAdapter } from "../adapters/lms-repository.adapter";
import { LmsUseCases } from "../../application/use-cases/lms/lms.use-cases";

export const lmsUseCases = new LmsUseCases(new AxiosLmsRepositoryAdapter());
