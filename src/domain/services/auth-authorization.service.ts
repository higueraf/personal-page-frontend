import { User } from "../entities/user.entity";

/** Regla de negocio pura: determina si un usuario tiene rol de administrador. */
export function isAdmin(user: User | null | undefined): boolean {
  return user?.role?.name?.toLowerCase() === "admin";
}
