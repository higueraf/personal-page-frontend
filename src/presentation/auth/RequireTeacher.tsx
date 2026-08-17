import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../store/auth.store";
import { isAdminOrTeacher } from "../../domain/services/auth-authorization.service";

/**
 * Guard para el panel de profesor del LMS.
 * Permite acceso a 'admin' y 'teacher'; el resto es redirigido al home.
 * Usuarios no autenticados son redirigidos al login.
 */
export function RequireTeacher() {
  const { status, user } = useAuth();
  const location = useLocation();

  if (status === "idle" || status === "loading") {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--color-bg)",
          color: "var(--color-text-muted)",
          fontFamily: "var(--font-mono)",
          fontSize: ".9rem",
        }}
      >
        Verificando sesión…
      </div>
    );
  }

  if (status !== "authenticated") {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (!isAdminOrTeacher(user)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
