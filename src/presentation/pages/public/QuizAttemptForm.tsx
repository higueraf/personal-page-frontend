/**
 * QuizAttemptForm.tsx
 * Renderizado de preguntas + envío de un intento de quiz/examen. Extraído de
 * `LmsActivityViewer.tsx` para poder reutilizarlo tanto en la vista embebida
 * normal como en `LmsQuizExamViewer.tsx` (vista aislada a pantalla completa
 * para actividades con `config.requireSeb`).
 *
 * Consultar intentos ya entregados nunca requiere pantalla completa: el
 * resumen de intentos (lista + detalle de respuestas) siempre se muestra
 * inline. Solo iniciar o continuar un intento activo puede requerir el modo
 * aislado — para eso, quien use este componente en un contexto con
 * `requireSeb` pasa `onRequireStart`, que se invoca en vez de arrancar el
 * intento localmente (la vista aislada vuelve a renderizar este mismo
 * componente, sin esa prop, para responder ahí).
 */

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { lmsUseCases } from "../../../infrastructure/factories/lms-module.factory";
import type { LmsActivity, LmsQuizAttempt } from "../../../domain/entities/lms.entity";
import { Button } from "@/presentation/components/ui/button";
import { Card, CardContent } from "@/presentation/components/ui/card";
import { Badge } from "@/presentation/components/ui/badge";
import { Textarea } from "@/presentation/components/ui/textarea";

function formatDateTime(value: string | null) {
  return value ? new Date(value).toLocaleString() : null;
}

export function QuizAttemptForm({ activity, onRequireStart }: { activity: LmsActivity; onRequireStart?: () => void }) {
  const qc = useQueryClient();
  const [answers, setAnswers] = useState<Record<string, { selected_option_id?: string; selected_option_ids?: string[]; text_answer?: string }>>({});
  const [answering, setAnswering] = useState(false);
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);

  const questionsQ = useQuery({
    queryKey: ["lms-quiz-questions", activity.id],
    queryFn: () => lmsUseCases.listQuestionsForStudent(activity.id),
    enabled: answering,
  });
  const attemptsQ = useQuery({
    queryKey: ["lms-quiz-attempts", activity.id],
    queryFn: () => lmsUseCases.myQuizAttempts(activity.id),
  });

  const startM = useMutation({
    mutationFn: () => lmsUseCases.startQuizAttempt(activity.id),
    onSuccess: () => {
      setAnswers({});
      setAnswering(true);
      qc.invalidateQueries({ queryKey: ["lms-quiz-attempts", activity.id] });
    },
  });
  const startError = startM.isError
    ? (startM.error as any)?.response?.data?.message || "No se pudo iniciar el cuestionario. Intenta de nuevo."
    : null;

  const submitM = useMutation({
    mutationFn: () => lmsUseCases.submitQuizAttempt(activity.id, {
      answers: Object.entries(answers).map(([question_id, a]) => ({ question_id, ...a })),
    }),
    onSuccess: () => {
      toast.success("Cuestionario entregado correctamente.");
      setAnswers({});
      setAnswering(false);
      setSelectedAttemptId(null);
      qc.invalidateQueries({ queryKey: ["lms-quiz-attempts", activity.id] });
    },
  });
  const submitError = submitM.isError
    ? (submitM.error as any)?.response?.data?.message || "No se pudo entregar el cuestionario. Intenta de nuevo."
    : null;

  // Sin configurar, se mantiene el histórico de 1 solo intento; 0 o negativo = ilimitados.
  const attemptsAllowed = activity.config?.attempts_allowed ?? 1;
  const attempts = attemptsQ.data ?? [];
  const usedCount = attempts.length;
  const inProgress = attempts.find((a) => !a.submitted_at);
  const canStartNew = !inProgress && (attemptsAllowed <= 0 || usedCount < attemptsAllowed);

  function handleStartOrContinue() {
    if (onRequireStart) { onRequireStart(); return; }
    startM.mutate();
  }

  if (answering) {
    const questions = questionsQ.data ?? [];
    return (
      <form className="flex flex-col gap-5" onSubmit={(e) => { e.preventDefault(); submitM.mutate(); }}>
        {attemptsAllowed !== 1 && (
          <p className="text-xs font-medium text-muted-foreground">
            {attemptsAllowed <= 0 ? `Intento ${usedCount} (ilimitados)` : `Intento ${Math.min(usedCount, attemptsAllowed)} de ${attemptsAllowed}`}
          </p>
        )}
        {questions.map((q) => (
          <Card key={q.id}>
            <CardContent className="p-4">
              <p className="mb-3 text-sm font-medium text-foreground">{q.text}</p>
              {q.type === "MULTIPLE_CHOICE" && (
                <div className="flex flex-col gap-2">
                  {q.options.map((o) => (
                    <label key={o.id} className="flex items-center gap-2 text-sm text-foreground">
                      <input
                        type="radio"
                        name={q.id}
                        className="h-4 w-4 accent-primary"
                        checked={answers[q.id]?.selected_option_id === o.id}
                        onChange={() => setAnswers((a) => ({ ...a, [q.id]: { selected_option_id: o.id } }))}
                      />
                      {o.text}
                    </label>
                  ))}
                </div>
              )}
              {q.type === "MULTI_ANSWER" && (
                <div className="flex flex-col gap-2">
                  {q.options.map((o) => {
                    const selected = answers[q.id]?.selected_option_ids ?? [];
                    return (
                      <label key={o.id} className="flex items-center gap-2 text-sm text-foreground">
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-primary"
                          checked={selected.includes(o.id)}
                          onChange={(e) => setAnswers((a) => ({
                            ...a,
                            [q.id]: { selected_option_ids: e.target.checked ? [...selected, o.id] : selected.filter((id) => id !== o.id) },
                          }))}
                        />
                        {o.text}
                      </label>
                    );
                  })}
                </div>
              )}
              {q.type === "OPEN" && (
                <Textarea
                  rows={3}
                  value={answers[q.id]?.text_answer ?? ""}
                  onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: { text_answer: e.target.value } }))}
                />
              )}
            </CardContent>
          </Card>
        ))}
        {submitError && <p className="text-sm text-destructive">{submitError}</p>}
        {questions.length > 0 && (
          <div className="flex items-center gap-2">
            <Button type="submit" disabled={submitM.isPending}>
              {submitM.isPending ? "Enviando…" : "Entregar"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setAnswering(false)}>Cancelar</Button>
          </div>
        )}
        {questions.length === 0 && !questionsQ.isLoading && (
          <p className="text-sm text-muted-foreground">Este cuestionario todavía no tiene preguntas.</p>
        )}
      </form>
    );
  }

  const selectedAttempt: LmsQuizAttempt | undefined =
    attempts.find((a) => a.id === selectedAttemptId) ?? (attempts.length === 1 ? attempts[0] : undefined);

  return (
    <div className="flex flex-col gap-4">
      {attempts.length > 0 && (
        <Card>
          <CardContent className="flex flex-col gap-3 p-5">
            {attempts.length > 1 && (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium text-muted-foreground">Intentos</p>
                {attempts.map((a, idx) => {
                  const number = attempts.length - idx;
                  const graded = a.score != null;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setSelectedAttemptId(a.id)}
                      className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                        selectedAttemptId === a.id ? "border-primary" : "border-border hover:border-primary/40"
                      }`}
                    >
                      <span className="text-foreground">
                        Intento {number}
                        {!a.submitted_at && <span className="ml-2 text-xs text-muted-foreground">En progreso</span>}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {a.submitted_at
                          ? (graded ? `${a.score} pts` : "En revisión")
                          : (formatDateTime(a.started_at) ?? "")}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {selectedAttempt && (
              <div className="flex flex-col gap-3 border-t border-border pt-3 first:border-0 first:pt-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{selectedAttempt.score != null ? "Resultado" : selectedAttempt.submitted_at ? "Entregado" : "En progreso"}</Badge>
                  {selectedAttempt.score != null && <span className="font-semibold text-foreground">{selectedAttempt.score} pts</span>}
                  {selectedAttempt.submitted_at && selectedAttempt.score == null && (
                    <span className="text-sm text-muted-foreground">Pendiente de revisión</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Inicio: {formatDateTime(selectedAttempt.started_at) ?? "—"}
                  {selectedAttempt.submitted_at && <> · Entrega: {formatDateTime(selectedAttempt.submitted_at)}</>}
                </p>
                {selectedAttempt.answers ? (
                  <div className="flex flex-col gap-3">
                    {selectedAttempt.answers.map((a) => (
                      <div key={a.question_id} className="rounded-lg border border-border p-3">
                        <p className="text-sm font-medium text-foreground">{a.question_text}</p>
                        {a.is_correct !== undefined && (
                          <p className={`mt-1 text-xs font-medium ${a.is_correct ? "text-emerald-600" : "text-destructive"}`}>
                            {a.is_correct ? "Correcta" : "Incorrecta"}
                          </p>
                        )}
                        {a.feedback && <p className="mt-1 text-xs text-muted-foreground">{a.feedback}</p>}
                      </div>
                    ))}
                  </div>
                ) : selectedAttempt.submitted_at ? (
                  <p className="text-sm text-muted-foreground">El profesor no habilitó ver el detalle de las respuestas para este cuestionario.</p>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {startError && <p className="text-sm text-destructive">{startError}</p>}

      {inProgress ? (
        <div>
          {onRequireStart && (
            <p className="mb-2 text-sm text-muted-foreground">
              Este cuestionario requiere modo pantalla completa (Safe Exam Browser). Se abrirá en una
              vista aislada, sin el resto del sitio, hasta que lo entregues.
            </p>
          )}
          <Button onClick={handleStartOrContinue} disabled={startM.isPending}>
            {startM.isPending ? "Cargando…" : "Continuar cuestionario"}
          </Button>
        </div>
      ) : canStartNew ? (
        <div>
          {onRequireStart && (
            <p className="mb-2 text-sm text-muted-foreground">
              Este cuestionario requiere modo pantalla completa (Safe Exam Browser). Se abrirá en una
              vista aislada, sin el resto del sitio, hasta que lo entregues.
            </p>
          )}
          <Button onClick={handleStartOrContinue} disabled={startM.isPending}>
            {startM.isPending ? "Cargando…" : attempts.length === 0 ? "Iniciar cuestionario" : "Iniciar nuevo intento"}
          </Button>
        </div>
      ) : attempts.length > 1 && !selectedAttempt ? (
        <Button variant="outline" onClick={() => setSelectedAttemptId(attempts[0].id)}>Consultar respuestas</Button>
      ) : attempts.length === 0 ? (
        <p className="text-sm text-muted-foreground">Este cuestionario todavía no tiene preguntas o no está disponible.</p>
      ) : null}
    </div>
  );
}
