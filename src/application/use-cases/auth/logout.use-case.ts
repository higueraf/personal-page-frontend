import { AuthRepositoryPort } from "../../../domain/ports/auth-repository.port";

export class LogoutUseCase {
  constructor(private readonly authRepository: AuthRepositoryPort) {}

  execute(): Promise<void> {
    return this.authRepository.logout();
  }
}
