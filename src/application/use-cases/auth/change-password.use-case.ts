import { AuthRepositoryPort } from "../../../domain/ports/auth-repository.port";
import { ChangePasswordDto } from "../../dtos/auth/change-password.dto";

export class ChangePasswordUseCase {
  constructor(private readonly authRepository: AuthRepositoryPort) {}

  execute(payload: ChangePasswordDto): Promise<void> {
    return this.authRepository.changePassword(payload.current_password, payload.new_password);
  }
}
