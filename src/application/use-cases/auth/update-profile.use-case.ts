import { AuthRepositoryPort } from "../../../domain/ports/auth-repository.port";
import { User } from "../../../domain/entities/user.entity";
import { UpdateProfileDto } from "../../dtos/auth/update-profile.dto";

export class UpdateProfileUseCase {
  constructor(private readonly authRepository: AuthRepositoryPort) {}

  execute(payload: UpdateProfileDto): Promise<User> {
    return this.authRepository.updateProfile(payload);
  }
}
