import axiosClient from "../http/axios-client";
import { parseApiError } from "../http/parse-api-error";
import { ApiException } from "../../domain/exceptions/api.exception";
import { AuthRepositoryPort } from "../../domain/ports/auth-repository.port";
import { User } from "../../domain/entities/user.entity";

function normalize(u: User): User {
  return {
    ...u,
    full_name: `${u.first_name} ${u.last_name}`.trim(),
    username: u.email,
    permissions: u.permissions ?? u.role?.permissions ?? [],
  };
}

export class AxiosAuthRepositoryAdapter implements AuthRepositoryPort {
  async login(email: string, password: string): Promise<User> {
    try {
      await axiosClient.post("/auth/login", { email, password });
    } catch (err) {
      throw new ApiException(parseApiError(err, "Credenciales incorrectas"));
    }
    return this.getCurrentUser();
  }

  async logout(): Promise<void> {
    try {
      await axiosClient.post("/logout");
    } catch {
      // Se ignora: el estado local siempre se limpia en el use-case/store
    }
  }

  async getCurrentUser(): Promise<User> {
    const { data } = await axiosClient.get<{ data: User }>("/user");
    return normalize(data.data);
  }

  async register(payload: {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    password_confirm: string;
  }): Promise<void> {
    await axiosClient.post("/register", payload);
  }

  async forgotPassword(email: string): Promise<void> {
    await axiosClient.post("/auth/forgot-password", { email });
  }

  async resetPassword(token: string, password: string, passwordConfirm: string): Promise<void> {
    await axiosClient.post("/auth/reset-password", {
      token,
      password,
      password_confirm: passwordConfirm,
    });
  }

  async updateProfile(payload: { first_name?: string; last_name?: string }): Promise<User> {
    const { data } = await axiosClient.patch<{ data: User }>("/user", payload);
    return normalize(data.data);
  }

  async uploadAvatar(file: File): Promise<User> {
    const formData = new FormData();
    formData.append("avatar", file);
    const { data } = await axiosClient.post<{ data: User }>("/user/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return normalize(data.data);
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await axiosClient.post("/auth/change-password", {
      current_password: currentPassword,
      new_password: newPassword,
    });
  }
}
