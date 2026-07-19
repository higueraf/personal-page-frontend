import { AuthRepositoryPort } from "../../../domain/ports/auth-repository.port";
import { ResetPasswordDto } from "../../dtos/auth/reset-password.dto";

export class ResetPasswordUseCase {
  constructor(private readonly authRepository: AuthRepositoryPort) {}

  execute(payload: ResetPasswordDto): Promise<void> {
    return this.authRepository.resetPassword(payload.token, payload.password, payload.password_confirm);
  }
}
