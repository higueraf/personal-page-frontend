import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../store/auth.store";

const ALWAYS_ALLOWED = ["/seb-quit", "/exam-login"];

/**
 * Top-level lockdown gate. Once the logged-in student's active exam that
 * requires Safe Exam Browser (`activeExam.requireSeb`) has actually started
 * (`startTime` reached, or no `startTime` set at all), every route other
 * than that exam's own IDE (and the SEB quit/login pages) is force-redirected
 * back into the exam — there is no way to reach any other platform page
 * (admin, playground list, tutorials, etc.) until the exam is
 * submitted/expired, at which point `clearActiveExam()` lifts the lock.
 *
 * Before `startTime`, the exam is assigned but not yet open: students must
 * keep normal access to the rest of the platform (their other courses,
 * tutorials) right up until the exam window begins — the teacher can assign
 * the exam well ahead of time without locking everyone out early.
 */
export function ExamLockGate() {
  const { activeExam } = useAuth();
  const location = useLocation();

  const examHasStarted = !activeExam?.startTime || new Date(activeExam.startTime).getTime() <= Date.now();

  if (activeExam?.requireSeb && examHasStarted) {
    const examPath = `/playground/${activeExam.id}`;
    const allowed = location.pathname === examPath
      || ALWAYS_ALLOWED.includes(location.pathname);
    if (!allowed) {
      return <Navigate to={examPath} replace />;
    }
  }

  return <Outlet />;
}
