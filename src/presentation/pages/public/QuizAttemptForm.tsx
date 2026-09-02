/**
 * QuizAttemptForm.tsx
 * Renderizado de preguntas + envío de un intento de quiz/examen. Extraído de
 * `LmsActivityViewer.tsx` para poder reutilizarlo tanto en la vista embebida
 * normal como en `LmsQuizExamViewer.tsx` (vista aislada a pantalla completa
 * para actividades con `config.requireSeb`).
 */

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { lmsUseCases } from "../../../infrastructure/factories/lms-module.factory";
import type { LmsActivity } from "../../../domain/entities/lms.entity";
import { Button } from "@/presentation/components/ui/button";
import { Card, CardContent } from "@/presentation/components/ui/card";
import { Badge } from "@/presentation/components/ui/badge";
import { Textarea } from "@/presentation/components/ui/textarea";

export function QuizAttemptForm({ activity }: { activity: LmsActivity }) {
  const qc = useQueryClient();
  const [answers, setAnswers] = useState<Record<string, { selected_option_id?: string; selected_option_ids?: string[]; text_answer?: string }>>({});

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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lms-quiz-attempts", activity.id] }),
  });
  const submitError = submitM.isError
    ? (submitM.error as any)?.response?.data?.message || "No se pudo entregar el cuestionario. Intenta de nuevo."
    : null;

  const lastAttempt = (attemptsQ.data ?? [])[0];
  if (lastAttempt?.answers) {
    return (
      <Card>
        <CardContent className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <Badge>Resultado</Badge>
            <span className="font-semibold text-foreground">{lastAttempt.score ?? "—"} pts</span>
          </div>
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
        </CardContent>
      </Card>
    );
  }

  const questions = questionsQ.data ?? [];
  return (
    <form className="flex flex-col gap-5" onSubmit={(e) => { e.preventDefault(); submitM.mutate(); }}>
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
        <Button type="submit" className="self-start" disabled={submitM.isPending}>
          {submitM.isPending ? "Enviando…" : "Entregar"}
        </Button>
      )}
      {questions.length === 0 && !questionsQ.isLoading && (
        <p className="text-sm text-muted-foreground">Este cuestionario todavía no tiene preguntas.</p>
      )}
    </form>
  );
}
