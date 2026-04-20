import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./authStore";

/**
 * Guard para rutas admin.
 * Solo permite acceso a usuarios con rol 'admin'.
 * Otros usuarios autenticados son redirigidos al home.
 * Usuarios no autenticados son redirigidos al login.
 */
export function RequireAdmin() {
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

  // Only allow admin role
  const roleName = user?.role?.name?.toLowerCase();
  if (roleName !== "admin") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
