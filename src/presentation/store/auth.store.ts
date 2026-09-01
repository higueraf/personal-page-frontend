import { create } from "zustand";
import { User } from "../../domain/entities/user.entity";
import { ApiException } from "../../domain/exceptions/api.exception";
import { API_BASE_URL } from "../../infrastructure/config/env";
import {
  loginUseCase,
  logoutUseCase,
  getCurrentUserUseCase,
} from "../../infrastructure/factories/auth.factory";
import { playgroundUseCases } from "../../infrastructure/factories/playground-module.factory";

export type AuthUser = User;

/** Convierte un path relativo servido por el backend (/uploads/...) en URL absoluta. */
export const uploadUrl = (path?: string | null): string | undefined =>
  path ? `${API_BASE_URL.replace(/\/api$/, "")}${path}` : undefined;

/** Convierte un path de avatar guardado (/uploads/avatars/file.jpg) en URL absoluta. */
export const avatarUrl = uploadUrl;

export interface ActiveExam {
  id: string;
  requireSeb: boolean;
  startTime: string | null;
  endTime: string | null;
}

interface AuthState {
  user: AuthUser | null;
  status: "idle" | "loading" | "authenticated" | "unauthenticated";
  error: string | null;
  /** The student's current not-yet-submitted exam, if any. Drives full navigation
   *  lockdown to the exam route (see ExamLockGate) — populated on login/bootstrap. */
  activeExam: ActiveExam | null;
  login: (payload: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  bootstrap: () => Promise<void>;
  refreshActiveExam: () => Promise<void>;
  clearActiveExam: () => void;
}

async function fetchActiveExam(): Promise<ActiveExam | null> {
  try {
    const exam = await playgroundUseCases.getMyActiveExam();
    if (!exam) return null;
    return { id: exam.id, requireSeb: exam.require_seb, startTime: exam.start_time, endTime: exam.end_time };
  } catch {
    return null;
  }
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  status: "idle",
  error: null,
  activeExam: null,

  login: async (payload) => {
    set({ status: "loading", error: null });
    try {
      const user = await loginUseCase.execute(payload);
      const activeExam = await fetchActiveExam();
      set({ user, status: "authenticated", error: null, activeExam });
    } catch (err) {
      const msg = err instanceof ApiException ? err.message : "Credenciales incorrectas";
      set({ status: "unauthenticated", error: msg, user: null, activeExam: null });
      throw new Error(msg);
    }
  },

  logout: async () => {
    try {
      await logoutUseCase.execute();
    } finally {
      set({ user: null, status: "unauthenticated", error: null, activeExam: null });
    }
  },

  bootstrap: async () => {
    set({ status: "loading" });
    try {
      const user = await getCurrentUserUseCase.execute();
      const activeExam = await fetchActiveExam();
      set({ user, status: "authenticated", error: null, activeExam });
    } catch {
      set({ user: null, status: "unauthenticated", error: null, activeExam: null });
    }
  },

  refreshActiveExam: async () => {
    const activeExam = await fetchActiveExam();
    set({ activeExam });
  },

  clearActiveExam: () => set({ activeExam: null }),
}));
