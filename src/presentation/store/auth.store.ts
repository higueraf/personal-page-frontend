import { create } from "zustand";
import { User } from "../../domain/entities/user.entity";
import { ApiException } from "../../domain/exceptions/api.exception";
import { API_BASE_URL } from "../../infrastructure/config/env";
import {
  loginUseCase,
  logoutUseCase,
  getCurrentUserUseCase,
} from "../../infrastructure/factories/auth.factory";

export type AuthUser = User;

/** Convierte un path de avatar guardado (/uploads/avatars/file.jpg) en URL absoluta. */
export const avatarUrl = (path?: string | null): string | undefined =>
  path ? `${API_BASE_URL.replace(/\/api$/, "")}${path}` : undefined;

interface AuthState {
  user: AuthUser | null;
  status: "idle" | "loading" | "authenticated" | "unauthenticated";
  error: string | null;
  login: (payload: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  bootstrap: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  status: "idle",
  error: null,

  login: async (payload) => {
    set({ status: "loading", error: null });
    try {
      const user = await loginUseCase.execute(payload);
      set({ user, status: "authenticated", error: null });
    } catch (err) {
      const msg = err instanceof ApiException ? err.message : "Credenciales incorrectas";
      set({ status: "unauthenticated", error: msg, user: null });
      throw new Error(msg);
    }
  },

  logout: async () => {
    try {
      await logoutUseCase.execute();
    } finally {
      set({ user: null, status: "unauthenticated", error: null });
    }
  },

  bootstrap: async () => {
    set({ status: "loading" });
    try {
      const user = await getCurrentUserUseCase.execute();
      set({ user, status: "authenticated", error: null });
    } catch {
      set({ user: null, status: "unauthenticated", error: null });
    }
  },
}));
