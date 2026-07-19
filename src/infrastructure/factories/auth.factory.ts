import { AxiosAuthRepositoryAdapter } from "../adapters/auth-repository.adapter";
import { LoginUseCase } from "../../application/use-cases/auth/login.use-case";
import { LogoutUseCase } from "../../application/use-cases/auth/logout.use-case";
import { GetCurrentUserUseCase } from "../../application/use-cases/auth/get-current-user.use-case";
import { RegisterUseCase } from "../../application/use-cases/auth/register.use-case";
import { ForgotPasswordUseCase } from "../../application/use-cases/auth/forgot-password.use-case";
import { ResetPasswordUseCase } from "../../application/use-cases/auth/reset-password.use-case";
import { UpdateProfileUseCase } from "../../application/use-cases/auth/update-profile.use-case";
import { UploadAvatarUseCase } from "../../application/use-cases/auth/upload-avatar.use-case";
import { ChangePasswordUseCase } from "../../application/use-cases/auth/change-password.use-case";

const authRepository = new AxiosAuthRepositoryAdapter();

export const loginUseCase = new LoginUseCase(authRepository);
export const logoutUseCase = new LogoutUseCase(authRepository);
export const getCurrentUserUseCase = new GetCurrentUserUseCase(authRepository);
export const registerUseCase = new RegisterUseCase(authRepository);
export const forgotPasswordUseCase = new ForgotPasswordUseCase(authRepository);
export const resetPasswordUseCase = new ResetPasswordUseCase(authRepository);
export const updateProfileUseCase = new UpdateProfileUseCase(authRepository);
export const uploadAvatarUseCase = new UploadAvatarUseCase(authRepository);
export const changePasswordUseCase = new ChangePasswordUseCase(authRepository);
