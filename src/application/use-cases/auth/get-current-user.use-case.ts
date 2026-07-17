import { AuthRepositoryPort } from "../../../domain/ports/auth-repository.port";
import { User } from "../../../domain/entities/user.entity";

export class GetCurrentUserUseCase {
  constructor(private readonly authRepository: AuthRepositoryPort) {}

  execute(): Promise<User> {
    return this.authRepository.getCurrentUser();
  }
}
