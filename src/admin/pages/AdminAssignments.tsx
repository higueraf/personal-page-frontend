import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen, Search, Filter, Clock, AlertTriangle, AlertCircle,
  Code2, Pencil, Trash2, Shield, Calendar, ChevronRight, ArrowLeft,
  Users, CheckCircle2, XCircle, RotateCcw, Star,
} from "lucide-react";
import http from "../../shared/api/http";
import { LANGUAGE_CONFIGS } from "../../public/pages/Playground/templates";

// ── Tipos ──────────────────────────────────────────────────────────────────────

interface ExamGroup {
  group_id: string;
  name: string;
  materia: string | null;
  language: string;
  start_time: string | null;
  end_time: string | null;
  allow_copy_paste: boolean;
  created_at: string;
  total_count: number;
  submitted_count: number;
  cheating_count: number;
}

interface ExamProject {
  id: string;
  name: string;
  materia: string | null;
  status: string;
  start_time: string | null;
  end_time: string | null;
  allow_copy_paste: boolean;
  cheating_logs: Array<{ timestamp: string; action: string; details?: string }>;
  user?: { id: string; first_name: string; last_name: string; email: string };
  exam_group_id: string | null;
}

interface Institution { id: string; name: string; }
interface StudyCourse { id: string; name: string; institution_id?: string; }
interface AdminUser { id: string; first_name: string; last_name: string; email: string; }

// ── API ────────────────────────────────────────────────────────────────────────

const ALLOWED = ['admin', 'teacher'];

async function fetchGroups() {
  return (await http.get("/playground/admin/exam-groups")).data.data as ExamGroup[];
}
async function fetchGroupProjects(groupId: string) {
  return (await http.get(`/playground/admin/exam-groups/${groupId}/projects`)).data.data as ExamProject[];
}
async function fetchInstitutions() { return (await http.get("/admin/institutions")).data.data as Institution[]; }
async function fetchCourses() { return (await http.get("/admin/study-courses")).data.data as StudyCourse[]; }
async function fetchStudents() {
  return (await http.get("/admin/users", { params: { user_type: "student", page_size: 100 } })).data.data as AdminUser[];
}
async function assignExam(payload: any) { return (await http.post("/playground/admin/assign-exam", payload)).data; }
async function updateGroup(payload: { groupId: string; name?: string; start_time?: string; end_time?: string; allow_copy_paste?: boolean }) {
  const { groupId, ...data } = payload;
  return (await http.patch(`/playground/admin/exam-groups/${groupId}`, data)).data;
}
async function deleteGroup(groupId: string) {
  return (await http.delete(`/playground/admin/exam-groups/${groupId}`)).data;
}
async function changeProjectStatus(payload: { id: string; status: string }) {
  return (await http.patch(`/playground/admin/exam/${payload.id}/status`, { status: payload.status })).data;
}
async function changeGroupStatus(payload: { groupId: string; status: string }) {
  return (await http.patch(`/playground/admin/exam-groups/${payload.groupId}/status`, { status: payload.status })).data;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function statusInfo(project: ExamProject) {
  const now = new Date();
  const start = project.start_time ? new Date(project.start_time) : null;
  const end = project.end_time ? new Date(project.end_time) : null;

  if (project.status === "graded")    return { color: "bg-blue-100 text-blue-700",    text: "Calificado" };
  if (project.status === "submitted") return { color: "bg-purple-100 text-purple-700", text: "Entregado" };
  if (start && now < start)           return { color: "bg-yellow-100 text-yellow-700", text: "Programado" };
  if (end && now > end)               return { color: "bg-gray-100 text-gray-700",     text: "Expirado" };
  return                                     { color: "bg-green-100 text-green-700",   text: "En progreso" };
}

function fmtDate(iso: string | null) {
  if (!iso) return "Sin límite";
  return new Date(iso).toLocaleString("es-EC", { dateStyle: "short", timeStyle: "short" });
}

/** Converts a UTC ISO string to the local "YYYY-MM-DDTHH:mm" format for datetime-local inputs */
function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Converts a datetime-local string ("YYYY-MM-DDTHH:mm") to a full ISO string with timezone offset.
 *  This is critical: without this conversion the backend receives a naive timestamp and
 *  stores it as UTC regardless of the user's local timezone. */
function toISO(localStr: string): string {
  return new Date(localStr).toISOString();
}

function groupStatus(g: ExamGroup) {
  const now = new Date();
  const start = g.start_time ? new Date(g.start_time) : null;
  const end   = g.end_time   ? new Date(g.end_time)   : null;
  if (g.submitted_count === g.total_count && g.total_count > 0)
    return { color: "bg-purple-100 text-purple-700 border-purple-300", text: "Todos entregados" };
  if (start && now < start)
    return { color: "bg-yellow-100 text-yellow-700 border-yellow-300", text: "Programado" };
  if (end && now > end)
    return { color: "bg-gray-100 text-gray-600 border-gray-300",       text: "Cerrado" };
  return       { color: "bg-green-100 text-green-700 border-green-300",  text: "Activo" };
}

// ── Componente ─────────────────────────────────────────────────────────────────

export default function AdminAssignments() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const qc = useQueryClient();

  const activeGroup = searchParams.get("group");

  const [search, setSearch] = useState("");

  // ── Assign modal ──
  const [isModalOpen,      setIsModalOpen]      = useState(false);
  const [examName,         setExamName]         = useState("");
  const [examLang,         setExamLang]         = useState("python");
  const [examMateria,      setExamMateria]      = useState("");
  const [examStart,        setExamStart]        = useState("");
  const [examEnd,          setExamEnd]          = useState("");
  const [examCopyPaste,    setExamCopyPaste]    = useState(false);
  const [assignMode,       setAssignMode]       = useState<"course"|"student">("course");
  const [targetInstFilter, setTargetInstFilter] = useState("");
  const [targetInstId,     setTargetInstId]     = useState("");
  const [studentSearch,    setStudentSearch]    = useState("");
  const [selectedStudents, setSelectedStudents] = useState<AdminUser[]>([]);

  // ── Edit modal ──
  const [editGroup,     setEditGroup]     = useState<ExamGroup | null>(null);
  const [editName,      setEditName]      = useState("");
  const [editStart,     setEditStart]     = useState("");
  const [editEnd,       setEditEnd]       = useState("");
  const [editCopyPaste, setEditCopyPaste] = useState(false);

  // ── Delete confirm modal ──
  const [confirmDelete, setConfirmDelete] = useState<ExamGroup | null>(null);

  // ── Logs modal ──
  const [viewLogsOf, setViewLogsOf] = useState<ExamProject | null>(null);

  // ── Queries ──
  const groupsQ   = useQuery({ queryKey: ["admin-exam-groups"],                             queryFn: fetchGroups });
  const projectsQ = useQuery({ queryKey: ["admin-exam-projects", activeGroup],              queryFn: () => fetchGroupProjects(activeGroup!), enabled: !!activeGroup });
  const instsQ    = useQuery({ queryKey: ["admin-institutions"],                             queryFn: fetchInstitutions });
  const coursesQ  = useQuery({ queryKey: ["admin-courses"],                                  queryFn: fetchCourses });
  const studentsQ = useQuery({ queryKey: ["admin-students-lite"],                            queryFn: fetchStudents });

  // ── Mutations ──
  const assignMutation = useMutation({
    mutationFn: assignExam,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-exam-groups"] }); setIsModalOpen(false); },
    onError: (err: any) => alert("Error al asignar: " + (err?.response?.data?.message ?? "Desconocido")),
  });

  const editMutation = useMutation({
    mutationFn: updateGroup,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-exam-groups"] });
      qc.invalidateQueries({ queryKey: ["admin-exam-projects", activeGroup] });
      setEditGroup(null);
    },
    onError: (err: any) => alert("Error al editar: " + (err?.response?.data?.message ?? "Desconocido")),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteGroup,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-exam-groups"] });
      setConfirmDelete(null);
      if (activeGroup) setSearchParams({});
    },
    onError: (err: any) => { alert("Error al eliminar: " + (err?.response?.data?.message ?? "Desconocido")); setConfirmDelete(null); },
  });

  const changeStatusMutation = useMutation({
    mutationFn: changeProjectStatus,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-exam-projects", activeGroup] });
      qc.invalidateQueries({ queryKey: ["admin-exam-groups"] });
    },
    onError: (err: any) => alert("Error al cambiar estado: " + (err?.response?.data?.message ?? "Desconocido")),
  });

  const changeGroupStatusMutation = useMutation({
    mutationFn: changeGroupStatus,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-exam-projects", activeGroup] });
      qc.invalidateQueries({ queryKey: ["admin-exam-groups"] });
    },
    onError: (err: any) => alert("Error al cambiar estado masivo: " + (err?.response?.data?.message ?? "Desconocido")),
  });

  // ── Handlers ──
  function handleAssignSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!examName.trim()) return;
    const langConfig = LANGUAGE_CONFIGS[examLang as keyof typeof LANGUAGE_CONFIGS];
    const defaultFiles = langConfig?.defaultFiles?.map((f, i) => ({ ...f, id: `exam-init-${i}` })) ?? [];
    const payload: any = {
      name: examName.trim(), language: examLang,
      materia: examMateria || undefined,
      start_time: examStart ? toISO(examStart) : undefined,
      end_time:   examEnd   ? toISO(examEnd)   : undefined,
      allow_copy_paste: examCopyPaste, files: defaultFiles,
    };
    if (assignMode === "course") {
      if (!targetInstId) { alert("Seleccione un curso."); return; }
      payload.courseId = targetInstId;
    } else {
      if (!selectedStudents.length) { alert("Seleccione al menos un alumno."); return; }
      payload.studentIds = selectedStudents.map(s => s.id);
    }
    assignMutation.mutate(payload);
  }

  function openEditModal(g: ExamGroup) {
    setEditGroup(g);
    setEditName(g.name);
    setEditCopyPaste(g.allow_copy_paste);
    setEditStart(toLocalInput(g.start_time));
    setEditEnd(toLocalInput(g.end_time));
  }

  function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editGroup) return;
    editMutation.mutate({
      groupId: editGroup.group_id,
      name: editName || undefined,
      start_time: editStart ? toISO(editStart) : undefined,
      end_time:   editEnd   ? toISO(editEnd)   : undefined,
      allow_copy_paste: editCopyPaste,
    });
  }

  function handleDeleteGroup(group: ExamGroup) {
    setConfirmDelete(group);
  }

  const filteredGroups = (groupsQ.data ?? []).filter(g => {
    if (!search) return true;
    const q = search.toLowerCase();
    return g.name.toLowerCase().includes(q) || (g.materia ?? "").toLowerCase().includes(q);
  });

  const currentGroup = activeGroup ? groupsQ.data?.find(g => g.group_id === activeGroup) : null;

  // ══════════════════════════════════════════════════════════════════
  // LEVEL 2: Project list for a specific exam group
  // ══════════════════════════════════════════════════════════════════
  if (activeGroup) {
    const projects = projectsQ.data ?? [];

    return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSearchParams({})}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              <ArrowLeft size={18} /> Volver a exámenes
            </button>
            <div className="h-5 border-l border-gray-300 dark:border-gray-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-800 dark:text-white">{currentGroup?.name ?? "Examen"}</h1>
              {currentGroup?.materia && (
                <span className="text-xs text-gray-500">{currentGroup.materia}</span>
              )}
            </div>
          </div>

          {/* Bulk status change */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-gray-500 font-medium">Cambiar todos a:</span>
            {[
              { status: "pending",   label: "Reabierto",  icon: <RotateCcw size={13} />, cls: "bg-orange-100 hover:bg-orange-200 text-orange-700 border-orange-300" },
              { status: "submitted", label: "Entregado",  icon: <CheckCircle2 size={13} />, cls: "bg-purple-100 hover:bg-purple-200 text-purple-700 border-purple-300" },
              { status: "graded",    label: "Calificado", icon: <Star size={13} />, cls: "bg-blue-100 hover:bg-blue-200 text-blue-700 border-blue-300" },
            ].map(({ status, label, icon, cls }) => (
              <button
                key={status}
                onClick={() => { if (activeGroup && window.confirm(`¿Cambiar el estado de TODOS los alumnos a "${label}"?`)) changeGroupStatusMutation.mutate({ groupId: activeGroup, status }); }}
                disabled={changeGroupStatusMutation.isPending}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors disabled:opacity-50 ${cls}`}
              >
                {icon} {label}
              </button>
            ))}
          </div>
        </header>

        {/* Stats bar */}
        {currentGroup && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Alumnos",   value: currentGroup.total_count,     icon: <Users size={16} />,       color: "text-blue-600" },
              { label: "Entregados", value: currentGroup.submitted_count, icon: <CheckCircle2 size={16} />, color: "text-purple-600" },
              { label: "Pendientes", value: currentGroup.total_count - currentGroup.submitted_count, icon: <XCircle size={16} />, color: "text-orange-500" },
              { label: "Con alertas", value: currentGroup.cheating_count, icon: <AlertTriangle size={16} />, color: "text-red-600" },
            ].map(s => (
              <div key={s.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-3">
                <span className={s.color}>{s.icon}</span>
                <div>
                  <div className="text-xl font-bold text-gray-800 dark:text-white">{s.value}</div>
                  <div className="text-xs text-gray-500">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Projects table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          {projectsQ.isLoading ? (
            <div className="p-8 text-center text-gray-500 animate-pulse">Cargando alumnos…</div>
          ) : projects.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Sin proyectos en este examen.</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-4 font-bold text-gray-700 dark:text-gray-300">Alumno</th>
                  <th className="px-6 py-4 font-bold text-gray-700 dark:text-gray-300 text-center">Estado</th>
                  <th className="px-6 py-4 font-bold text-gray-700 dark:text-gray-300 text-center">Alertas</th>
                  <th className="px-6 py-4 font-bold text-gray-700 dark:text-gray-300 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {projects.map(p => {
                  const st = statusInfo(p);
                  const hasCheated = p.cheating_logs?.length > 0;
                  const isChanging = changeStatusMutation.isPending && changeStatusMutation.variables?.id === p.id;
                  return (
                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {p.user ? `${p.user.first_name} ${p.user.last_name}` : "Desconocido"}
                        </div>
                        <div className="text-[10px] text-gray-500">{p.user?.email}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center gap-1.5">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border border-current ${st.color}`}>
                            {isChanging ? "…" : st.text}
                          </span>
                          <select
                            value={p.status}
                            disabled={isChanging}
                            onChange={e => changeStatusMutation.mutate({ id: p.id, status: e.target.value })}
                            className="text-[10px] border border-gray-200 dark:border-gray-700 rounded px-1.5 py-0.5 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 outline-none focus:border-blue-400 cursor-pointer disabled:opacity-50"
                          >
                            <option value="pending">Reabierto (pending)</option>
                            <option value="submitted">Entregado (submitted)</option>
                            <option value="graded">Calificado (graded)</option>
                          </select>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {hasCheated ? (
                          <button
                            onClick={() => setViewLogsOf(p)}
                            className="inline-flex items-center gap-1 text-red-600 bg-red-100 hover:bg-red-200 px-2 py-1 rounded border border-red-200 font-bold text-xs transition-colors"
                          >
                            <AlertTriangle size={13} /> {p.cheating_logs.length}
                          </button>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => navigate(`/playground/${p.id}?review=1&from=${activeGroup}`)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
                        >
                          <Code2 size={13} /> Ver código
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Logs modal */}
        {viewLogsOf && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[200] p-4" onClick={e => { if (e.target === e.currentTarget) setViewLogsOf(null); }}>
            <div className="bg-white dark:bg-[#161b22] border border-gray-200 dark:border-gray-700 rounded-xl p-6 w-full max-w-lg shadow-2xl">
              <h3 className="text-lg font-bold flex items-center gap-2 text-red-600 border-b border-gray-100 dark:border-gray-800 pb-3 mb-4">
                <AlertCircle size={20} /> Historial de Infracciones
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Alumno: <strong>{viewLogsOf.user ? `${viewLogsOf.user.first_name} ${viewLogsOf.user.last_name}` : "Desconocido"}</strong>
              </p>
              <div className="max-h-60 overflow-y-auto space-y-3 pr-2">
                {viewLogsOf.cheating_logs.map((log, i) => (
                  <div key={i} className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 p-3 rounded-lg text-sm">
                    <div className="flex justify-between items-start mb-1">
                      <strong className="text-red-700 dark:text-red-400 flex items-center gap-2">
                        <Clock size={12} /> {new Date(log.timestamp).toLocaleString("es-EC")}
                      </strong>
                      <span className="bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-200 text-[10px] px-2 py-0.5 rounded font-mono uppercase">
                        {log.action}
                      </span>
                    </div>
                    <div className="text-red-900/80 dark:text-red-300/80 text-xs">{log.details || "Sin detalles"}</div>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex justify-end">
                <button onClick={() => setViewLogsOf(null)} className="bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-4 py-2 rounded font-semibold hover:bg-gray-300 dark:hover:bg-gray-700">
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // LEVEL 1: Exam groups list
  // ══════════════════════════════════════════════════════════════════
  return (
    <div className="p-6 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Gestión de Exámenes</h1>
          <p className="text-sm text-gray-500">Cada fila representa una asignación. Haz clic para ver los proyectos de cada alumno.</p>
        </div>
        <button
          onClick={() => { setExamName(""); setExamMateria(""); setTargetInstId(""); setTargetInstFilter(""); setSelectedStudents([]); setStudentSearch(""); setIsModalOpen(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all shadow-sm"
        >
          <BookOpen size={20} /> Asignar Nuevo Examen
        </button>
      </header>

      {/* Search */}
      <div className="flex gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input value={search} onChange={e => setSearch(e.target.value)} type="text" placeholder="Buscar por nombre o materia…"
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-blue-500" />
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 shrink-0">
          <Filter size={16} /> {filteredGroups.length} examen(es)
        </div>
      </div>

      {/* Groups table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        {groupsQ.isLoading ? (
          <div className="p-8 text-center text-gray-500 animate-pulse">Cargando exámenes…</div>
        ) : filteredGroups.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No hay exámenes asignados.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 font-bold text-gray-700 dark:text-gray-300">Examen</th>
                <th className="px-6 py-4 font-bold text-gray-700 dark:text-gray-300">Plazo</th>
                <th className="px-6 py-4 font-bold text-gray-700 dark:text-gray-300 text-center">Alumnos</th>
                <th className="px-6 py-4 font-bold text-gray-700 dark:text-gray-300 text-center">Estado</th>
                <th className="px-6 py-4 font-bold text-gray-700 dark:text-gray-300 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredGroups.map(g => {
                const st = groupStatus(g);
                return (
                  <tr
                    key={g.group_id}
                    className="hover:bg-blue-50/40 dark:hover:bg-blue-900/10 cursor-pointer transition-colors"
                    onClick={() => setSearchParams({ group: g.group_id })}
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        {g.name}
                        <ChevronRight size={14} className="text-gray-400" />
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {g.materia && (
                          <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] uppercase font-bold border border-blue-200">
                            {g.materia}
                          </span>
                        )}
                        {!g.allow_copy_paste && (
                          <span className="flex items-center gap-1 text-red-500 text-[10px] font-bold">
                            <Shield size={11} /> Alta Seguridad
                          </span>
                        )}
                        {g.cheating_count > 0 && (
                          <span className="flex items-center gap-1 text-amber-600 text-[10px] font-bold">
                            <AlertTriangle size={11} /> {g.cheating_count} alerta(s)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col text-[11px] text-gray-500 font-medium">
                        <span className="flex items-center gap-1"><Clock size={11} className="text-gray-400" /> Inicia: {fmtDate(g.start_time)}</span>
                        <span className="flex items-center gap-1"><Calendar size={11} className="text-gray-400" /> Vence: {fmtDate(g.end_time)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-gray-700 dark:text-gray-300 font-medium">
                        {g.submitted_count}/{g.total_count}
                      </span>
                      <div className="text-[10px] text-gray-400">entregados</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${st.color}`}>
                        {st.text}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-1" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => openEditModal(g)}
                          title="Editar"
                          className="p-1.5 rounded text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteGroup(g)}
                          title="Eliminar examen y todos sus proyectos"
                          className="p-1.5 rounded transition-colors text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Edit modal ─────────────────────────────────────────────── */}
      {editGroup && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[200] p-4" onClick={e => { if (e.target === e.currentTarget) setEditGroup(null); }}>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold flex items-center gap-2 text-gray-800 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3 mb-4">
              <Pencil size={18} className="text-amber-500" /> Editar Examen
            </h3>
            <p className="text-xs text-gray-500 mb-4">Los cambios se aplicarán a <strong>todos los alumnos</strong> de esta asignación.</p>
            <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre</label>
                <input value={editName} onChange={e => setEditName(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md p-2 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Apertura</label>
                  <input type="datetime-local" value={editStart} onChange={e => setEditStart(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md p-2 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cierre</label>
                  <input type="datetime-local" value={editEnd} onChange={e => setEditEnd(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md p-2 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-blue-500" />
                </div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 p-3 rounded-lg">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-800 dark:text-gray-200">
                  <input type="checkbox" checked={editCopyPaste} onChange={e => setEditCopyPaste(e.target.checked)} className="w-4 h-4 accent-red-500" />
                  Permitir Copiar / Pegar
                </label>
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                <button type="button" onClick={() => setEditGroup(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded font-bold text-sm transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={editMutation.isPending}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded font-bold text-sm flex items-center gap-2 disabled:opacity-50 transition-colors shadow-md">
                  {editMutation.isPending ? "Guardando…" : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete confirmation modal ──────────────────────────────── */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[200] p-4"
          onClick={e => { if (e.target === e.currentTarget) setConfirmDelete(null); }}>
          <div className="bg-white dark:bg-gray-900 border border-red-200 dark:border-red-900/50 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold flex items-center gap-2 text-red-600 border-b border-gray-100 dark:border-gray-800 pb-3 mb-4">
              <Trash2 size={18} /> Eliminar Examen
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
              ¿Estás seguro de que deseas eliminar el examen <strong>"{confirmDelete.name}"</strong>?
            </p>
            <p className="text-xs text-red-500 mb-6">
              Esta acción eliminará permanentemente <strong>{confirmDelete.total_count} proyecto(s)</strong> de alumnos asociados y no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded font-bold text-sm transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => deleteMutation.mutate(confirmDelete.group_id)}
                disabled={deleteMutation.isPending}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-bold text-sm flex items-center gap-2 disabled:opacity-50 transition-colors shadow-md"
              >
                <Trash2 size={14} /> {deleteMutation.isPending ? "Eliminando…" : "Sí, eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Assign modal ───────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[200] p-4" onClick={e => { if (e.target === e.currentTarget) setIsModalOpen(false); }}>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6 w-full max-w-xl shadow-2xl overflow-y-auto max-h-[90vh]">
            <h3 className="text-xl font-bold flex items-center gap-2 text-gray-800 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3 mb-4">
              <BookOpen size={20} className="text-blue-500" /> Asignar Nuevo Examen
            </h3>
            <form onSubmit={handleAssignSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Modo de Envío</label>
                  <select value={assignMode} onChange={e => { setAssignMode(e.target.value as any); setTargetInstId(""); setTargetInstFilter(""); }}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md p-2 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-blue-500">
                    <option value="course">Masivo: Por Curso/Carrera</option>
                    <option value="student">Individual: Alumno Específico</option>
                  </select>
                </div>
                {assignMode === "course" ? (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Institución *</label>
                      <select required value={targetInstFilter} onChange={e => { setTargetInstFilter(e.target.value); setTargetInstId(""); }}
                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md p-2 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-blue-500">
                        <option value="">— Elija —</option>
                        {instsQ.data?.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                      </select>
                    </div>
                    {targetInstFilter && (
                      <div className="col-span-2">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Curso *</label>
                        <select required value={targetInstId} onChange={e => setTargetInstId(e.target.value)}
                          className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md p-2 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-blue-500">
                          <option value="">— Elija —</option>
                          {coursesQ.data?.filter(c => c.institution_id === targetInstFilter).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                    )}
                  </>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Buscar Alumnos *</label>
                    <div className="relative">
                      <input type="text" value={studentSearch} onChange={e => setStudentSearch(e.target.value)}
                        placeholder="Nombre, apellido o correo…"
                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md p-2 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-blue-500" />
                      {studentSearch && (
                        <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50">
                          {studentsQ.data?.filter(s => !selectedStudents.find(ss => ss.id === s.id) && (`${s.first_name} ${s.last_name} ${s.email}`).toLowerCase().includes(studentSearch.toLowerCase()))
                            .map(s => (
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
                        {selectedStudents.map(s => (
                          <span key={s.id} className="inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-md text-xs border border-blue-200 dark:border-blue-800/50">
                            {s.first_name} {s.last_name}
                            <button type="button" onClick={() => setSelectedStudents(selectedStudents.filter(ss => ss.id !== s.id))} className="hover:text-red-500">&times;</button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre del examen *</label>
                <input required value={examName} onChange={e => setExamName(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md p-2 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-blue-500"
                  placeholder="Ej: Prueba Parcial Algoritmos" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Lenguaje</label>
                  <select value={examLang} onChange={e => setExamLang(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md p-2 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-blue-500">
                    {["python","javascript","typescript","java","kotlin","dart","html","react","vue","angular"].map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Materia</label>
                  <input value={examMateria} onChange={e => setExamMateria(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md p-2 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-blue-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Apertura</label>
                  <input type="datetime-local" value={examStart} onChange={e => setExamStart(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md p-2 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cierre</label>
                  <input type="datetime-local" value={examEnd} onChange={e => setExamEnd(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md p-2 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-blue-500" />
                </div>
              </div>

              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 p-3 rounded-lg">
                <p className="text-xs font-bold text-red-600 dark:text-red-400 mb-2">RESTRICCIONES DE SEGURIDAD</p>
                <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-800 dark:text-gray-200">
                  <input type="checkbox" checked={examCopyPaste} onChange={e => setExamCopyPaste(e.target.checked)} className="w-4 h-4 accent-red-500" />
                  Permitir Copiar / Pegar
                </label>
                <p className="text-[10px] text-gray-500 mt-1 leading-tight">
                  Al estar bloqueado, el sistema capturará cada cambio de pestaña del alumno como posible fraude.
                </p>
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded font-bold text-sm transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={assignMutation.isPending} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-sm flex items-center gap-2 disabled:opacity-50 transition-colors shadow-md">
                  {assignMutation.isPending ? "Asignando…" : "Asignar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
