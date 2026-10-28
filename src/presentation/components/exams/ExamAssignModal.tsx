import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { BookOpen, X } from "lucide-react";
import { LANGUAGE_CONFIGS } from "../../pages/public/Playground/templates/index";
import { examUseCases } from "../../../infrastructure/factories/exam-module.factory";
import { playgroundTemplateUseCases } from "../../../infrastructure/factories/playground-template-module.factory";
import { examTemplateUseCases } from "../../../infrastructure/factories/exam-template-module.factory";
import { adminUserUseCases } from "../../../infrastructure/factories/admin-user-module.factory";
import { institutionUseCases, studyCourseUseCases } from "../../../infrastructure/factories/tutorial-module.factory";
import { AssignExamPayload, ExamProject } from "../../../domain/entities/exam.entity";
import {
  DEFAULT_TIMEZONE_OFFSET_MINUTES,
  TIMEZONE_OPTIONS,
  fromOffsetInputValue,
} from "../../lib/timezone";

interface Institution { id: string; name: string; }
interface StudyCourse { id: string; name: string; institution_id?: string; }
interface AdminUser { id: string; first_name: string; last_name: string; email: string; }

async function fetchInstitutions() { return institutionUseCases.listAdmin() as Promise<Institution[]>; }
async function fetchCourses() { return studyCourseUseCases.listAdmin() as Promise<StudyCourse[]>; }
async function fetchStudents() {
  const page = await adminUserUseCases.list({ user_type: "student", page_size: 100 });
  return page.data as unknown as AdminUser[];
}

export interface ExamAssignModalProps {
  onClose: () => void;
  onSuccess?: (result: { data: ExamProject[]; count: number; exam_group_id: string }) => void;
  /**
   * When set, the modal is locked to this LMS course: no "Modo de Envío" (course/student)
   * picker is shown — the exam is assigned to every actively-enrolled student in this course.
   * Used from the teacher's own course screen (and by an admin managing any course), as opposed
   * to the admin dashboard's free-form course/student picker.
   */
  lmsCourseId?: string;
  lmsCourseLabel?: string;
  initialAssignKind?: "exam" | "practice";
  initialInitMode?: "none" | "template" | "examTemplate";
}

/** Shared "assign a Playground exam" form — used by the admin dashboard (AdminAssignments.tsx,
 *  with full course/student targeting) and by a teacher's own LMS course screen
 *  (TeacherLmsCourseEditor.tsx, locked via `lmsCourseId` to that course's roster). */
export default function ExamAssignModal({
  onClose,
  onSuccess,
  lmsCourseId,
  lmsCourseLabel,
  initialAssignKind = "exam",
  initialInitMode = "none",
}: ExamAssignModalProps) {
  const locked = !!lmsCourseId;

  const [examName, setExamName] = useState("");
  const [examLang, setExamLang] = useState("python");
  const [examTemplateId, setExamTemplateId] = useState("");
  const [initMode, setInitMode] = useState<"none" | "template" | "examTemplate">(initialInitMode);
  const [examExamTemplateId, setExamExamTemplateId] = useState("");
  const [examFileMode, setExamFileMode] = useState<"perQuestion" | "single">("perQuestion");
  const [examMateria, setExamMateria] = useState("");
  const [examStart, setExamStart] = useState("");
  const [examEnd, setExamEnd] = useState("");
  const [examCopyPaste, setExamCopyPaste] = useState(false);
  const [examRequireSeb, setExamRequireSeb] = useState(false);
  const [examTimezoneOffset, setExamTimezoneOffset] = useState(DEFAULT_TIMEZONE_OFFSET_MINUTES);
  const [assignKind, setAssignKind] = useState<"exam" | "practice">(initialAssignKind);
  const [assignMode, setAssignMode] = useState<"course" | "student">("course");
  const [targetInstFilter, setTargetInstFilter] = useState("");
  const [targetInstId, setTargetInstId] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<AdminUser[]>([]);

  const instsQ    = useQuery({ queryKey: ["admin-institutions"],       queryFn: fetchInstitutions, enabled: !locked });
  const coursesQ  = useQuery({ queryKey: ["admin-courses"],            queryFn: fetchCourses,      enabled: !locked });
  const studentsQ = useQuery({ queryKey: ["admin-students-lite"],      queryFn: fetchStudents,     enabled: !locked });
  const templatesQ = useQuery({ queryKey: ["playground-templates-for-exam", examLang], queryFn: () => playgroundTemplateUseCases.list(examLang) });
  const examTemplatesQ = useQuery({ queryKey: ["exam-templates-for-assign"],           queryFn: () => examTemplateUseCases.list() });

  const assignMutation = useMutation({
    mutationFn: (payload: AssignExamPayload) => examUseCases.assign(payload),
    onSuccess: (result) => { onSuccess?.(result); onClose(); },
    onError: (err: any) => alert("Error al asignar: " + (err?.response?.data?.message ?? "Desconocido")),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!examName.trim()) return;
    const payload: any = assignKind === "practice"
      ? { name: examName.trim(), language: examLang, materia: examMateria || undefined, isPractice: true }
      : {
          name: examName.trim(), language: examLang,
          materia: examMateria || undefined,
          start_time: examStart ? fromOffsetInputValue(examStart, examTimezoneOffset) : undefined,
          end_time:   examEnd   ? fromOffsetInputValue(examEnd, examTimezoneOffset)   : undefined,
          allow_copy_paste: examCopyPaste,
          require_seb: examRequireSeb,
          timezone_offset_minutes: examTimezoneOffset,
        };
    if (initMode === "examTemplate") {
      if (!examExamTemplateId) { alert("Seleccione un examen con variantes."); return; }
      payload.examTemplateId = examExamTemplateId;
      payload.fileMode = examFileMode;
    } else if (initMode === "template" && examTemplateId) {
      payload.templateId = examTemplateId;
    } else {
      const langConfig = LANGUAGE_CONFIGS[examLang as keyof typeof LANGUAGE_CONFIGS];
      payload.files = langConfig?.defaultFiles?.map((f, i) => ({ ...f, id: `exam-init-${i}` })) ?? [];
    }
    if (locked) {
      payload.lmsCourseId = lmsCourseId;
    } else if (assignMode === "course") {
      if (!targetInstId) { alert("Seleccione un curso."); return; }
      payload.courseId = targetInstId;
    } else {
      if (!selectedStudents.length) { alert("Seleccione al menos un alumno."); return; }
      payload.studentIds = selectedStudents.map((s) => s.id);
    }
    assignMutation.mutate(payload);
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[200] p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6 w-full max-w-xl shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3 mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2 text-gray-800 dark:text-white">
            <BookOpen size={20} className="text-blue-500" />
            {assignKind === "practice" ? "Compartir Simulacro de Práctica" : locked ? "Asignar examen al curso" : "Asignar Nuevo Examen"}
          </h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tipo</label>
            <select
              value={assignKind}
              onChange={(e) => {
                const kind = e.target.value as "exam" | "practice";
                setAssignKind(kind);
                if (kind === "practice") setInitMode("examTemplate");
              }}
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md p-2 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-blue-500"
            >
              <option value="exam">Examen (evaluado, con restricciones)</option>
              <option value="practice">Simulacro (práctica libre, sin restricciones)</option>
            </select>
          </div>

          {locked ? (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/50 rounded-lg p-3 text-sm text-blue-800 dark:text-blue-300">
              Se asignará a todos los alumnos matriculados en <strong>{lmsCourseLabel ?? "este curso"}</strong>.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Modo de Envío</label>
                <select value={assignMode} onChange={(e) => { setAssignMode(e.target.value as any); setTargetInstId(""); setTargetInstFilter(""); }}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md p-2 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-blue-500">
                  <option value="course">Masivo: Por Curso/Carrera</option>
                  <option value="student">Individual: Alumno Específico</option>
                </select>
              </div>
              {assignMode === "course" ? (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Institución *</label>
                    <select required value={targetInstFilter} onChange={(e) => { setTargetInstFilter(e.target.value); setTargetInstId(""); }}
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md p-2 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-blue-500">
                      <option value="">— Elija —</option>
                      {instsQ.data?.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                    </select>
                  </div>
                  {targetInstFilter && (
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Curso *</label>
                      <select required value={targetInstId} onChange={(e) => setTargetInstId(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md p-2 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-blue-500">
                        <option value="">— Elija —</option>
                        {coursesQ.data?.filter((c) => c.institution_id === targetInstFilter).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  )}
                </>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Buscar Alumnos *</label>
                  <div className="relative">
                    <input type="text" value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)}
                      placeholder="Nombre, apellido o correo…"
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md p-2 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-blue-500" />
                    {studentSearch && (
                      <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50">
                        {studentsQ.data?.filter((s) => !selectedStudents.find((ss) => ss.id === s.id) && (`${s.first_name} ${s.last_name} ${s.email}`).toLowerCase().includes(studentSearch.toLowerCase()))
                          .map((s) => (
                            <div key={s.id} onClick={() => { setSelectedStudents([...selectedStudents, s]); setStudentSearch(""); }}
                              className="p-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                              {s.first_name} {s.last_name} ({s.email})
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                  {selectedStudents.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedStudents.map((s) => (
                        <span key={s.id} className="inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-md text-xs border border-blue-200 dark:border-blue-800/50">
                          {s.first_name} {s.last_name}
                          <button type="button" onClick={() => setSelectedStudents(selectedStudents.filter((ss) => ss.id !== s.id))} className="hover:text-red-500">&times;</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre del examen *</label>
            <input required value={examName} onChange={(e) => setExamName(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md p-2 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-blue-500"
              placeholder="Ej: Prueba Parcial Algoritmos" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Lenguaje</label>
              <select value={examLang} onChange={(e) => { setExamLang(e.target.value); setExamTemplateId(""); }} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md p-2 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-blue-500">
                {["python", "javascript", "typescript", "java", "kotlin", "dart", "flutter", "nestjs", "html", "html-array", "html-design", "react", "react-crud", "react-cypress", "react-native", "vue", "angular"].map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Materia</label>
              <input value={examMateria} onChange={(e) => setExamMateria(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md p-2 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-blue-500" />
            </div>
          </div>

          {assignKind === "exam" && (
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Contenido inicial</label>
              <select value={initMode} onChange={(e) => { setInitMode(e.target.value as any); setExamTemplateId(""); setExamExamTemplateId(""); }} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md p-2 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-blue-500">
                <option value="none">Archivo por defecto</option>
                <option value="template">Plantilla de Playground</option>
                <option value="examTemplate">Examen con variantes (IA)</option>
              </select>
            </div>
          )}

          {initMode === "template" && (
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Plantilla</label>
              <select value={examTemplateId} onChange={(e) => setExamTemplateId(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md p-2 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-blue-500">
                <option value="">— Elija —</option>
                {(templatesQ.data ?? []).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          )}

          {initMode === "examTemplate" && (
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-900/50 p-3 rounded-lg space-y-3">
              <div>
                <label className="block text-xs font-bold text-purple-700 dark:text-purple-400 uppercase mb-1">Examen con variantes *</label>
                <select value={examExamTemplateId} onChange={(e) => setExamExamTemplateId(e.target.value)} className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md p-2 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-purple-500">
                  <option value="">— Elija —</option>
                  {(examTemplatesQ.data ?? []).map((t) => <option key={t.id} value={t.id}>{t.name} ({t.versions?.length ?? 0} temas)</option>)}
                </select>
                <p className="text-[10px] text-gray-500 mt-1">A cada alumno se le asignará automáticamente un tema distinto (round-robin), en rotación.</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-purple-700 dark:text-purple-400 uppercase mb-1">Distribución de archivos</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 text-sm text-gray-800 dark:text-gray-200 cursor-pointer">
                    <input type="radio" name="fileMode" checked={examFileMode === "perQuestion"} onChange={() => setExamFileMode("perQuestion")} className="accent-purple-600" />
                    Un archivo por pregunta
                  </label>
                  <label className="flex items-center gap-1.5 text-sm text-gray-800 dark:text-gray-200 cursor-pointer">
                    <input type="radio" name="fileMode" checked={examFileMode === "single"} onChange={() => setExamFileMode("single")} className="accent-purple-600" />
                    Un solo archivo
                  </label>
                </div>
              </div>
            </div>
          )}

          {assignKind === "exam" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Apertura</label>
                <input type="datetime-local" value={examStart} onChange={(e) => setExamStart(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md p-2 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cierre</label>
                <input type="datetime-local" value={examEnd} onChange={(e) => setExamEnd(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md p-2 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-blue-500" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Zona horaria del examen</label>
                <select value={examTimezoneOffset} onChange={(e) => setExamTimezoneOffset(Number(e.target.value))}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md p-2 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-blue-500">
                  {TIMEZONE_OPTIONS.map((tz) => (
                    <option key={tz.offsetMinutes} value={tz.offsetMinutes}>{tz.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {assignKind === "exam" && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 p-3 rounded-lg space-y-2">
              <p className="text-xs font-bold text-red-600 dark:text-red-400 mb-2">RESTRICCIONES DE SEGURIDAD</p>
              <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-800 dark:text-gray-200">
                <input type="checkbox" checked={examCopyPaste} onChange={(e) => setExamCopyPaste(e.target.checked)} className="w-4 h-4 accent-red-500" />
                Permitir Copiar / Pegar
              </label>
              <p className="text-[10px] text-gray-500 leading-tight">
                Al estar bloqueado, el sistema capturará cada cambio de pestaña del alumno como posible fraude.
              </p>
              <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-800 dark:text-gray-200 pt-1">
                <input type="checkbox" checked={examRequireSeb} onChange={(e) => setExamRequireSeb(e.target.checked)} className="w-4 h-4 accent-blue-500" />
                Requerir Safe Exam Browser (SEB)
              </label>
              {examRequireSeb && (
                <p className="text-[10px] text-blue-600 dark:text-blue-400 leading-tight">
                  El alumno solo podrá acceder desde Safe Exam Browser. No compatible con Linux/Ubuntu.
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded font-bold text-sm transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={assignMutation.isPending} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-sm flex items-center gap-2 disabled:opacity-50 transition-colors shadow-md">
              {assignMutation.isPending ? "Asignando…" : "Asignar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
