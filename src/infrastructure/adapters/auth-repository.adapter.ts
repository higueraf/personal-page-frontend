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
}
