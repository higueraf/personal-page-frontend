import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { playgroundUseCases } from "../../../../../infrastructure/factories/playground-module.factory";
import { DEFAULT_TIMEZONE_OFFSET_MINUTES } from "../../../../lib/timezone";
import { useAuth } from "../../../../store/auth.store";
import { usePlaygroundStore, type Language } from "../store/playgroundStore";

export function useProjectLoader(id: string | undefined, isAdminReview: boolean) {
  const navigate = useNavigate();
  const { initProject, openFile } = usePlaygroundStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Admin-review only: student identity + inline grading panel state
  const [studentUser, setStudentUser] = useState<{ first_name: string; last_name: string; email: string } | null>(null);
  const [grade, setGrade] = useState<number | "">("");
  const [feedback, setFeedback] = useState("");

  // Store end_time for the timer — state drives Toolbar re-render, ref drives auto-submit closure
  const [endTime, setEndTime] = useState<Date | null>(null);
  const endTimeRef = useRef<Date | null>(null);

  // Exam's own configured timezone (never the browser's local timezone) — used to
  // display snapshot history timestamps and any other exam-related dates.
  const [examTimezoneOffset, setExamTimezoneOffset] = useState<number>(DEFAULT_TIMEZONE_OFFSET_MINUTES);

  // Clock offset (ms) = serverTime - clientTime, computed at exam load.
  // Corrects for machines whose system clock is not synced.
  const clockOffsetRef = useRef<number>(0);

  useEffect(() => {
    if (!id) {
      navigate("/playground");
      return;
    }

    setLoading(true);
    setError(null);

    // Fetch project data and server time in parallel so we can correct the
    // student's system clock for exam timer comparisons.
    Promise.all([
      playgroundUseCases.get(id),
      playgroundUseCases.getServerTime(),
    ])
      .then(([data, serverTime]) => {
        // Compute clock offset: positive means client is behind server
        if (serverTime) {
          clockOffsetRef.current = new Date(serverTime).getTime() - Date.now();
        }

        setStudentUser(data.user ?? null);
        setGrade(data.grade ?? "");
        setFeedback(data.feedback ?? "");
        setExamTimezoneOffset(data.timezone_offset_minutes ?? DEFAULT_TIMEZONE_OFFSET_MINUTES);

        let readOnlyNow = isAdminReview;

        if (data.is_exam && !isAdminReview) {
          if (data.status === 'submitted' || data.status === 'graded' || data.security_locked) {
            if (data.status === 'submitted' || data.status === 'graded') useAuth.getState().clearActiveExam();
            readOnlyNow = true;
          } else {
            // Use server-corrected time for the expiry check
            const correctedNow = Date.now() + clockOffsetRef.current;
            if (data.end_time && correctedNow > new Date(data.end_time).getTime()) {
              playgroundUseCases.submit(id).catch(() => {});
              useAuth.getState().clearActiveExam();
              readOnlyNow = true;
            } else {
              // Store end_time for the live timer
              const et = data.end_time ? new Date(data.end_time) : null;
              endTimeRef.current = et;
              setEndTime(et);
            }
          }
        }

        const projectFiles = (data.files ?? []).map((f: any) => ({
          id: f.id ?? f.name,
          name: f.name,
          content: f.content ?? "",
          language: f.language ?? "plaintext",
          path: f.path ?? `/${f.name}`,
          is_folder: f.is_folder ?? false,
          file_type: f.file_type ?? "code",
          external_url: f.external_url ?? null,
        }));
        initProject(
          data.id,
          data.name ?? "Proyecto",
          (data.language ?? "python") as Language,
          data.is_exam ?? false,
          data.allow_copy_paste ?? true,
          data.require_seb ?? false,
          projectFiles,
          readOnlyNow,
          data.security_locked ?? false
        );
        // Auto-open: el enunciado (ENUNCIADO.md/.pdf) primero si existe — el orden en que la DB
        // devuelve `files` no está garantizado, así que no basta con tomar "el primer archivo".
        const enunciado = projectFiles.find((f: any) => !f.is_folder && /^ENUNCIADO\.(md|pdf)$/i.test(f.name));
        const firstCode = enunciado ?? projectFiles.find((f: any) => !f.is_folder);
        if (firstCode) openFile(firstCode.id);
      })
      .catch((err) => {
        setError(
          err?.response?.data?.message ?? "No se pudo cargar el proyecto"
        );
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return {
    loading,
    error,
    studentUser,
    grade,
    setGrade,
    feedback,
    setFeedback,
    examTimezoneOffset,
    endTime,
    endTimeRef,
    clockOffsetRef,
  };
}
