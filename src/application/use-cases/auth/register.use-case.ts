import { AuthRepositoryPort } from "../../../domain/ports/auth-repository.port";
import { RegisterDto } from "../../dtos/auth/register.dto";

export class RegisterUseCase {
  constructor(private readonly authRepository: AuthRepositoryPort) {}

  execute(payload: RegisterDto): Promise<void> {
    return this.authRepository.register(payload);
  }
}
