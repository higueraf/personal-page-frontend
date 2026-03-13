import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./authStore";

/**
 * Guard para rutas admin.
 * Si la sesión aún se está verificando → spinner.
 * Si no está autenticado → redirige a /admin/login preservando el destino.
 */
export function RequireAuth() {
  const { status } = useAuth();
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
    // La autenticación vive en la parte pública (login/register) y luego redirige al admin
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <Outlet />;
}
