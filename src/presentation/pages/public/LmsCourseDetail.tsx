/**
 * LmsCourseDetail.tsx
 * Ficha pública de un curso académico: estructura por unidades/actividades.
 * Visitantes ven la estructura y un botón de inscripción; alumnos inscritos
 * ven además su progreso y pueden entrar a cada actividad.
 */

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, CheckCircle2, ClipboardList, FileText, GraduationCap, HelpCircle,
  Lock, MessageSquare, Presentation as PresentationIcon,
} from "lucide-react";
import { lmsUseCases } from "../../../infrastructure/factories/lms-module.factory";
import { useAuth } from "../../store/auth.store";
import PageHeader from "@/presentation/components/patterns/PageHeader";
import { Button } from "@/presentation/components/ui/button";
import { Card, CardContent } from "@/presentation/components/ui/card";
import { Badge } from "@/presentation/components/ui/badge";

const TYPE_META: Record<string, { label: string; icon: any }> = {
  presentation: { label: "Presentación", icon: PresentationIcon },
  forum: { label: "Foro", icon: MessageSquare },
  assignment: { label: "Tarea", icon: ClipboardList },
  quiz: { label: "Cuestionario", icon: HelpCircle },
  exam: { label: "Examen", icon: GraduationCap },
};
function typeMeta(type: string) {
  return TYPE_META[type] ?? { label: type, icon: FileText };
}

export default function LmsCourseDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { status } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  const authed = status === "authenticated";
  const [enrollError, setEnrollError] = useState<string | null>(null);

  const courseQ = useQuery({
    queryKey: ["lms-course-detail", slug],
    queryFn: () => lmsUseCases.detail(slug!),
    enabled: !!slug,
  });

  const myCoursesQ = useQuery({
    queryKey: ["lms-my-courses"],
    queryFn: () => lmsUseCases.myCourses(),
    enabled: authed,
  });

  const course = courseQ.data;
  const enrollment = myCoursesQ.data?.find((e) => e.course.id === course?.id);

  const enrollM = useMutation({
    mutationFn: () => lmsUseCases.enroll(course!.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lms-my-courses"] }),
    onError: () => setEnrollError("No se pudo completar la inscripción. Intenta de nuevo."),
  });

  function handleEnroll() {
    if (!authed) { nav("/login", { state: { from: `/lms/${slug}` } }); return; }
    setEnrollError(null);
    enrollM.mutate();
  }

  if (courseQ.isLoading) return <div className="mx-auto max-w-3xl px-6 py-10 text-muted-foreground">Cargando…</div>;
  if (!course) return <div className="mx-auto max-w-3xl px-6 py-10 text-muted-foreground">Curso no encontrado.</div>;

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link to="/lms" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft size={14} /> Volver a Academia
      </Link>

      <PageHeader
        icon={GraduationCap}
        title={course.title}
        subtitle={course.teacher ? `Profesor: ${course.teacher.first_name} ${course.teacher.last_name}` : undefined}
      />

      {course.description && <p className="mb-6 text-muted-foreground">{course.description}</p>}

      {enrollment ? (
        <Card className="mb-6">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${enrollment.progress_percent}%` }} />
            </div>
            <span className="text-sm font-medium text-foreground">{enrollment.progress_percent}% completado</span>
          </CardContent>
        </Card>
      ) : (
        <div className="mb-6">
          <Button onClick={handleEnroll} disabled={enrollM.isPending}>
            {enrollM.isPending ? "Inscribiendo…" : authed ? "Inscribirme" : "Inicia sesión para inscribirte"}
          </Button>
          {enrollError && <p className="mt-2 text-sm text-destructive">{enrollError}</p>}
        </div>
      )}

      <div className="flex flex-col gap-4">
        {(course.units ?? []).map((unit) => (
          <Card key={unit.id}>
            <CardContent className="p-5">
              <h3 className="font-display font-semibold text-foreground">{unit.title}</h3>
              {unit.starts_at && unit.ends_at && (
                <p className="text-xs text-muted-foreground">
                  {new Date(unit.starts_at).toLocaleDateString('es', { day: 'numeric', month: 'long', timeZone: 'UTC' })}
                  {' – '}
                  {new Date(unit.ends_at).toLocaleDateString('es', { day: 'numeric', month: 'long', timeZone: 'UTC' })}
                </p>
              )}
              <div className="mt-3 flex flex-col gap-2">
                {(unit.activities ?? []).map((activity) => {
                  const meta = typeMeta(activity.type);
                  const Icon = meta.icon;
                  const body = (
                    <div className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2.5 transition-colors hover:border-primary/40">
                      <div className="flex items-center gap-2.5">
                        <Icon size={16} className="text-primary" />
                        <div>
                          <div className="text-sm font-medium text-foreground">{activity.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {meta.label}
                            {activity.due_at && ` · vence ${new Date(activity.due_at).toLocaleDateString()}`}
                          </div>
                        </div>
                      </div>
                      {!enrollment && <Lock size={14} className="text-muted-foreground" />}
                    </div>
                  );
                  return enrollment ? (
                    <Link key={activity.id} to={`/lms/actividades/${activity.id}`}>{body}</Link>
                  ) : (
                    <div key={activity.id} className="opacity-70">{body}</div>
                  );
                })}
                {(unit.activities ?? []).length === 0 && (
                  <p className="text-sm text-muted-foreground">Sin actividades publicadas todavía.</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {(course.units ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">Este curso todavía no tiene unidades publicadas.</p>
        )}
      </div>

      {enrollment?.status === "COMPLETED" && (
        <div className="mt-6 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 size={16} /> ¡Completaste este curso!
        </div>
      )}
    </div>
  );
}
