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
  ArrowLeft, CheckCircle2, ExternalLink, MessageSquare, Pin, Send,
} from "lucide-react";
import { lmsUseCases } from "../../../infrastructure/factories/lms-module.factory";
import type { LmsActivity, LmsForumThread } from "../../../domain/entities/lms.entity";
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
  if (!q.data) return <div className="mx-auto max-w-3xl px-6 py-10 text-muted-foreground">Actividad no encontrada.</div>;

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
  const [form, setForm] = useState({ content_text: "", file_url: "" });

  const subQ = useQuery({
    queryKey: ["lms-my-submission", activity.id],
    queryFn: () => lmsUseCases.mySubmission(activity.id),
  });

  const submitM = useMutation({
    mutationFn: () => lmsUseCases.submitAssignment(activity.id, {
      content_text: form.content_text || undefined,
      file_url: form.file_url || undefined,
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lms-my-submission", activity.id] }),
  });

  const submission = subQ.data;

  if (submission?.status === "GRADED") {
    return (
      <Card>
        <CardContent className="p-5">
          <div className="mb-2 flex items-center gap-2">
            <Badge>Calificada</Badge>
            <span className="font-semibold text-foreground">{submission.grade} pts</span>
          </div>
          {submission.content_text && <p className="mb-2 whitespace-pre-wrap text-sm text-muted-foreground">{submission.content_text}</p>}
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
        <div className="flex items-center gap-2">
          <Badge variant={submission.status === "LATE" ? "destructive" : "secondary"}>{submission.status}</Badge>
          <span className="text-xs text-muted-foreground">
            {submission.submitted_at && `Entregado el ${new Date(submission.submitted_at).toLocaleString()}`}
          </span>
        </div>
      )}
      <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); submitM.mutate(); }}>
        <Textarea
          rows={5}
          placeholder="Escribe tu entrega…"
          value={form.content_text}
          onChange={(e) => setForm((f) => ({ ...f, content_text: e.target.value }))}
        />
        <Input
          placeholder="URL del archivo (opcional)"
          value={form.file_url}
          onChange={(e) => setForm((f) => ({ ...f, file_url: e.target.value }))}
        />
        <Button type="submit" className="self-start" disabled={submitM.isPending}>
          {submitM.isPending ? "Enviando…" : submission ? "Reenviar entrega" : "Entregar"}
        </Button>
      </form>
    </div>
  );
}

// ── Quiz / examen autoevaluable ───────────────────────────────────────────────

function QuizBody({ activity }: { activity: LmsActivity }) {
  const qc = useQueryClient();
  const [answers, setAnswers] = useState<Record<string, { selected_option_id?: string; text_answer?: string }>>({});

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
            {q.type === "MULTIPLE_CHOICE" ? (
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
            ) : (
              <Textarea
                rows={3}
                value={answers[q.id]?.text_answer ?? ""}
                onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: { text_answer: e.target.value } }))}
              />
            )}
          </CardContent>
        </Card>
      ))}
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
