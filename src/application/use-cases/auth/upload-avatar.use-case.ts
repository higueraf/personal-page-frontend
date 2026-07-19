import { AuthRepositoryPort } from "../../../domain/ports/auth-repository.port";
import { User } from "../../../domain/entities/user.entity";

export class UploadAvatarUseCase {
  constructor(private readonly authRepository: AuthRepositoryPort) {}

  execute(file: File): Promise<User> {
    return this.authRepository.uploadAvatar(file);
  }
}
