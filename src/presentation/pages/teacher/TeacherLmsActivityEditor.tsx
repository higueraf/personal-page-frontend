/**
 * TeacherLmsActivityEditor.tsx
 * Configuración de una actividad en pantalla completa (reemplaza a la lista de
 * contenido del curso, en vez de un diálogo/ventana flotante) — crear o editar,
 * con todas las opciones disponibles para el tipo elegido.
 */

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, ClipboardList, GraduationCap, HelpCircle, MessageSquare, Presentation as PresentationIcon, Save } from "lucide-react";
import { lmsUseCases } from "../../../infrastructure/factories/lms-module.factory";
import PageHeader from "@/presentation/components/patterns/PageHeader";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Textarea } from "@/presentation/components/ui/textarea";
import { Card, CardContent } from "@/presentation/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/presentation/components/ui/select";

const ACTIVITY_TYPES = ["presentation", "forum", "assignment", "quiz", "exam", "survey"] as const;

const TYPE_META: Record<string, { label: string; icon: any }> = {
  presentation: { label: "Presentación", icon: PresentationIcon },
  forum: { label: "Foro", icon: MessageSquare },
  assignment: { label: "Tarea", icon: ClipboardList },
  quiz: { label: "Cuestionario", icon: HelpCircle },
  exam: { label: "Examen", icon: GraduationCap },
  survey: { label: "Encuesta", icon: ClipboardList },
};

function typeMeta(type: string) {
  return TYPE_META[type] ?? { label: type, icon: ClipboardList };
}

const EMPTY_FORM = {
  type: "presentation",
  title: "",
  instructions: "",
  status: "DRAFT",
  starts_at: "",
  due_at: "",
  max_score: "",
  configText: "",
  requireSeb: false,
  attemptsAllowed: "1",
};

function toDateInputValue(iso?: string | null) {
  return iso ? iso.slice(0, 10) : "";
}

export default function TeacherLmsActivityEditor() {
  const { courseId, activityId } = useParams<{ courseId: string; activityId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isNew = activityId === "nueva";
  const unitIdForCreate = searchParams.get("unit");

  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  const activityQ = useQuery({
    queryKey: ["lms-activity-manage", activityId],
    queryFn: () => lmsUseCases.getActivityForManage(activityId!),
    enabled: !isNew && !!activityId,
  });

  useEffect(() => {
    const activity = activityQ.data;
    if (!activity) return;
    const { requireSeb, attempts_allowed, ...restConfig } = activity.config ?? {};
    setForm({
      type: activity.type,
      title: activity.title,
      instructions: activity.instructions ?? "",
      status: activity.status,
      starts_at: toDateInputValue(activity.starts_at),
      due_at: toDateInputValue(activity.due_at),
      max_score: activity.max_score != null ? String(activity.max_score) : "",
      configText: Object.keys(restConfig).length ? JSON.stringify(restConfig, null, 2) : "",
      requireSeb: !!requireSeb,
      attemptsAllowed: attempts_allowed != null ? String(attempts_allowed) : "1",
    });
  }, [activityQ.data]);

  const saveM = useMutation({
    mutationFn: async () => {
      let config: Record<string, any> = {};
      if (form.configText.trim()) {
        try {
          config = JSON.parse(form.configText);
        } catch {
          throw new Error("La configuración debe ser JSON válido");
        }
      }
      if (form.type === "quiz" || form.type === "exam") {
        config = { ...config, requireSeb: form.requireSeb, attempts_allowed: Number(form.attemptsAllowed) || 1 };
      }
      const body = {
        type: form.type,
        title: form.title,
        instructions: form.instructions || null,
        status: form.status,
        starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
        due_at: form.due_at ? new Date(form.due_at).toISOString() : null,
        max_score: form.max_score ? Number(form.max_score) : null,
        config,
      };
      if (!isNew && activityId) return lmsUseCases.updateActivity(activityId, body);
      return lmsUseCases.createActivity({ ...body, unit: unitIdForCreate! });
    },
    onSuccess: () => {
      setError(null);
      qc.invalidateQueries({ queryKey: ["lms-units", courseId] });
      navigate(`/teacher/cursos/${courseId}`);
    },
    onError: (err: any) => setError(err?.response?.data?.message || err?.message || "No se pudo guardar la actividad"),
  });

  if (!isNew && activityQ.isLoading) {
    return <div className="mx-auto max-w-3xl px-6 py-10 text-muted-foreground">Cargando…</div>;
  }
  if (isNew && !unitIdForCreate) {
    return <div className="mx-auto max-w-3xl px-6 py-10 text-muted-foreground">Falta indicar la unidad para la nueva actividad.</div>;
  }

  const meta = typeMeta(form.type);
  const Icon = meta.icon;

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link to={`/teacher/cursos/${courseId}`} className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft size={14} /> Volver al curso
      </Link>

      <PageHeader icon={Icon} title={isNew ? "Nueva actividad" : `Editar: ${form.title || "actividad"}`} subtitle="Todas las opciones disponibles para este tipo de actividad." />

      <Card>
        <CardContent className="flex flex-col gap-5 p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Tipo</label>
              <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))} disabled={!isNew}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ACTIVITY_TYPES.map((t) => <SelectItem key={t} value={t}>{typeMeta(t).label}</SelectItem>)}
                </SelectContent>
              </Select>
              {!isNew && <p className="mt-1 text-xs text-muted-foreground">El tipo no se puede cambiar después de creada.</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Estado</label>
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Borrador</SelectItem>
                  <SelectItem value="PUBLISHED">Publicado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Título *</label>
            <Input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Instrucciones</label>
            <Textarea rows={4} value={form.instructions} onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Fecha de inicio</label>
              <Input type="date" value={form.starts_at} onChange={(e) => setForm((f) => ({ ...f, starts_at: e.target.value }))} />
              <p className="mt-1 text-xs text-muted-foreground">Antes de esta fecha el alumno no puede abrirla.</p>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Fecha límite</label>
              <Input type="date" value={form.due_at} onChange={(e) => setForm((f) => ({ ...f, due_at: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Puntaje máximo</label>
              <Input type="number" value={form.max_score} onChange={(e) => setForm((f) => ({ ...f, max_score: e.target.value }))} />
            </div>
          </div>

          {(form.type === "quiz" || form.type === "exam") && (
            <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Comportamiento del cuestionario</p>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-primary"
                  checked={form.requireSeb}
                  onChange={(e) => setForm((f) => ({ ...f, requireSeb: e.target.checked }))}
                />
                Requiere Safe Exam Browser (pantalla completa)
              </label>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Intentos permitidos</label>
                <Input
                  type="number"
                  min={0}
                  className="max-w-32"
                  value={form.attemptsAllowed}
                  onChange={(e) => setForm((f) => ({ ...f, attemptsAllowed: e.target.value }))}
                />
                <p className="mt-1 text-xs text-muted-foreground">1 = un solo intento (por defecto). 0 = intentos ilimitados.</p>
              </div>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Configuración (JSON, opcional)</label>
            <Textarea
              rows={5}
              className="font-mono text-xs"
              placeholder={'presentación: {"file_url":"https://..."}\nexamen externo: {"mode":"external","external_url":"https://..."}'}
              value={form.configText}
              onChange={(e) => setForm((f) => ({ ...f, configText: e.target.value }))}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Presentación: <code>file_url</code> o <code>embed_url</code>. Examen: <code>mode</code> (<code>quiz</code>/<code>manual</code>/<code>external</code>) y <code>external_url</code> si aplica. Encuesta: <code>anonymous</code> (<code>true</code>/<code>false</code>), también configurable al importar el Markdown.
            </p>
          </div>

          {error && <p className="text-sm text-destructive whitespace-pre-wrap">{error}</p>}

          <div className="flex items-center gap-3 border-t border-border pt-5">
            <Button onClick={() => saveM.mutate()} disabled={saveM.isPending || !form.title.trim()}>
              <Save size={14} /> {saveM.isPending ? "Guardando…" : "Guardar"}
            </Button>
            <Button variant="outline" onClick={() => navigate(`/teacher/cursos/${courseId}`)}>Cancelar</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
