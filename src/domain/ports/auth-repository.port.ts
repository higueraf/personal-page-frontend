import { User } from "../entities/user.entity";

export interface AuthRepositoryPort {
  login(email: string, password: string): Promise<User>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<User>;
  register(payload: {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    password_confirm: string;
  }): Promise<void>;
  forgotPassword(email: string): Promise<void>;
  resetPassword(token: string, password: string, passwordConfirm: string): Promise<void>;
  updateProfile(payload: { first_name?: string; last_name?: string }): Promise<User>;
  uploadAvatar(file: File): Promise<User>;
  changePassword(currentPassword: string, newPassword: string): Promise<void>;
}
