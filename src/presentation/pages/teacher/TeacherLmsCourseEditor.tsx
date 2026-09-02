/**
 * TeacherLmsCourseEditor.tsx
 * Editor de un curso académico: metadatos, unidades y actividades (por tipo),
 * más la nómina de alumnos con su progreso. Análogo a TutorialEditor/CourseEditor
 * pero para el módulo LMS (matrícula, entregas, quizzes, foro).
 */

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft, BarChart3, ClipboardList, Download, FileText, FileUp, GraduationCap, HelpCircle,
  MessageSquare, Paperclip, Pin, PinOff, Plus, Presentation as PresentationIcon, Save, Lock,
  Unlock, Trash2, Pencil, Upload, Users, ListChecks, ListTodo,
} from "lucide-react";
import { lmsUseCases } from "../../../infrastructure/factories/lms-module.factory";
import type {
  LmsActivity, LmsForumThread, LmsQuizFileFormat, LmsQuizQuestion, LmsSubmission,
  LmsSurveyQuestion,
} from "../../../domain/entities/lms.entity";
import { uploadUrl } from "@/presentation/store/auth.store";
import PageHeader from "@/presentation/components/patterns/PageHeader";
import EmptyState from "@/presentation/components/patterns/EmptyState";
import { pickCardImage } from "@/presentation/components/patterns/cardImages";
import DataTable, { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/presentation/components/patterns/DataTable";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Textarea } from "@/presentation/components/ui/textarea";
import { Badge } from "@/presentation/components/ui/badge";
import { Card, CardContent } from "@/presentation/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/presentation/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/presentation/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/presentation/components/ui/dialog";

const TYPE_META: Record<string, { label: string; icon: any }> = {
  presentation: { label: "Presentación", icon: PresentationIcon },
  forum: { label: "Foro", icon: MessageSquare },
  assignment: { label: "Tarea", icon: ClipboardList },
  quiz: { label: "Cuestionario", icon: HelpCircle },
  exam: { label: "Examen", icon: GraduationCap },
  survey: { label: "Encuesta", icon: ListTodo },
};

function typeMeta(type: string) {
  return TYPE_META[type] ?? { label: type, icon: FileText };
}

export default function TeacherLmsCourseEditor() {
  const { courseId } = useParams<{ courseId: string }>();
  const qc = useQueryClient();
  const [tab, setTab] = useState("contenido");
  const [newUnitTitle, setNewUnitTitle] = useState("");
  const [submissionsFor, setSubmissionsFor] = useState<LmsActivity | null>(null);
  const [questionsFor, setQuestionsFor] = useState<LmsActivity | null>(null);
  const [threadsFor, setThreadsFor] = useState<LmsActivity | null>(null);
  const [surveyFor, setSurveyFor] = useState<LmsActivity | null>(null);
  const [quizFromFileUnit, setQuizFromFileUnit] = useState<string | null>(null);
  const [weeksDialogOpen, setWeeksDialogOpen] = useState(false);
  const [weeksForm, setWeeksForm] = useState({ start_date: "", weeks: "12" });

  const courseQ = useQuery({
    queryKey: ["lms-course", courseId],
    queryFn: () => lmsUseCases.getCourseForManage(courseId!),
    enabled: !!courseId,
  });
  const unitsQ = useQuery({
    queryKey: ["lms-units", courseId],
    queryFn: () => lmsUseCases.listUnits(courseId!),
    enabled: !!courseId,
  });
  const rosterQ = useQuery({
    queryKey: ["lms-roster", courseId],
    queryFn: () => lmsUseCases.roster(courseId!),
    enabled: !!courseId && tab === "alumnos",
  });

  const course = courseQ.data;
  const units = useMemo(() => [...(unitsQ.data ?? [])].sort((a, b) => a.order - b.order), [unitsQ.data]);

  const invalidateUnits = () => qc.invalidateQueries({ queryKey: ["lms-units", courseId] });

  const updateCourseM = useMutation({
    mutationFn: (body: { title: string; description: string; status: string }) => lmsUseCases.updateCourse(courseId!, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lms-course", courseId] }),
  });

  const uploadCoverM = useMutation({
    mutationFn: (file: File) => lmsUseCases.uploadCourseCover(courseId!, file),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lms-course", courseId] }),
  });

  const createUnitM = useMutation({
    mutationFn: () => lmsUseCases.createUnit({ course: courseId!, title: newUnitTitle, order: units.length + 1 }),
    onSuccess: () => { setNewUnitTitle(""); invalidateUnits(); },
  });

  const generateWeeksM = useMutation({
    mutationFn: () => lmsUseCases.generateWeeklyUnits(courseId!, { start_date: weeksForm.start_date, weeks: Number(weeksForm.weeks) }),
    onSuccess: () => { setWeeksDialogOpen(false); invalidateUnits(); },
  });
  const updateUnitM = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<{ title: string; status: string; order: number; starts_at: string | null; ends_at: string | null }> }) =>
      lmsUseCases.updateUnit(id, body),
    onSuccess: invalidateUnits,
  });
  const deleteUnitM = useMutation({
    mutationFn: (id: string) => lmsUseCases.deleteUnit(id),
    onSuccess: invalidateUnits,
  });

  const deleteActivityM = useMutation({
    mutationFn: (id: string) => lmsUseCases.deleteActivity(id),
    onSuccess: invalidateUnits,
  });

  async function downloadSeb(activity: LmsActivity) {
    const { filename, blob } = await lmsUseCases.downloadSebConfig(activity.id);
    const url = URL.createObjectURL(new Blob([blob], { type: "application/seb" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!courseId) return null;

  return (
    <div>
      <Link to="/teacher/cursos" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft size={14} /> Volver a mis cursos
      </Link>

      <PageHeader icon={GraduationCap} title={course?.title || "Curso"} subtitle="Gestiona unidades, actividades y alumnos." />

      {course && (
        <Card className="mb-6">
          <CardContent className="flex flex-col gap-4 p-5">
            <div className="flex items-center gap-4">
              <img
                src={uploadUrl(course.cover_image) || pickCardImage(course.title || course.id)}
                alt=""
                className="h-16 w-24 shrink-0 rounded-md border border-border object-cover"
              />
              <div>
                <label className="mb-1.5 block cursor-pointer text-xs font-medium text-primary hover:underline">
                  {uploadCoverM.isPending ? "Subiendo…" : course.cover_image ? "Cambiar portada" : "Subir portada"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadCoverM.isPending}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCoverM.mutate(f); e.target.value = ""; }}
                  />
                </label>
                <p className="max-w-xs text-xs text-muted-foreground">
                  Se muestra en "Mis cursos" y el catálogo. Si no subes una, se usa una foto genérica.
                </p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto]">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Título</label>
              <Input defaultValue={course.title} key={`title-${course.id}`} id="course-title-input" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Estado</label>
              <Select defaultValue={course.status} onValueChange={(v) => updateCourseM.mutate({ title: course.title, description: course.description ?? "", status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Borrador</SelectItem>
                  <SelectItem value="PUBLISHED">Publicado</SelectItem>
                  <SelectItem value="ARCHIVED">Archivado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  const titleEl = document.getElementById("course-title-input") as HTMLInputElement | null;
                  updateCourseM.mutate({ title: titleEl?.value || course.title, description: course.description ?? "", status: course.status });
                }}
                disabled={updateCourseM.isPending}
              >
                <Save size={14} /> Guardar
              </Button>
            </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-5">
          <TabsTrigger value="contenido">Contenido</TabsTrigger>
          <TabsTrigger value="alumnos">Alumnos</TabsTrigger>
        </TabsList>

        <TabsContent value="contenido">
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <form
              className="flex gap-2"
              onSubmit={(e) => { e.preventDefault(); if (newUnitTitle.trim()) createUnitM.mutate(); }}
            >
              <Input placeholder="Título de la nueva unidad…" value={newUnitTitle} onChange={(e) => setNewUnitTitle(e.target.value)} className="max-w-sm" />
              <Button type="submit" disabled={createUnitM.isPending || !newUnitTitle.trim()}>
                <Plus size={15} /> Agregar unidad
              </Button>
            </form>
            <Button type="button" variant="outline" onClick={() => setWeeksDialogOpen(true)}>
              <ListChecks size={15} /> Generar semanas
            </Button>
          </div>

          {units.length === 0 && (
            <EmptyState icon={ListChecks} title="Sin unidades aún" description="Agrega la primera unidad, o genera varias semanas de una vez." />
          )}

          <div className="flex flex-col gap-4">
            {units.map((unit) => (
              <Card key={unit.id}>
                <CardContent className="p-5">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-display font-semibold text-foreground">{unit.title}</h3>
                      {unit.starts_at && unit.ends_at && (
                        <p className="text-xs text-muted-foreground">
                          {new Date(unit.starts_at).toLocaleDateString('es', { day: 'numeric', month: 'long', timeZone: 'UTC' })}
                          {' – '}
                          {new Date(unit.ends_at).toLocaleDateString('es', { day: 'numeric', month: 'long', timeZone: 'UTC' })}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Select defaultValue={unit.status} onValueChange={(v) => updateUnitM.mutate({ id: unit.id, body: { status: v } })}>
                        <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DRAFT">Borrador</SelectItem>
                          <SelectItem value="PUBLISHED">Publicado</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button size="sm" variant="outline" asChild>
                        <Link to={`/teacher/cursos/${courseId}/actividades/nueva?unit=${unit.id}`}>
                          <Plus size={14} /> Actividad
                        </Link>
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setQuizFromFileUnit(unit.id)}>
                        <FileUp size={14} /> Cuestionario desde archivo
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteUnitM.mutate(unit.id)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>

                  {(!unit.activities || unit.activities.length === 0) && (
                    <p className="text-sm text-muted-foreground">Sin actividades en esta unidad.</p>
                  )}

                  <div className="flex flex-col gap-2">
                    {[...(unit.activities ?? [])].sort((a, b) => a.order - b.order).map((activity) => {
                      const meta = typeMeta(activity.type);
                      const Icon = meta.icon;
                      return (
                        <div key={activity.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2.5">
                          <div className="flex items-center gap-2.5">
                            <Icon size={16} className="text-primary" />
                            <div>
                              <div className="text-sm font-medium text-foreground">{activity.title}</div>
                              <div className="text-xs text-muted-foreground">
                                {meta.label}
                                {activity.starts_at && ` · desde ${new Date(activity.starts_at).toLocaleDateString()}`}
                                {activity.due_at && ` · vence ${new Date(activity.due_at).toLocaleDateString()}`}
                              </div>
                            </div>
                            <Badge variant={activity.status === "PUBLISHED" ? "default" : "secondary"}>
                              {activity.status === "PUBLISHED" ? "Publicado" : "Borrador"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {(activity.type === "assignment" || activity.type === "exam") && (
                              <Button size="sm" variant="outline" onClick={() => setSubmissionsFor(activity)}>
                                <ClipboardList size={13} /> Entregas
                              </Button>
                            )}
                            {(activity.type === "quiz" || activity.type === "exam") && (
                              <Button size="sm" variant="outline" onClick={() => setQuestionsFor(activity)}>
                                <HelpCircle size={13} /> Preguntas
                              </Button>
                            )}
                            {(activity.type === "quiz" || activity.type === "exam") && activity.config?.requireSeb && (
                              <Button size="sm" variant="outline" onClick={() => downloadSeb(activity)} title="Descargar archivo .seb para Safe Exam Browser">
                                <Download size={13} /> .seb
                              </Button>
                            )}
                            {activity.type === "forum" && (
                              <Button size="sm" variant="outline" onClick={() => setThreadsFor(activity)}>
                                <MessageSquare size={13} /> Hilos
                              </Button>
                            )}
                            {activity.type === "survey" && (
                              <Button size="sm" variant="outline" onClick={() => setSurveyFor(activity)}>
                                <ListTodo size={13} /> Preguntas
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" asChild>
                              <Link to={`/teacher/cursos/${courseId}/actividades/${activity.id}`}>
                                <Pencil size={13} />
                              </Link>
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => deleteActivityM.mutate(activity.id)}>
                              <Trash2 size={13} />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="alumnos">
          {(rosterQ.data ?? []).length === 0 ? (
            <EmptyState icon={Users} title="Aún no hay alumnos inscritos" description="Los alumnos aparecerán aquí cuando se matriculen desde el catálogo." />
          ) : (
            <DataTable>
              <TableHeader>
                <TableRow>
                  <TableHead>Alumno</TableHead>
                  <TableHead>Progreso</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Última actividad</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(rosterQ.data ?? []).map((r) => (
                  <TableRow key={r.enrollment_id}>
                    <TableCell>
                      <div className="font-medium text-foreground">{r.student.first_name} {r.student.last_name}</div>
                      <div className="text-xs text-muted-foreground">{r.student.email}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${r.progress_percent}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{r.progress_percent}%</span>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline">{r.status}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {r.last_activity_at ? new Date(r.last_activity_at).toLocaleDateString() : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </DataTable>
          )}
        </TabsContent>
      </Tabs>

      <SubmissionsDialog activity={submissionsFor} onClose={() => setSubmissionsFor(null)} />
      <QuestionsDialog activity={questionsFor} onClose={() => setQuestionsFor(null)} />
      <ThreadsDialog activity={threadsFor} onClose={() => setThreadsFor(null)} />
      <SurveyQuestionsDialog activity={surveyFor} onClose={() => setSurveyFor(null)} />
      <CreateQuizFromFileDialog unitId={quizFromFileUnit} onClose={() => setQuizFromFileUnit(null)} onCreated={invalidateUnits} />

      <Dialog open={weeksDialogOpen} onOpenChange={setWeeksDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Generar semanas</DialogTitle></DialogHeader>
          <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); generateWeeksM.mutate(); }}>
            <p className="text-sm text-muted-foreground">
              Crea una unidad por cada semana (estilo Moodle), tituladas con su propio rango de
              fechas — puedes renombrarlas después. Se agregan a continuación de las unidades que
              ya existan.
            </p>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Fecha de inicio (primera semana) *</label>
              <Input type="date" required value={weeksForm.start_date} onChange={(e) => setWeeksForm((f) => ({ ...f, start_date: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Cantidad de semanas *</label>
              <Input type="number" min={1} max={52} required value={weeksForm.weeks} onChange={(e) => setWeeksForm((f) => ({ ...f, weeks: e.target.value }))} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setWeeksDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={generateWeeksM.isPending || !weeksForm.start_date}>
                {generateWeeksM.isPending ? "Generando…" : "Generar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Entregas (tareas / exámenes manuales) ───────────────────────────────────

function SubmissionsDialog({ activity, onClose }: { activity: LmsActivity | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [gradingId, setGradingId] = useState<string | null>(null);
  const [gradeForm, setGradeForm] = useState({ grade: "", feedback: "" });

  const q = useQuery({
    queryKey: ["lms-submissions", activity?.id],
    queryFn: () => lmsUseCases.listSubmissions(activity!.id),
    enabled: !!activity,
  });

  const gradeM = useMutation({
    mutationFn: (id: string) => lmsUseCases.gradeSubmission(id, { grade: Number(gradeForm.grade), feedback: gradeForm.feedback || undefined }),
    onSuccess: () => { setGradingId(null); qc.invalidateQueries({ queryKey: ["lms-submissions", activity?.id] }); },
  });

  return (
    <Dialog open={!!activity} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader><DialogTitle>Entregas — {activity?.title}</DialogTitle></DialogHeader>
        {(q.data ?? []).length === 0 ? (
          <EmptyState icon={ClipboardList} title="Sin entregas todavía" />
        ) : (
          <div className="flex flex-col gap-3">
            {(q.data ?? []).map((s: LmsSubmission) => (
              <Card key={s.id}>
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-medium text-foreground">{s.student?.first_name} {s.student?.last_name}</div>
                      <div className="text-xs text-muted-foreground">{s.student?.email}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={s.status === "GRADED" ? "default" : s.status === "LATE" ? "destructive" : "secondary"}>{s.status}</Badge>
                      {s.grade != null && <Badge variant="outline">{s.grade} pts</Badge>}
                      <Button size="sm" variant="outline" onClick={() => { setGradingId(s.id); setGradeForm({ grade: s.grade != null ? String(s.grade) : "", feedback: s.feedback ?? "" }); }}>
                        Calificar
                      </Button>
                    </div>
                  </div>
                  {s.content_text && <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{s.content_text}</p>}
                  {s.files && s.files.length > 0 && (
                    <ul className="mt-2 flex flex-col gap-1">
                      {s.files.map((f) => (
                        <li key={f.id}>
                          <a href={uploadUrl(f.file_url)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary underline">
                            <Paperclip size={13} /> {f.original_name}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                  {s.file_url && <a href={s.file_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm text-primary underline">Ver archivo entregado (legado)</a>}

                  {gradingId === s.id && (
                    <form className="mt-3 flex flex-col gap-2 border-t border-border pt-3" onSubmit={(e) => { e.preventDefault(); gradeM.mutate(s.id); }}>
                      <div className="flex gap-2">
                        <Input type="number" placeholder="Nota" value={gradeForm.grade} onChange={(e) => setGradeForm((f) => ({ ...f, grade: e.target.value }))} className="w-28" required />
                        <Button type="submit" size="sm" disabled={gradeM.isPending}>{gradeM.isPending ? "Guardando…" : "Guardar nota"}</Button>
                        <Button type="button" size="sm" variant="ghost" onClick={() => setGradingId(null)}>Cancelar</Button>
                      </div>
                      <Textarea rows={2} placeholder="Retroalimentación (opcional)" value={gradeForm.feedback} onChange={(e) => setGradeForm((f) => ({ ...f, feedback: e.target.value }))} />
                    </form>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Banco de preguntas (quiz / examen autoevaluable) ────────────────────────

const EMPTY_QUESTION_FORM = { text: "", type: "MULTIPLE_CHOICE", feedback: "", options: [{ text: "", is_correct: false }, { text: "", is_correct: false }] };

const QUIZ_TYPE_LABEL: Record<string, string> = {
  MULTIPLE_CHOICE: "Opción única",
  MULTI_ANSWER: "Opción múltiple (varias correctas)",
  OPEN: "Respuesta abierta",
};

const QUIZ_FORMAT_LABEL: Record<LmsQuizFileFormat, string> = {
  own: "Propio (Markdown)",
  gift: "GIFT",
  aiken: "Aiken",
  moodle_xml: "Moodle XML",
};

const QUIZ_FORMAT_EXAMPLE: Record<LmsQuizFileFormat, string> = {
  own: `## ¿Capital de Francia? [single]\n- Madrid\n* París\n- Roma\n\n## ¿Lenguajes tipados? [multi]\n* TypeScript\n* Java\n- Python\n\n## Comentarios [open]`,
  gift: `¿Capital de Francia? {\n=París\n~Madrid\n~Roma\n}\n\n¿Es la Tierra redonda? {TRUE}`,
  aiken: `¿Capital de Francia?\nA. Madrid\nB. París\nC. Roma\nANSWER: B`,
  moodle_xml: `<quiz>\n  <question type="multichoice">\n    <name><text>Q1</text></name>\n    <questiontext format="html"><text>¿Capital de Francia?</text></questiontext>\n    <single>true</single>\n    <answer fraction="100"><text>París</text></answer>\n    <answer fraction="0"><text>Madrid</text></answer>\n  </question>\n</quiz>`,
};

function triggerBrowserDownload(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function QuestionsDialog({ activity, onClose }: { activity: LmsActivity | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState(EMPTY_QUESTION_FORM);
  const [importFormat, setImportFormat] = useState<LmsQuizFileFormat>("own");
  const [importMode, setImportMode] = useState<"append" | "replace">("append");
  const [importWarnings, setImportWarnings] = useState<string[] | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const invalidateQuestions = () => qc.invalidateQueries({ queryKey: ["lms-questions", activity?.id] });

  const q = useQuery({
    queryKey: ["lms-questions", activity?.id],
    queryFn: () => lmsUseCases.listQuestionsForManage(activity!.id),
    enabled: !!activity,
  });

  const createM = useMutation({
    mutationFn: () => lmsUseCases.upsertQuestion({
      activity: activity!.id,
      text: form.text,
      type: form.type as any,
      feedback: form.feedback || null,
      options: form.type !== "OPEN" ? form.options.filter((o) => o.text.trim()) : undefined,
    }),
    onSuccess: () => { setForm(EMPTY_QUESTION_FORM); invalidateQuestions(); },
  });
  const deleteM = useMutation({
    mutationFn: (id: string) => lmsUseCases.deleteQuestion(id),
    onSuccess: invalidateQuestions,
  });
  const importM = useMutation({
    mutationFn: (content: string) => lmsUseCases.importQuizQuestions(activity!.id, { format: importFormat, content, mode: importMode }),
    onSuccess: (res: any) => { setImportError(null); setImportWarnings(res.warnings ?? []); invalidateQuestions(); },
    onError: (err: any) => { setImportWarnings(null); setImportError(err?.response?.data?.message || "No se pudo importar el archivo"); },
  });
  const exportM = useMutation({
    mutationFn: (format: LmsQuizFileFormat) => lmsUseCases.exportQuizQuestions(activity!.id, format),
    onSuccess: ({ filename, blob }: any) => triggerBrowserDownload(filename, blob),
  });

  function updateOption(idx: number, patch: Partial<{ text: string; is_correct: boolean }>) {
    setForm((f) => ({ ...f, options: f.options.map((o, i) => (i === idx ? { ...o, ...patch } : o)) }));
  }

  function handleTypeChange(type: string) {
    setForm((f) => {
      if (type !== "MULTIPLE_CHOICE") return { ...f, type };
      // Opción única solo admite una correcta: si venía de "varias correctas", nos quedamos con la primera.
      const firstCorrect = f.options.findIndex((o) => o.is_correct);
      return { ...f, type, options: f.options.map((o, i) => ({ ...o, is_correct: i === firstCorrect })) };
    });
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => importM.mutate(String(reader.result ?? ""));
    reader.readAsText(file);
    e.target.value = "";
  }

  return (
    <Dialog open={!!activity} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader><DialogTitle>Banco de preguntas — {activity?.title}</DialogTitle></DialogHeader>

        {/* Importar */}
        <div className="flex flex-col gap-2 border-b border-border pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <Select value={importFormat} onValueChange={(v) => setImportFormat(v as LmsQuizFileFormat)}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(QUIZ_FORMAT_LABEL) as LmsQuizFileFormat[]).map((f) => (
                  <SelectItem key={f} value={f}>{QUIZ_FORMAT_LABEL[f]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={importMode} onValueChange={(v) => setImportMode(v as "append" | "replace")}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="append">Agregar</SelectItem>
                <SelectItem value="replace">Reemplazar todo</SelectItem>
              </SelectContent>
            </Select>
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-dashed border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground">
              <Upload size={13} /> Importar archivo
              <input type="file" accept=".md,.markdown,.txt,.xml,.gift,text/*" className="hidden" onChange={handleImportFile} />
            </label>
          </div>
          {importM.isPending && <p className="text-xs text-muted-foreground">Importando…</p>}
          {importError && <p className="text-xs text-destructive whitespace-pre-wrap">{importError}</p>}
          {importWarnings && importWarnings.length > 0 && (
            <ul className="text-xs text-amber-600">
              {importWarnings.map((w, i) => <li key={i}>⚠ {w}</li>)}
            </ul>
          )}
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer select-none">Ver formato de ejemplo ({QUIZ_FORMAT_LABEL[importFormat]})</summary>
            <pre className="mt-2 whitespace-pre-wrap rounded-md bg-muted p-3 font-mono">{QUIZ_FORMAT_EXAMPLE[importFormat]}</pre>
          </details>
        </div>

        {/* Exportar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border pb-4">
          <span className="text-xs font-medium text-muted-foreground">Exportar como:</span>
          {(Object.keys(QUIZ_FORMAT_LABEL) as LmsQuizFileFormat[]).map((f) => (
            <Button key={f} type="button" size="sm" variant="outline" disabled={exportM.isPending} onClick={() => exportM.mutate(f)}>
              <Download size={13} /> {QUIZ_FORMAT_LABEL[f]}
            </Button>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          {(q.data ?? []).map((question: LmsQuizQuestion) => (
            <Card key={question.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">{question.text}</p>
                    <Badge variant="outline" className="mt-1">{QUIZ_TYPE_LABEL[question.type] ?? question.type}</Badge>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => deleteM.mutate(question.id)}><Trash2 size={14} /></Button>
                </div>
                {question.type !== "OPEN" && (
                  <ul className="mt-2 flex flex-col gap-1">
                    {question.options.map((o) => (
                      <li key={o.id} className={`text-sm ${o.is_correct ? "font-medium text-emerald-600" : "text-muted-foreground"}`}>
                        {o.is_correct ? "✓ " : "· "}{o.text}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          ))}
          {(q.data ?? []).length === 0 && (
            <EmptyState icon={HelpCircle} title="Sin preguntas todavía" description="Agrega preguntas manualmente o importa un archivo." />
          )}
        </div>

        <form className="mt-2 flex flex-col gap-3 border-t border-border pt-4" onSubmit={(e) => { e.preventDefault(); createM.mutate(); }}>
          <p className="text-sm font-medium text-foreground">Agregar pregunta</p>
          <Textarea rows={2} placeholder="Enunciado de la pregunta" required value={form.text} onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))} />
          <Select value={form.type} onValueChange={handleTypeChange}>
            <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="MULTIPLE_CHOICE">Opción única</SelectItem>
              <SelectItem value="MULTI_ANSWER">Opción múltiple (varias correctas)</SelectItem>
              <SelectItem value="OPEN">Respuesta abierta</SelectItem>
            </SelectContent>
          </Select>

          {form.type !== "OPEN" && (
            <div className="flex flex-col gap-2">
              {form.options.map((o, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type={form.type === "MULTIPLE_CHOICE" ? "radio" : "checkbox"}
                    name="correct-option"
                    checked={o.is_correct}
                    onChange={(e) =>
                      form.type === "MULTIPLE_CHOICE"
                        ? setForm((f) => ({ ...f, options: f.options.map((opt, i) => ({ ...opt, is_correct: i === idx })) }))
                        : updateOption(idx, { is_correct: e.target.checked })
                    }
                    className="h-4 w-4 accent-primary"
                  />
                  <Input placeholder={`Opción ${idx + 1}`} value={o.text} onChange={(e) => updateOption(idx, { text: e.target.value })} />
                </div>
              ))}
              <Button type="button" size="sm" variant="outline" className="self-start" onClick={() => setForm((f) => ({ ...f, options: [...f.options, { text: "", is_correct: false }] }))}>
                <Plus size={13} /> Opción
              </Button>
            </div>
          )}

          <Textarea rows={2} placeholder="Retroalimentación al responder (opcional)" value={form.feedback} onChange={(e) => setForm((f) => ({ ...f, feedback: e.target.value }))} />
          <Button type="submit" disabled={createM.isPending} className="self-start">{createM.isPending ? "Guardando…" : "Agregar pregunta"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Crear cuestionario directamente desde un archivo ────────────────────────

function CreateQuizFromFileDialog({ unitId, onClose, onCreated }: { unitId: string | null; onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [format, setFormat] = useState<LmsQuizFileFormat>("own");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[] | null>(null);

  const createM = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Selecciona un archivo");
      const content = await file.text();
      return lmsUseCases.createQuizFromFile(unitId!, { title: title.trim() || undefined, format, content });
    },
    onSuccess: (res: any) => {
      if (res.warnings?.length) { setWarnings(res.warnings); return; }
      handleClose();
      onCreated();
    },
    onError: (err: any) => setError(err?.response?.data?.message || err?.message || "No se pudo crear el cuestionario"),
  });

  function handleClose() {
    setTitle(""); setFile(null); setError(null); setWarnings(null);
    onClose();
  }

  return (
    <Dialog open={!!unitId} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Cuestionario desde archivo</DialogTitle></DialogHeader>
        <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); createM.mutate(); }}>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Título (opcional)</label>
            <Input placeholder="Si lo dejas vacío, se usa un título genérico" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Formato</label>
            <Select value={format} onValueChange={(v) => setFormat(v as LmsQuizFileFormat)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(QUIZ_FORMAT_LABEL) as LmsQuizFileFormat[]).map((f) => (
                  <SelectItem key={f} value={f}>{QUIZ_FORMAT_LABEL[f]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Archivo *</label>
            <Input type="file" accept=".md,.markdown,.txt,.xml,.gift,text/*" required onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
          {error && <p className="text-sm text-destructive whitespace-pre-wrap">{error}</p>}
          {warnings && (
            <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800">
              <p className="mb-1 font-medium">Se creó con advertencias — revísalas en "Preguntas":</p>
              <ul className="list-inside list-disc">{warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
              <Button type="button" size="sm" className="mt-2" onClick={() => { handleClose(); onCreated(); }}>Entendido</Button>
            </div>
          )}
          {!warnings && (
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>Cancelar</Button>
              <Button type="submit" disabled={createM.isPending}>{createM.isPending ? "Creando…" : "Crear"}</Button>
            </DialogFooter>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Hilos de foro (moderación) ───────────────────────────────────────────────

function ThreadsDialog({ activity, onClose }: { activity: LmsActivity | null; onClose: () => void }) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["lms-threads-manage", activity?.id],
    queryFn: () => lmsUseCases.listThreadsForManage(activity!.id),
    enabled: !!activity,
  });
  const moderateM = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: { is_pinned?: boolean; is_locked?: boolean } }) => lmsUseCases.moderateThread(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lms-threads-manage", activity?.id] }),
  });

  return (
    <Dialog open={!!activity} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader><DialogTitle>Hilos de foro — {activity?.title}</DialogTitle></DialogHeader>
        {(q.data ?? []).length === 0 ? (
          <EmptyState icon={MessageSquare} title="Sin hilos todavía" description="Los alumnos crean hilos desde la vista del curso." />
        ) : (
          <div className="flex flex-col gap-2">
            {(q.data ?? []).map((t: LmsForumThread) => (
              <div key={t.id} className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2.5">
                <div>
                  <div className="text-sm font-medium text-foreground">{t.title}</div>
                  <div className="text-xs text-muted-foreground">{t.author?.first_name} {t.author?.last_name}</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button size="sm" variant="outline" onClick={() => moderateM.mutate({ id: t.id, patch: { is_pinned: !t.is_pinned } })}>
                    {t.is_pinned ? <PinOff size={13} /> : <Pin size={13} />} {t.is_pinned ? "Desfijar" : "Fijar"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => moderateM.mutate({ id: t.id, patch: { is_locked: !t.is_locked } })}>
                    {t.is_locked ? <Unlock size={13} /> : <Lock size={13} />} {t.is_locked ? "Abrir" : "Cerrar"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Encuestas: banco de preguntas, importación y resultados ────────────────

const SURVEY_TYPE_LABEL: Record<string, string> = {
  SINGLE_CHOICE: "Única opción",
  MULTIPLE_CHOICE: "Opción múltiple",
  SCALE: "Escala",
  TEXT: "Texto libre",
};

const EMPTY_SURVEY_QUESTION_FORM = { text: "", type: "SINGLE_CHOICE", scale_min: "1", scale_max: "5", options: ["", ""] };

const SURVEY_MARKDOWN_EXAMPLE = `anonymous: true

## ¿Qué tan satisfecho estás con el curso? [single]
- Muy insatisfecho
- Neutral
- Muy satisfecho

## ¿Qué temas te gustaría profundizar? [multiple]
- Bases de datos
- Frontend
- Backend

## Califica la claridad del docente [scale 1-5]

## Comentarios adicionales [text]`;

function SurveyQuestionsDialog({ activity, onClose }: { activity: LmsActivity | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState(EMPTY_SURVEY_QUESTION_FORM);
  const [showResults, setShowResults] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ["lms-survey-questions-manage", activity?.id],
    queryFn: () => lmsUseCases.listSurveyQuestionsForManage(activity!.id),
    enabled: !!activity,
  });
  const resultsQ = useQuery({
    queryKey: ["lms-survey-results", activity?.id],
    queryFn: () => lmsUseCases.getSurveyResults(activity!.id),
    enabled: !!activity && showResults,
  });

  const createM = useMutation({
    mutationFn: () => lmsUseCases.upsertSurveyQuestion({
      activity: activity!.id,
      text: form.text,
      type: form.type as any,
      scale_min: form.type === "SCALE" ? Number(form.scale_min) : undefined,
      scale_max: form.type === "SCALE" ? Number(form.scale_max) : undefined,
      options: (form.type === "SINGLE_CHOICE" || form.type === "MULTIPLE_CHOICE")
        ? form.options.filter((o) => o.trim()).map((text) => ({ text }))
        : undefined,
    }),
    onSuccess: () => { setForm(EMPTY_SURVEY_QUESTION_FORM); qc.invalidateQueries({ queryKey: ["lms-survey-questions-manage", activity?.id] }); },
  });
  const deleteM = useMutation({
    mutationFn: (id: string) => lmsUseCases.deleteSurveyQuestion(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lms-survey-questions-manage", activity?.id] }),
  });
  const importM = useMutation({
    mutationFn: (markdown: string) => lmsUseCases.importSurveyQuestions(activity!.id, markdown),
    onSuccess: () => {
      setImportError(null);
      qc.invalidateQueries({ queryKey: ["lms-survey-questions-manage", activity?.id] });
    },
    onError: (err: any) => setImportError(err?.response?.data?.message || "No se pudo importar el archivo"),
  });

  function updateOption(idx: number, text: string) {
    setForm((f) => ({ ...f, options: f.options.map((o, i) => (i === idx ? text : o)) }));
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => importM.mutate(String(reader.result ?? ""));
    reader.readAsText(file);
    e.target.value = "";
  }

  return (
    <Dialog open={!!activity} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader><DialogTitle>Encuesta — {activity?.title}</DialogTitle></DialogHeader>

        <div className="flex flex-wrap items-center gap-2 border-b border-border pb-4">
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-dashed border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground">
            <Upload size={13} /> Importar desde Markdown (.md)
            <input type="file" accept=".md,.markdown,text/markdown,text/plain" className="hidden" onChange={handleImportFile} />
          </label>
          <Button type="button" size="sm" variant="outline" onClick={() => setShowResults((v) => !v)}>
            <BarChart3 size={13} /> {showResults ? "Ocultar resultados" : "Ver resultados"}
          </Button>
        </div>
        {importM.isPending && <p className="text-xs text-muted-foreground">Importando…</p>}
        {importError && <p className="text-xs text-destructive">{importError}</p>}
        <details className="text-xs text-muted-foreground">
          <summary className="cursor-pointer select-none">Ver formato de ejemplo</summary>
          <pre className="mt-2 whitespace-pre-wrap rounded-md bg-muted p-3 font-mono">{SURVEY_MARKDOWN_EXAMPLE}</pre>
        </details>

        {showResults && (
          <Card className="border-primary/30">
            <CardContent className="p-4">
              {!resultsQ.data ? (
                <p className="text-sm text-muted-foreground">Cargando resultados…</p>
              ) : (
                <div className="flex flex-col gap-4">
                  <p className="text-xs font-medium text-muted-foreground">
                    {resultsQ.data.total_responses} respuesta(s) {resultsQ.data.anonymous && "· encuesta anónima"}
                  </p>
                  {resultsQ.data.questions.map((rq) => (
                    <div key={rq.question_id}>
                      <p className="mb-1.5 text-sm font-medium text-foreground">{rq.text}</p>
                      {(rq.type === "SINGLE_CHOICE" || rq.type === "MULTIPLE_CHOICE") && (
                        <div className="flex flex-col gap-1">
                          {(rq.options ?? []).map((o) => {
                            const total = (rq.options ?? []).reduce((sum, x) => sum + x.count, 0) || 1;
                            const pct = Math.round((o.count / total) * 100);
                            return (
                              <div key={o.id} className="flex items-center gap-2 text-xs">
                                <span className="w-32 shrink-0 truncate text-muted-foreground">{o.text}</span>
                                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                                  <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                                </div>
                                <span className="w-10 shrink-0 text-right text-muted-foreground">{o.count}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {rq.type === "SCALE" && (
                        <p className="text-sm text-muted-foreground">
                          Promedio: <span className="font-medium text-foreground">{rq.average != null ? rq.average.toFixed(1) : "—"}</span>
                          {" "}({rq.scale_min}–{rq.scale_max}), {rq.count} respuesta(s)
                        </p>
                      )}
                      {rq.type === "TEXT" && (
                        <ul className="flex flex-col gap-1">
                          {(rq.answers ?? []).map((a, i) => (
                            <li key={i} className="rounded-md bg-muted px-2.5 py-1.5 text-xs text-foreground">
                              {a.text}
                              {a.student && <span className="ml-1.5 text-muted-foreground">— {a.student.first_name} {a.student.last_name}</span>}
                            </li>
                          ))}
                          {(rq.answers ?? []).length === 0 && <li className="text-xs text-muted-foreground">Sin respuestas de texto.</li>}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col gap-3">
          {(q.data ?? []).map((question: LmsSurveyQuestion) => (
            <Card key={question.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">{question.text}</p>
                    <Badge variant="outline" className="mt-1">{SURVEY_TYPE_LABEL[question.type] ?? question.type}</Badge>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => deleteM.mutate(question.id)}><Trash2 size={14} /></Button>
                </div>
                {(question.type === "SINGLE_CHOICE" || question.type === "MULTIPLE_CHOICE") && (
                  <ul className="mt-2 flex flex-col gap-1">
                    {question.options.map((o) => (
                      <li key={o.id} className="text-sm text-muted-foreground">· {o.text}</li>
                    ))}
                  </ul>
                )}
                {question.type === "SCALE" && (
                  <p className="mt-2 text-sm text-muted-foreground">Escala {question.scale_min}–{question.scale_max}</p>
                )}
              </CardContent>
            </Card>
          ))}
          {(q.data ?? []).length === 0 && (
            <EmptyState icon={ListTodo} title="Sin preguntas todavía" description="Agrega preguntas manualmente o importa un archivo Markdown." />
          )}
        </div>

        <form className="mt-2 flex flex-col gap-3 border-t border-border pt-4" onSubmit={(e) => { e.preventDefault(); createM.mutate(); }}>
          <p className="text-sm font-medium text-foreground">Agregar pregunta</p>
          <Textarea rows={2} placeholder="Enunciado de la pregunta" required value={form.text} onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))} />
          <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
            <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="SINGLE_CHOICE">Única opción</SelectItem>
              <SelectItem value="MULTIPLE_CHOICE">Opción múltiple</SelectItem>
              <SelectItem value="SCALE">Escala</SelectItem>
              <SelectItem value="TEXT">Texto libre</SelectItem>
            </SelectContent>
          </Select>

          {(form.type === "SINGLE_CHOICE" || form.type === "MULTIPLE_CHOICE") && (
            <div className="flex flex-col gap-2">
              {form.options.map((o, idx) => (
                <Input key={idx} placeholder={`Opción ${idx + 1}`} value={o} onChange={(e) => updateOption(idx, e.target.value)} />
              ))}
              <Button type="button" size="sm" variant="outline" className="self-start" onClick={() => setForm((f) => ({ ...f, options: [...f.options, ""] }))}>
                <Plus size={13} /> Opción
              </Button>
            </div>
          )}
          {form.type === "SCALE" && (
            <div className="flex gap-3">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Mínimo</label>
                <Input type="number" className="w-20" value={form.scale_min} onChange={(e) => setForm((f) => ({ ...f, scale_min: e.target.value }))} />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Máximo</label>
                <Input type="number" className="w-20" value={form.scale_max} onChange={(e) => setForm((f) => ({ ...f, scale_max: e.target.value }))} />
              </div>
            </div>
          )}

          <Button type="submit" disabled={createM.isPending} className="self-start">{createM.isPending ? "Guardando…" : "Agregar pregunta"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
