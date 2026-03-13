import { create } from "zustand";
import http from "../api/http";

export interface AuthUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role?: { name: string; permissions: string[] };
  permissions?: string[];
  status?: string;
  is_active?: boolean;
  full_name?: string;
  username?: string;
}

interface AuthState {
  user: AuthUser | null;
  status: "idle" | "loading" | "authenticated" | "unauthenticated";
  error: string | null;
  login:     (payload: { email: string; password: string }) => Promise<void>;
  logout:    () => Promise<void>;
  bootstrap: () => Promise<void>;
}

function normalize(u: AuthUser): AuthUser {
  return {
    ...u,
    full_name:   `${u.first_name} ${u.last_name}`.trim(),
    username:    u.email,
    permissions: u.permissions ?? u.role?.permissions ?? [],
  };
}

export const useAuth = create<AuthState>((set) => ({
  user:   null,
  status: "idle",
  error:  null,

  login: async (payload) => {
    set({ status: "loading", error: null });
    try {
      await http.post("/auth/login", payload);
      const me = await http.get<{ data: AuthUser }>("/user");
      set({ user: normalize(me.data.data), status: "authenticated", error: null });
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        err?.response?.data?.detail ??
        err?.message ??
        "Credenciales incorrectas";
      set({ status: "unauthenticated", error: msg, user: null });
      throw new Error(msg);
    }
  },

  logout: async () => {
    try { await http.post("/logout"); }
    finally { set({ user: null, status: "unauthenticated", error: null }); }
  },

  bootstrap: async () => {
    set({ status: "loading" });
    try {
      const me = await http.get<{ data: AuthUser }>("/user");
      set({ user: normalize(me.data.data), status: "authenticated", error: null });
    } catch {
      set({ user: null, status: "unauthenticated", error: null });
    }
  },
}));
