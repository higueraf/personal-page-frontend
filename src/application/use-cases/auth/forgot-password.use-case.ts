import { AuthRepositoryPort } from "../../../domain/ports/auth-repository.port";
import { ForgotPasswordDto } from "../../dtos/auth/forgot-password.dto";

export class ForgotPasswordUseCase {
  constructor(private readonly authRepository: AuthRepositoryPort) {}

  execute(payload: ForgotPasswordDto): Promise<void> {
    return this.authRepository.forgotPassword(payload.email);
  }
}
