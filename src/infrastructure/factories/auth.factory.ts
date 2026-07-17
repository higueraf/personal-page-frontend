import { AxiosAuthRepositoryAdapter } from "../adapters/auth-repository.adapter";
import { LoginUseCase } from "../../application/use-cases/auth/login.use-case";
import { LogoutUseCase } from "../../application/use-cases/auth/logout.use-case";
import { GetCurrentUserUseCase } from "../../application/use-cases/auth/get-current-user.use-case";

const authRepository = new AxiosAuthRepositoryAdapter();

export const loginUseCase = new LoginUseCase(authRepository);
export const logoutUseCase = new LogoutUseCase(authRepository);
export const getCurrentUserUseCase = new GetCurrentUserUseCase(authRepository);
