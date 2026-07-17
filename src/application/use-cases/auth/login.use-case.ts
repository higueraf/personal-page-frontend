import { AuthRepositoryPort } from "../../../domain/ports/auth-repository.port";
import { User } from "../../../domain/entities/user.entity";
import { LoginDto } from "../../dtos/auth/login.dto";

export class LoginUseCase {
  constructor(private readonly authRepository: AuthRepositoryPort) {}

  execute(payload: LoginDto): Promise<User> {
    return this.authRepository.login(payload.email, payload.password);
  }
}
