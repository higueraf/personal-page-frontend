import { User } from "../entities/user.entity";

function roleName(user: User | null | undefined): string | undefined {
  return user?.role?.name?.toLowerCase();
}

/** Regla de negocio pura: determina si un usuario tiene rol de administrador. */
export function isAdmin(user: User | null | undefined): boolean {
  return roleName(user) === "admin";
}

/** Regla de negocio pura: determina si un usuario tiene rol de profesor. */
export function isTeacher(user: User | null | undefined): boolean {
  return roleName(user) === "teacher";
}

/** Admin o profesor: acceso de gestión al LMS (crear/editar cursos, calificar). */
export function isAdminOrTeacher(user: User | null | undefined): boolean {
  return isAdmin(user) || isTeacher(user);
}
