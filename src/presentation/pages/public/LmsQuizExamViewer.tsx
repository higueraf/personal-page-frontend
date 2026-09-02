/**
 * LmsQuizExamViewer.tsx
 * Vista aislada (sin TopNav/Footer, ruta hermana de PublicLayout — ver
 * router.tsx) para cuestionarios/exámenes del LMS con `config.requireSeb`.
 * Nivel de aislamiento "básico": pantalla completa + bloqueo de "atrás" +
 * aviso al salir de pantalla completa. A diferencia del Playground, no hay
 * registro de incidentes de seguridad ni auto-bloqueo — ver plan.
 */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Maximize2 } from "lucide-react";
import { lmsUseCases } from "../../../infrastructure/factories/lms-module.factory";
import { QuizAttemptForm } from "./QuizAttemptForm";
import { Button } from "@/presentation/components/ui/button";

export default function LmsQuizExamViewer() {
  const { activityId } = useParams<{ activityId: string }>();
  const navigate = useNavigate();
  const [isOutOfFullscreen, setIsOutOfFullscreen] = useState(false);
  const exitingRef = useRef(false);

  const q = useQuery({
    queryKey: ["lms-activity", activityId],
    queryFn: () => lmsUseCases.getActivity(activityId!),
    enabled: !!activityId,
  });

  useEffect(() => {
    const enterFullscreen = () => {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    };
    enterFullscreen();
    document.addEventListener("click", enterFullscreen, { once: true });

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (exitingRef.current) return;
      const msg = "Estás resolviendo un cuestionario. ¿Seguro que deseas salir?";
      e.returnValue = msg;
      return msg;
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => {
      if (exitingRef.current) return;
      window.history.pushState(null, "", window.location.href);
    };
    window.addEventListener("popstate", handlePopState);

    const handleFullscreenChange = () => {
      setIsOutOfFullscreen(!document.fullscreenElement && !exitingRef.current);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("click", enterFullscreen);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  function exitExam() {
    if (!window.confirm("¿Salir del cuestionario y volver al curso?")) return;
    exitingRef.current = true;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    navigate(courseSlug ? `/lms/${courseSlug}` : "/lms/mis-cursos");
  }

  if (q.isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">Cargando…</div>;
  }
  if (!q.data) {
    return <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">Actividad no encontrada.</div>;
  }

  const { activity, course_slug: courseSlug } = q.data;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {isOutOfFullscreen && createPortal(
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-4 bg-background/95 p-8 text-center">
          <Maximize2 size={40} className="text-primary" />
          <h2 className="font-display text-xl font-bold text-foreground">Debés permanecer en pantalla completa</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Este cuestionario requiere modo pantalla completa. Volvé a activarlo para continuar.
          </p>
          <Button onClick={() => document.documentElement.requestFullscreen().catch(() => {})}>
            Volver a pantalla completa
          </Button>
        </div>,
        document.body,
      )}

      <header className="flex items-center justify-between border-b border-border px-6 py-3">
        <div>
          <h1 className="font-display text-lg font-semibold text-foreground">{activity.title}</h1>
          {activity.due_at && (
            <p className="text-xs text-muted-foreground">Fecha límite: {new Date(activity.due_at).toLocaleString()}</p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={exitExam}>Salir</Button>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8">
        {activity.instructions && <p className="mb-6 whitespace-pre-wrap text-muted-foreground">{activity.instructions}</p>}
        <QuizAttemptForm activity={activity} />
      </main>
    </div>
  );
}
