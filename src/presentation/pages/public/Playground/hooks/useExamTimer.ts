import { useEffect } from "react";
import { playgroundUseCases } from "../../../../../infrastructure/factories/playground-module.factory";
import { useAuth } from "../../../../store/auth.store";
import { usePlaygroundStore } from "../store/playgroundStore";

interface UseExamTimerParams {
  isExam: boolean;
  isReadOnly: boolean;
  id: string | undefined;
  endTimeRef: React.MutableRefObject<Date | null>;
  clockOffsetRef: React.MutableRefObject<number>;
  examFinishedRef: React.MutableRefObject<boolean>;
  handleSaveRef: React.MutableRefObject<() => Promise<boolean>>;
}

export function useExamTimer({
  isExam,
  isReadOnly,
  id,
  endTimeRef,
  clockOffsetRef,
  examFinishedRef,
  handleSaveRef,
}: UseExamTimerParams) {
  const { setReadOnly } = usePlaygroundStore();

  // ── Exam Timer: auto-submit when end_time is reached ───────────────────────
  useEffect(() => {
    if (!isExam || isReadOnly) return;

    const checkTimer = () => {
      if (!endTimeRef.current) return;
      const correctedNow = Date.now() + clockOffsetRef.current;
      if (correctedNow >= endTimeRef.current.getTime()) {
        // Time's up — save current state then submit
        examFinishedRef.current = true;
        if (id) {
          // handleSave() never rejects (returns false on failure) — submit
          // regardless so the exam is recorded even if the last save failed.
          handleSaveRef.current().finally(() => {
            playgroundUseCases.submit(id).catch(() => {});
          }).finally(() => {
            useAuth.getState().clearActiveExam();
          });
        }
        setReadOnly(true);
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
      }
    };

    const interval = setInterval(checkTimer, 15_000); // check every 15s
    return () => clearInterval(interval);
  }, [isExam, isReadOnly, id]);

  // ── Exam auto-save every 5 minutes ──────────────────────────────────────────
  // Uses handleSaveRef (not handleSave directly) so the interval isn't torn down
  // and recreated on every keystroke (handleSave changes whenever `files` does,
  // which was resetting this timer constantly and made it effectively never fire).
  useEffect(() => {
    if (!isExam || isReadOnly) return;
    const interval = setInterval(() => { handleSaveRef.current(); }, 5 * 60_000);
    return () => clearInterval(interval);
  }, [isExam, isReadOnly]);
}
