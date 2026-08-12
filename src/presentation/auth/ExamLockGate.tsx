import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../store/auth.store";

const ALWAYS_ALLOWED = ["/seb-quit", "/exam-login"];

/**
 * Top-level lockdown gate. While the logged-in student has an active exam
 * that requires Safe Exam Browser (`activeExam.requireSeb`), every route
 * other than that exam's own IDE (and the SEB quit/login pages) is
 * force-redirected back into the exam — there is no way to reach any other
 * platform page (admin, playground list, tutorials, etc.) until the exam is
 * submitted/expired, at which point `clearActiveExam()` lifts the lock.
 */
export function ExamLockGate() {
  const { activeExam } = useAuth();
  const location = useLocation();

  if (activeExam?.requireSeb) {
    const examPath = `/playground/${activeExam.id}`;
    const allowed = location.pathname === examPath
      || ALWAYS_ALLOWED.includes(location.pathname);
    if (!allowed) {
      return <Navigate to={examPath} replace />;
    }
  }

  return <Outlet />;
}
