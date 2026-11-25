import { useCallback, useState } from "react";
import { playgroundUseCases } from "../../../../../infrastructure/factories/playground-module.factory";
import { examUseCases } from "../../../../../infrastructure/factories/exam-module.factory";

interface UseAdminReviewParams {
  id: string | undefined;
  grade: number | "";
  feedback: string;
  setSecurityLocked: (locked: boolean) => void;
}

export function useAdminReview({ id, grade, feedback, setSecurityLocked }: UseAdminReviewParams) {
  const [savingGrade, setSavingGrade] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyList, setHistoryList] = useState<{ id: string; created_at: string; file_count: number }[]>([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState<{ id: string; created_at: string; files: any[] } | null>(null);
  const [unlocking, setUnlocking] = useState(false);

  // ── Admin: change history (snapshots) ───────────────────────────────────────
  const handleOpenHistory = useCallback(async () => {
    if (!id) return;
    setShowHistory(true);
    setHistoryLoading(true);
    setSelectedSnapshot(null);
    try {
      const list = await playgroundUseCases.getProjectHistory(id);
      setHistoryList(list);
    } catch (err) {
      console.error("History load error:", err);
    } finally {
      setHistoryLoading(false);
    }
  }, [id]);

  const handleViewSnapshot = useCallback(async (snapshotId: string) => {
    if (!id) return;
    try {
      const snap = await playgroundUseCases.getProjectSnapshot(id, snapshotId);
      setSelectedSnapshot(snap);
    } catch (err) {
      console.error("Snapshot load error:", err);
    }
  }, [id]);

  const handleSaveGrade = useCallback(async () => {
    if (!id || grade === "") return;
    setSavingGrade(true);
    try {
      await examUseCases.gradeProject({ id, grade: Number(grade), feedback });
    } catch (err) {
      console.error("Grade save error:", err);
    } finally {
      setSavingGrade(false);
    }
  }, [id, grade, feedback]);

  // ── Admin: reactivar examen bloqueado por incidentes de seguridad ──────────
  const handleUnlockProject = useCallback(async () => {
    if (!id) return;
    setUnlocking(true);
    try {
      await playgroundUseCases.unlockProject(id);
      setSecurityLocked(false);
    } catch (err) {
      console.error("Unlock error:", err);
    } finally {
      setUnlocking(false);
    }
  }, [id, setSecurityLocked]);

  return {
    savingGrade,
    handleSaveGrade,
    showHistory,
    setShowHistory,
    historyLoading,
    historyList,
    selectedSnapshot,
    setSelectedSnapshot,
    handleOpenHistory,
    handleViewSnapshot,
    unlocking,
    handleUnlockProject,
  };
}
