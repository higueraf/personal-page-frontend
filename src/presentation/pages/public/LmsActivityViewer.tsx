/**
 * LmsActivityViewer.tsx
 * Consumo de una actividad por el alumno. El render del cuerpo depende de
 * `activity.type` (presentación / foro / tarea / quiz / examen) — agregar un
 * tipo nuevo solo requiere su propio sub-componente, sin tocar el resto.
 */

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft, CheckCircle2, ExternalLink, MessageSquare, Paperclip, Pin, Send, X,
} from "lucide-react";
import { lmsUseCases } from "../../../infrastructure/factories/lms-module.factory";
import type { LmsActivity, LmsForumThread, LmsSurveyAnswer } from "../../../domain/entities/lms.entity";
import { QuizAttemptForm } from "./QuizAttemptForm";
import { uploadUrl } from "../../store/auth.store";
import { Button } from "@/presentation/components/ui/button";
import { Card, CardContent } from "@/presentation/components/ui/card";
import { Badge } from "@/presentation/components/ui/badge";
import { Input } from "@/presentation/components/ui/input";
import { Textarea } from "@/presentation/components/ui/textarea";

export default function LmsActivityViewer() {
  const { activityId } = useParams<{ activityId: string }>();

  const q = useQuery({
    queryKey: ["lms-activity", activityId],
    queryFn: () => lmsUseCases.getActivity(activityId!),
    enabled: !!activityId,
  });

  if (q.isLoading) return <div className="mx-auto max-w-3xl px-6 py-10 text-muted-foreground">Cargando…</div>;
  if (!q.data) {
    const message = (q.error as any)?.response?.data?.message || "Actividad no encontrada.";
    return <div className="mx-auto max-w-3xl px-6 py-10 text-muted-foreground">{message}</div>;
  }

  const { activity, progress } = q.data;

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link to="/lms/mis-cursos" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft size={14} /> Volver a mis cursos
      </Link>

      <div className="mb-2 flex flex-wrap items-center gap-2">
        <h1 className="font-display text-2xl font-bold text-foreground">{activity.title}</h1>
        {progress.status === "COMPLETED" && (
          <Badge className="gap-1"><CheckCircle2 size={12} /> Completada</Badge>
        )}
      </div>
      {activity.starts_at && (
        <p className="mb-1 text-sm text-muted-foreground">Disponible desde: {new Date(activity.starts_at).toLocaleString()}</p>
      )}
      {activity.due_at && (
        <p className="mb-4 text-sm text-muted-foreground">Fecha límite: {new Date(activity.due_at).toLocaleString()}</p>
      )}
      {activity.instructions && <p className="mb-6 whitespace-pre-wrap text-muted-foreground">{activity.instructions}</p>}

      <ActivityBody activity={activity} completed={progress.status === "COMPLETED"} />
    </div>
  );
}

function ActivityBody({ activity, completed }: { activity: LmsActivity; completed: boolean }) {
  switch (activity.type) {
    case "presentation":
      return <PresentationBody activity={activity} completed={completed} />;
    case "forum":
      return <ForumBody activity={activity} />;
    case "assignment":
      return <AssignmentBody activity={activity} />;
    case "quiz":
      return <QuizBody activity={activity} />;
    case "exam":
      return <ExamBody activity={activity} />;
    case "survey":
      return <SurveyBody activity={activity} />;
    default:
      return <p className="text-sm text-muted-foreground">Este tipo de actividad ({activity.type}) no tiene una vista específica todavía.</p>;
  }
}

// ── Presentación ─────────────────────────────────────────────────────────────

function PresentationBody({ activity, completed }: { activity: LmsActivity; completed: boolean }) {
  const qc = useQueryClient();
  const completeM = useMutation({
    mutationFn: () => lmsUseCases.markActivityComplete(activity.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lms-activity", activity.id] }),
  });

  return (
    <div className="flex flex-col gap-4">
      {activity.config?.embed_url && (
        <div className="aspect-video overflow-hidden rounded-lg border border-border">
          <iframe src={activity.config.embed_url} className="h-full w-full" allowFullScreen title={activity.title} />
        </div>
      )}
      {activity.config?.file_url && (
        <Button asChild variant="outline" className="self-start">
          <a href={activity.config.file_url} target="_blank" rel="noopener noreferrer">
            <ExternalLink size={14} /> Abrir material
          </a>
        </Button>
      )}
      {!completed && (
        <Button onClick={() => completeM.mutate()} disabled={completeM.isPending} className="self-start">
          {completeM.isPending ? "Guardando…" : "Marcar como completada"}
        </Button>
      )}
    </div>
  );
}

// ── Foro ─────────────────────────────────────────────────────────────────────

function ForumBody({ activity }: { activity: LmsActivity }) {
  const qc = useQueryClient();
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [newThread, setNewThread] = useState({ title: "", body: "" });
  const [replyBody, setReplyBody] = useState("");

  const threadsQ = useQuery({
    queryKey: ["lms-forum-threads", activity.id],
    queryFn: () => lmsUseCases.listThreads(activity.id),
  });
  const threadQ = useQuery({
    queryKey: ["lms-forum-thread", selectedThreadId],
    queryFn: () => lmsUseCases.getThread(selectedThreadId!),
    enabled: !!selectedThreadId,
  });

  const createThreadM = useMutation({
    mutationFn: () => lmsUseCases.createThread({ activity: activity.id, ...newThread }),
    onSuccess: () => { setNewThread({ title: "", body: "" }); qc.invalidateQueries({ queryKey: ["lms-forum-threads", activity.id] }); },
  });
  const replyM = useMutation({
    mutationFn: () => lmsUseCases.createPost({ thread: selectedThreadId!, body: replyBody }),
    onSuccess: () => { setReplyBody(""); qc.invalidateQueries({ queryKey: ["lms-forum-thread", selectedThreadId] }); },
  });

  if (selectedThreadId && threadQ.data) {
    const thread = threadQ.data as LmsForumThread;
    return (
      <div>
        <Button variant="ghost" size="sm" className="mb-3" onClick={() => setSelectedThreadId(null)}>
          <ArrowLeft size={14} /> Volver al foro
        </Button>
        <Card className="mb-4">
          <CardContent className="p-4">
            <h3 className="font-display font-semibold text-foreground">{thread.title}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{thread.author?.first_name} {thread.author?.last_name}</p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{thread.body}</p>
          </CardContent>
        </Card>
        <div className="mb-4 flex flex-col gap-3">
          {(thread.posts ?? []).map((p) => (
            <div key={p.id} className="rounded-lg border border-border p-3">
              <p className="text-xs font-medium text-muted-foreground">{p.author?.first_name} {p.author?.last_name}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{p.body}</p>
            </div>
          ))}
        </div>
        {!thread.is_locked ? (
          <form className="flex flex-col gap-2" onSubmit={(e) => { e.preventDefault(); replyM.mutate(); }}>
            <Textarea rows={3} placeholder="Escribe una respuesta…" required value={replyBody} onChange={(e) => setReplyBody(e.target.value)} />
            <Button type="submit" size="sm" className="self-start" disabled={replyM.isPending}>
              <Send size={13} /> {replyM.isPending ? "Enviando…" : "Responder"}
            </Button>
          </form>
        ) : (
          <p className="text-sm text-muted-foreground">Este hilo está cerrado a nuevas respuestas.</p>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 flex flex-col gap-2">
        {(threadsQ.data ?? []).map((t) => (
          <button
            key={t.id}
            onClick={() => setSelectedThreadId(t.id)}
            className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2.5 text-left transition-colors hover:border-primary/40"
          >
            <div className="flex items-center gap-2">
              {t.is_pinned && <Pin size={13} className="text-primary" />}
              <div>
                <div className="text-sm font-medium text-foreground">{t.title}</div>
                <div className="text-xs text-muted-foreground">{t.author?.first_name} {t.author?.last_name}</div>
              </div>
            </div>
            {t.is_locked && <Badge variant="outline">Cerrado</Badge>}
          </button>
        ))}
        {(threadsQ.data ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">Sé el primero en abrir un hilo de discusión.</p>
        )}
      </div>

      <form
        className="flex flex-col gap-2 border-t border-border pt-4"
        onSubmit={(e) => { e.preventDefault(); createThreadM.mutate(); }}
      >
        <p className="text-sm font-medium text-foreground">Nuevo hilo</p>
        <Input placeholder="Título" required value={newThread.title} onChange={(e) => setNewThread((f) => ({ ...f, title: e.target.value }))} />
        <Textarea rows={3} placeholder="Escribe tu pregunta o comentario…" required value={newThread.body} onChange={(e) => setNewThread((f) => ({ ...f, body: e.target.value }))} />
        <Button type="submit" size="sm" className="self-start" disabled={createThreadM.isPending}>
          <MessageSquare size={13} /> {createThreadM.isPending ? "Publicando…" : "Publicar hilo"}
        </Button>
      </form>
    </div>
  );
}

// ── Tarea / examen manual ────────────────────────────────────────────────────

function AssignmentBody({ activity }: { activity: LmsActivity }) {
  const qc = useQueryClient();
  const [contentText, setContentText] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const subQ = useQuery({
    queryKey: ["lms-my-submission", activity.id],
    queryFn: () => lmsUseCases.mySubmission(activity.id),
  });

  const submitM = useMutation({
    mutationFn: () => lmsUseCases.submitAssignmentFiles(activity.id, {
      content_text: contentText || undefined,
      files: selectedFiles,
    }),
    onSuccess: () => {
      setSelectedFiles([]);
      qc.invalidateQueries({ queryKey: ["lms-my-submission", activity.id] });
    },
  });

  const submission = subQ.data;

  function renderFiles(files: NonNullable<typeof submission>["files"]) {
    if (!files?.length) return null;
    return (
      <ul className="mt-2 flex flex-col gap-1">
        {files.map((f) => (
          <li key={f.id}>
            <a href={uploadUrl(f.file_url)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary underline">
              <Paperclip size={13} /> {f.original_name}
            </a>
          </li>
        ))}
      </ul>
    );
  }

  if (submission?.status === "GRADED") {
    return (
      <Card>
        <CardContent className="p-5">
          <div className="mb-2 flex items-center gap-2">
            <Badge>Calificada</Badge>
            <span className="font-semibold text-foreground">{submission.grade} pts</span>
          </div>
          {submission.content_text && <p className="mb-2 whitespace-pre-wrap text-sm text-muted-foreground">{submission.content_text}</p>}
          {renderFiles(submission.files)}
          {submission.file_url && (
            <a href={submission.file_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm text-primary underline">Ver archivo entregado</a>
          )}
          {submission.feedback && (
            <div className="mt-3 rounded-lg bg-muted p-3 text-sm text-foreground">
              <p className="mb-1 text-xs font-semibold text-muted-foreground">Retroalimentación del profesor</p>
              {submission.feedback}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {submission && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Badge variant={submission.status === "LATE" ? "destructive" : "secondary"}>{submission.status}</Badge>
            <span className="text-xs text-muted-foreground">
              {submission.submitted_at && `Entregado el ${new Date(submission.submitted_at).toLocaleString()}`}
            </span>
          </div>
          {renderFiles(submission.files)}
          {submission.file_url && (
            <a href={submission.file_url} target="_blank" rel="noopener noreferrer" className="inline-block text-sm text-primary underline">Ver archivo entregado</a>
          )}
        </div>
      )}
      <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); submitM.mutate(); }}>
        <Textarea
          rows={5}
          placeholder="Escribe tu entrega…"
          value={contentText}
          onChange={(e) => setContentText(e.target.value)}
        />
        <div className="flex flex-col gap-2">
          <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-md border border-dashed border-border px-3 py-2 text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground">
            <Paperclip size={14} />
            Adjuntar archivo(s)
            <input
              type="file"
              multiple
              className="hidden"
              onChange={(e) => setSelectedFiles((prev) => [...prev, ...Array.from(e.target.files ?? [])])}
            />
          </label>
          {selectedFiles.length > 0 && (
            <ul className="flex flex-col gap-1">
              {selectedFiles.map((f, i) => (
                <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-2 rounded-md bg-muted px-2.5 py-1.5 text-xs text-foreground">
                  <span className="truncate">{f.name}</span>
                  <button type="button" onClick={() => setSelectedFiles((prev) => prev.filter((_, idx) => idx !== i))} className="shrink-0 text-muted-foreground hover:text-destructive">
                    <X size={13} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <Button type="submit" className="self-start" disabled={submitM.isPending}>
          {submitM.isPending ? "Enviando…" : submission ? "Reenviar entrega" : "Entregar"}
        </Button>
      </form>
    </div>
  );
}

// ── Quiz / examen autoevaluable ───────────────────────────────────────────────

function QuizBody({ activity }: { activity: LmsActivity }) {
  if (activity.config?.requireSeb) {
    return (
      <Card>
        <CardContent className="flex flex-col items-start gap-3 p-5">
          <p className="text-sm text-muted-foreground">
            Este cuestionario requiere modo pantalla completa (Safe Exam Browser). Se abrirá en una
            vista aislada, sin el resto del sitio, hasta que lo entregues.
          </p>
          <Button asChild>
            <Link to={`/lms/examen/${activity.id}`}>Iniciar cuestionario</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }
  return <QuizAttemptForm activity={activity} />;
}

// ── Examen (interno con quiz, manual, o redirección externa) ────────────────

function ExamBody({ activity }: { activity: LmsActivity }) {
  const mode = activity.config?.mode || "manual";
  if (mode === "quiz") return <QuizBody activity={activity} />;
  if (mode === "external") return <ExternalExamBody activity={activity} />;
  return <AssignmentBody activity={activity} />;
}

function ExternalExamBody({ activity }: { activity: LmsActivity }) {
  const qc = useQueryClient();
  const completeM = useMutation({
    mutationFn: () => lmsUseCases.markActivityComplete(activity.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lms-activity", activity.id] }),
  });

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">Este examen se resuelve en una plataforma externa.</p>
      {activity.config?.external_url && (
        <Button asChild className="self-start">
          <a href={activity.config.external_url} target="_blank" rel="noopener noreferrer">
            <ExternalLink size={14} /> Abrir examen externo
          </a>
        </Button>
      )}
      <Button variant="outline" className="self-start" onClick={() => completeM.mutate()} disabled={completeM.isPending}>
        {completeM.isPending ? "Guardando…" : "Ya resolví el examen"}
      </Button>
    </div>
  );
}

// ── Encuesta ─────────────────────────────────────────────────────────────────

function SurveyBody({ activity }: { activity: LmsActivity }) {
  const qc = useQueryClient();
  const [answers, setAnswers] = useState<Record<string, LmsSurveyAnswer>>({});

  const questionsQ = useQuery({
    queryKey: ["lms-survey-questions", activity.id],
    queryFn: () => lmsUseCases.listSurveyQuestionsForStudent(activity.id),
  });
  const responseQ = useQuery({
    queryKey: ["lms-my-survey-response", activity.id],
    queryFn: () => lmsUseCases.mySurveyResponse(activity.id),
  });

  const submitM = useMutation({
    mutationFn: () => lmsUseCases.submitSurveyResponse(activity.id, {
      answers: Object.entries(answers).map(([question_id, a]) => ({ ...a, question_id })),
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lms-my-survey-response", activity.id] }),
  });

  if (responseQ.data) {
    return (
      <Card>
        <CardContent className="p-5 text-sm text-muted-foreground">
          Ya respondiste esta encuesta
          {responseQ.data.submitted_at && ` el ${new Date(responseQ.data.submitted_at).toLocaleString()}`}. ¡Gracias por tu opinión!
        </CardContent>
      </Card>
    );
  }

  const questions = questionsQ.data ?? [];
  function updateAnswer(questionId: string, patch: Partial<LmsSurveyAnswer>) {
    setAnswers((a) => ({ ...a, [questionId]: { ...a[questionId], ...patch, question_id: questionId } }));
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={(e) => { e.preventDefault(); submitM.mutate(); }}>
      {questions.map((q) => (
        <Card key={q.id}>
          <CardContent className="p-4">
            <p className="mb-3 text-sm font-medium text-foreground">{q.text}</p>
            {q.type === "SINGLE_CHOICE" && (
              <div className="flex flex-col gap-2">
                {q.options.map((o) => (
                  <label key={o.id} className="flex items-center gap-2 text-sm text-foreground">
                    <input
                      type="radio"
                      name={q.id}
                      className="h-4 w-4 accent-primary"
                      checked={answers[q.id]?.selected_option_ids?.[0] === o.id}
                      onChange={() => updateAnswer(q.id, { selected_option_ids: [o.id] })}
                    />
                    {o.text}
                  </label>
                ))}
              </div>
            )}
            {q.type === "MULTIPLE_CHOICE" && (
              <div className="flex flex-col gap-2">
                {q.options.map((o) => {
                  const selected = answers[q.id]?.selected_option_ids ?? [];
                  return (
                    <label key={o.id} className="flex items-center gap-2 text-sm text-foreground">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-primary"
                        checked={selected.includes(o.id)}
                        onChange={(e) => updateAnswer(q.id, {
                          selected_option_ids: e.target.checked ? [...selected, o.id] : selected.filter((id) => id !== o.id),
                        })}
                      />
                      {o.text}
                    </label>
                  );
                })}
              </div>
            )}
            {q.type === "SCALE" && (
              <div className="flex items-center gap-3">
                {Array.from({ length: (q.scale_max ?? 5) - (q.scale_min ?? 1) + 1 }, (_, i) => (q.scale_min ?? 1) + i).map((v) => (
                  <label key={v} className="flex flex-col items-center gap-1 text-xs text-muted-foreground">
                    <input
                      type="radio"
                      name={q.id}
                      className="h-4 w-4 accent-primary"
                      checked={answers[q.id]?.scale_value === v}
                      onChange={() => updateAnswer(q.id, { scale_value: v })}
                    />
                    {v}
                  </label>
                ))}
              </div>
            )}
            {q.type === "TEXT" && (
              <Textarea
                rows={3}
                value={answers[q.id]?.text_answer ?? ""}
                onChange={(e) => updateAnswer(q.id, { text_answer: e.target.value })}
              />
            )}
          </CardContent>
        </Card>
      ))}
      {questions.length > 0 && (
        <Button type="submit" className="self-start" disabled={submitM.isPending}>
          {submitM.isPending ? "Enviando…" : "Enviar respuestas"}
        </Button>
      )}
      {questions.length === 0 && !questionsQ.isLoading && (
        <p className="text-sm text-muted-foreground">Esta encuesta todavía no tiene preguntas.</p>
      )}
    </form>
  );
}
