/**
 * QuizAttemptForm.tsx
 * Renderizado de preguntas + envío de un intento de quiz/examen. Extraído de
 * `LmsActivityViewer.tsx` para poder reutilizarlo tanto en la vista embebida
 * normal como en `LmsQuizExamViewer.tsx` (vista aislada a pantalla completa
 * para actividades con `config.requireSeb`).
 */

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { lmsUseCases } from "../../../infrastructure/factories/lms-module.factory";
import type { LmsActivity } from "../../../domain/entities/lms.entity";
import { Button } from "@/presentation/components/ui/button";
import { Card, CardContent } from "@/presentation/components/ui/card";
import { Badge } from "@/presentation/components/ui/badge";
import { Textarea } from "@/presentation/components/ui/textarea";

export function QuizAttemptForm({ activity }: { activity: LmsActivity }) {
  const qc = useQueryClient();
  const [answers, setAnswers] = useState<Record<string, { selected_option_id?: string; selected_option_ids?: string[]; text_answer?: string }>>({});
  const [retrying, setRetrying] = useState(false);

  const questionsQ = useQuery({
    queryKey: ["lms-quiz-questions", activity.id],
    queryFn: () => lmsUseCases.listQuestionsForStudent(activity.id),
  });
  const attemptsQ = useQuery({
    queryKey: ["lms-quiz-attempts", activity.id],
    queryFn: () => lmsUseCases.myQuizAttempts(activity.id),
  });

  const submitM = useMutation({
    mutationFn: () => lmsUseCases.submitQuizAttempt(activity.id, {
      answers: Object.entries(answers).map(([question_id, a]) => ({ question_id, ...a })),
    }),
    onSuccess: () => {
      toast.success("Cuestionario entregado correctamente.");
      setAnswers({});
      setRetrying(false);
      qc.invalidateQueries({ queryKey: ["lms-quiz-attempts", activity.id] });
    },
  });
  const submitError = submitM.isError
    ? (submitM.error as any)?.response?.data?.message || "No se pudo entregar el cuestionario. Intenta de nuevo."
    : null;

  // Sin configurar, se mantiene el histórico de 1 solo intento; 0 o negativo = ilimitados.
  const attemptsAllowed = activity.config?.attempts_allowed ?? 1;
  const attempts = attemptsQ.data ?? [];
  const attemptsUsed = attempts.length;
  const canRetry = attemptsAllowed <= 0 || attemptsUsed < attemptsAllowed;
  const attemptsLabel = attemptsAllowed <= 0 ? `Intento ${attemptsUsed + 1} (ilimitados)` : `Intento ${Math.min(attemptsUsed + 1, attemptsAllowed)} de ${attemptsAllowed}`;

  const lastAttempt = attempts[0];
  if (lastAttempt && !retrying) {
    const graded = lastAttempt.score != null;
    return (
      <Card>
        <CardContent className="p-5">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge>{graded ? "Resultado" : "Entregado"}</Badge>
            {graded ? (
              <span className="font-semibold text-foreground">{lastAttempt.score} pts</span>
            ) : (
              <span className="text-sm text-muted-foreground">Pendiente de revisión</span>
            )}
            {attemptsAllowed !== 1 && (
              <span className="text-xs text-muted-foreground">
                {attemptsAllowed <= 0 ? `${attemptsUsed} intento(s)` : `${attemptsUsed} de ${attemptsAllowed} intento(s)`}
              </span>
            )}
          </div>
          {lastAttempt.answers ? (
            <div className="flex flex-col gap-3">
              {lastAttempt.answers.map((a) => (
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
          ) : (
            <p className="text-sm text-muted-foreground">El profesor no habilitó ver el detalle de las respuestas para este cuestionario.</p>
          )}
          {canRetry && (
            <Button variant="outline" className="mt-4" onClick={() => setRetrying(true)}>
              Intentar de nuevo
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  const questions = questionsQ.data ?? [];
  return (
    <form className="flex flex-col gap-5" onSubmit={(e) => { e.preventDefault(); submitM.mutate(); }}>
      {attemptsAllowed !== 1 && questions.length > 0 && (
        <p className="text-xs font-medium text-muted-foreground">{attemptsLabel}</p>
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
          {retrying && (
            <Button type="button" variant="ghost" onClick={() => setRetrying(false)}>Cancelar</Button>
          )}
        </div>
      )}
      {questions.length === 0 && !questionsQ.isLoading && (
        <p className="text-sm text-muted-foreground">Este cuestionario todavía no tiene preguntas.</p>
      )}
    </form>
  );
}
