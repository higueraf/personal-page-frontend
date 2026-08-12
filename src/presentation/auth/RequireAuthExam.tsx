import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../store/auth.store";

/**
 * Guard for the playground/exam routes. Behaves like `RequireAuth`, except
 * that when the visitor is running inside Safe Exam Browser (SEB) and isn't
 * authenticated yet, it redirects to the minimal `/exam-login` screen
 * instead of the regular `/login` (which exposes links to the rest of the
 * platform).
 */
export function RequireAuthExam() {
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
    const isInSEB = typeof (window as any).SafeExamBrowser !== "undefined"
      || navigator.userAgent.includes("SEB");
    if (isInSEB) {
      return <Navigate to="/exam-login" replace />;
    }
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <Outlet />;
}
