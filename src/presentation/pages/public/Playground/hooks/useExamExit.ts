import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { playgroundUseCases } from "../../../../../infrastructure/factories/playground-module.factory";
import { useAuth } from "../../../../store/auth.store";
import { usePlaygroundStore } from "../store/playgroundStore";

interface UseExamExitParams {
  id: string | undefined;
  isInSEB: boolean;
  examFinishedRef: React.MutableRefObject<boolean>;
  handleSave: () => Promise<boolean>;
}

export function useExamExit({ id, isInSEB, examFinishedRef, handleSave }: UseExamExitParams) {
  const navigate = useNavigate();
  const { setReadOnly, setSecurityLocked } = usePlaygroundStore();

  const [retryingUnlock, setRetryingUnlock] = useState(false);
  const [exitingExam, setExitingExam] = useState(false);

  // ── Handle exam submitted callback (from Toolbar) ──────────────────────────
  const handleExamSubmitted = useCallback(() => {
    examFinishedRef.current = true;
    setReadOnly(true);
    useAuth.getState().clearActiveExam();
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }, [setReadOnly]);

  // ── Alumno: reintentar el bloqueo (por si el profesor ya lo reactivó) ──────
  const handleRetryUnlock = useCallback(async () => {
    if (!id) return;
    setRetryingUnlock(true);
    try {
      const data = await playgroundUseCases.get(id);
      const stillLocked = data.security_locked ?? false;
      setSecurityLocked(stillLocked);
      if (!stillLocked) setReadOnly(data.status === "submitted" || data.status === "graded");
    } catch (err) {
      console.error("Retry unlock check failed:", err);
    } finally {
      setRetryingUnlock(false);
    }
  }, [id, setSecurityLocked, setReadOnly]);

  // ── Alumno: salir de un examen bloqueado (se entrega tal cual está y libera al alumno) ──
  // Entrega lo que tenga guardado (igual que la entrega automática por tiempo agotado),
  // limpia `activeExam` del store de auth para que ExamLockGate deje de forzarlo de vuelta
  // acá en cualquier otra ruta, y sale de Safe Exam Browser si está dentro. Si vuelve a
  // entrar a este mismo examen, ya está "submitted" y lo verá en modo solo lectura.
  const handleExitExam = useCallback(async () => {
    if (!id) return;
    if (!window.confirm("¿Salir del examen? Se entregará con lo que tengas guardado hasta ahora y no podrás seguir editando.")) return;
    examFinishedRef.current = true;
    setExitingExam(true);
    try {
      await playgroundUseCases.submit(id);
    } catch (err) {
      console.error("Exit exam submit failed:", err);
    } finally {
      useAuth.getState().clearActiveExam();
      if (isInSEB) {
        window.location.href = "/seb-quit";
      } else {
        navigate("/", { replace: true });
      }
    }
  }, [id, isInSEB, navigate]);

  // ── Alumno: salir SIN entregar — la válvula de escape que SIEMPRE debe funcionar, incluso
  // cuando el examen está en un estado bloqueado (require_seb fuera de SEB real, editor
  // bloqueado por incidentes, un guardado que sigue fallando, etc.). Intenta guardar lo último
  // como último recurso (ignorando el error si falla — es justamente lo que puede estar roto),
  // y siempre deja constancia en el proyecto de que salió sin terminar, sin cambiar su estado de
  // entrega, antes de sacar al alumno de la pantalla del examen.
  const handleExitWithoutSubmit = useCallback(async () => {
    if (!id) return;
    if (
      !window.confirm(
        "¿Salir SIN entregar? Tu progreso guardado hasta ahora queda como está, pero el examen NO se entregará — tu profesor verá que saliste sin terminar. ¿Continuar?"
      )
    )
      return;
    examFinishedRef.current = true;
    setExitingExam(true);
    try {
      await handleSave();
    } catch (err) {
      console.error("Best-effort save before exiting without submit failed:", err);
    }
    try {
      await playgroundUseCases.exitWithoutSubmit(id);
    } catch (err) {
      console.error("exit-without-submit failed:", err);
    } finally {
      useAuth.getState().clearActiveExam();
      if (isInSEB) {
        window.location.href = "/seb-quit";
      } else {
        navigate("/", { replace: true });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isInSEB, navigate]);

  return {
    handleExamSubmitted,
    retryingUnlock,
    handleRetryUnlock,
    exitingExam,
    handleExitExam,
    handleExitWithoutSubmit,
  };
}
