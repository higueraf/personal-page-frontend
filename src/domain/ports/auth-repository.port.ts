import { User } from "../entities/user.entity";

export interface AuthRepositoryPort {
  login(email: string, password: string): Promise<User>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<User>;
}
