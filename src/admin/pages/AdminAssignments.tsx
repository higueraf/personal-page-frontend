import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Users, Calendar, Shield, Search, Filter, Clock, AlertTriangle, BookOpen, AlertCircle } from "lucide-react";
import http from "../../shared/api/http";

// ── Tipos ──────────────────────────────────────────────────────────────────────

interface PlaygroundExam {
  id: string;
  name: string;
  materia: string | null;
  status: string;
  start_time: string | null;
  end_time: string | null;
  allow_copy_paste: boolean;
  cheating_logs: Array<{ timestamp: string; action: string; details?: string }>;
  user?: { id: string; first_name: string; last_name: string; email: string; };
  studentName?: string;
}

interface Institution { id: string; name: string; }
interface StudyCourse { id: string; name: string; institution_id?: string; }
interface AdminUser { id: string; first_name: string; last_name: string; email: string; }

// ── API ────────────────────────────────────────────────────────────────────────

async function fetchExams() { return (await http.get("/playground/admin/exams")).data.data as PlaygroundExam[]; }
async function fetchInstitutions() { return (await http.get("/admin/institutions")).data.data as Institution[]; }
async function fetchCourses() { return (await http.get("/admin/study-courses")).data.data as StudyCourse[]; }
async function fetchStudents() { return (await http.get("/admin/users", { params: { user_type: "student", page_size: 100 } })).data.data as AdminUser[]; }
async function assignExam(payload: any) { return (await http.post("/playground/admin/assign-exam", payload)).data; }

// ── Componente ─────────────────────────────────────────────────────────────────

export default function AdminAssignments() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [examName,   setExamName]     = useState("");
  const [examLang,   setExamLang]     = useState("python");
  const [examMateria,setExamMateria]  = useState("");
  const [examStart,  setExamStart]    = useState("");
  const [examEnd,    setExamEnd]      = useState("");
  const [examCopyPaste, setExamCopyPaste] = useState(false);
  const [assignMode, setAssignMode]   = useState<"course"|"student">("course");
  const [targetInstFilter, setTargetInstFilter] = useState("");
  const [targetInstId, setTargetInstId] = useState("");

  const [viewLogsOf, setViewLogsOf] = useState<PlaygroundExam | null>(null);

  const examsQ   = useQuery({ queryKey: ["admin-exams"], queryFn: fetchExams });
  const instsQ   = useQuery({ queryKey: ["admin-institutions"], queryFn: fetchInstitutions });
  const coursesQ = useQuery({ queryKey: ["admin-courses"], queryFn: fetchCourses });
  const studentsQ= useQuery({ queryKey: ["admin-students-lite"], queryFn: fetchStudents });

  const assignMutation = useMutation({
    mutationFn: assignExam,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-exams"] });
      setIsModalOpen(false);
      alert("Examen(es) asignados exitosamente.");
    },
    onError: (err: any) => {
      alert("Error al asignar: " + (err?.response?.data?.message ?? "Desconocido"));
    }
  });

  const parsedExams = (examsQ.data || []).map((ex) => {
    let computedStatus = "active";
    let statusColor = "bg-green-100 text-green-700";
    let statusText = "En progreso";

    const now = new Date();
    const start = ex.start_time ? new Date(ex.start_time) : null;
    const end = ex.end_time ? new Date(ex.end_time) : null;

    if (ex.status === "graded") {
      computedStatus = "graded";
      statusColor = "bg-blue-100 text-blue-700";
      statusText = "Calificado";
    } else if (ex.status === "submitted") {
      computedStatus = "submitted";
      statusColor = "bg-purple-100 text-purple-700";
      statusText = "Entregado";
    } else {
      if (start && now < start) {
        computedStatus = "scheduled";
        statusColor = "bg-yellow-100 text-yellow-700";
        statusText = "Programado";
      } else if (end && now > end) {
        computedStatus = "expired";
        statusColor = "bg-gray-100 text-gray-700";
        statusText = "Expirado / Cerrado";
      }
    }

    return {
      ...ex,
      studentName: ex.user ? `${ex.user.first_name} ${ex.user.last_name}` : "Desconocido",
      computedStatus, statusColor, statusText,
      formattedStart: start ? start.toLocaleString("es-EC", { dateStyle: "short", timeStyle: "short" }) : "Sin límite",
      formattedEnd: end ? end.toLocaleString("es-EC", { dateStyle: "short", timeStyle: "short" }) : "Sin límite",
      hasCheated: Array.isArray(ex.cheating_logs) && ex.cheating_logs.length > 0,
    };
  });

  const filteredExams = parsedExams.filter((ex) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return ex.name.toLowerCase().includes(q) || ex.studentName.toLowerCase().includes(q);
  });

  function handleAssignSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!examName.trim() || !targetInstId) return;

    const payload: any = {
      name: examName.trim(),
      language: examLang,
      materia: examMateria || undefined,
      start_time: examStart || undefined,
      end_time: examEnd || undefined,
      allow_copy_paste: examCopyPaste,
    };

    if (assignMode === "course") {
      payload.courseId = targetInstId;
    } else {
      payload.studentId = targetInstId;
    }

    assignMutation.mutate(payload);
  }

  return (
    <div className="p-6 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Gestión de Exámenes y Proyectos</h1>
          <p className="text-sm text-gray-500">Revisa y monitorea los exámenes asignados de tus alumnos limitados por tiempo.</p>
        </div>
        
        <button 
          onClick={() => {
            setExamName(""); setExamMateria(""); setTargetInstId(""); setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all shadow-sm"
        >
          <BookOpen size={20} /> Asignar Nuevo Examen
        </button>
      </header>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            type="text"
            placeholder="Buscar por alumno o título de examen..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
           <Filter size={16} /> Mostrando {filteredExams.length} evaluación(es).
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        {examsQ.isLoading ? (
          <div className="p-8 text-center text-gray-500 animate-pulse">Cargando datos...</div>
        ) : filteredExams.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No hay asignaciones registradas que coincidan con la búsqueda.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 font-bold text-gray-700 dark:text-gray-300">Proyecto / Examen</th>
                <th className="px-6 py-4 font-bold text-gray-700 dark:text-gray-300">Alumno</th>
                <th className="px-6 py-4 font-bold text-gray-700 dark:text-gray-300">Materia</th>
                <th className="px-6 py-4 font-bold text-gray-700 dark:text-gray-300">Plazo</th>
                <th className="px-6 py-4 font-bold text-gray-700 dark:text-gray-300 text-center">Estado</th>
                <th className="px-6 py-4 font-bold text-gray-700 dark:text-gray-300 text-center">Alertas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredExams.map(ass => (
                <tr key={ass.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900 dark:text-white">{ass.name}</div>
                    <div className="flex items-center gap-1 mt-1 text-xs">
                      {!ass.allow_copy_paste ? (
                        <span className="flex items-center gap-1 text-red-500 font-bold" title="No se permite copiar y pegar">
                          <Shield size={12} /> Alta Seguridad
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-gray-500">
                          <Shield size={12} /> Estandar
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-800 dark:text-gray-200 font-medium">{ass.studentName}</span>
                    <div className="text-[10px] text-gray-500">{ass.user?.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider border border-blue-200">
                      {ass.materia || "Sin materia"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col text-[11px] text-gray-500 font-medium">
                      <span className="flex items-center gap-1"><Clock size={11} className="text-gray-400" /> Inicia: {ass.formattedStart}</span>
                      <span className="flex items-center gap-1"><Calendar size={11} className="text-gray-400" /> Vence: {ass.formattedEnd}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border border-current ${ass.statusColor}`}>
                      {ass.statusText}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {ass.hasCheated ? (
                      <button 
                        onClick={() => setViewLogsOf(ass)}
                        className="inline-flex items-center gap-1 text-red-600 bg-red-100 hover:bg-red-200 px-2 py-1 rounded border border-red-200 font-bold text-xs cursor-pointer transition-colors"
                      >
                        <AlertTriangle size={14} /> {ass.cheating_logs.length} Avisos
                      </button>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Modal Log Fraude ────────────────────────────────────────── */}
      {viewLogsOf && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[200] p-4" onClick={(e) => { if(e.target===e.currentTarget) setViewLogsOf(null) }}>
          <div className="bg-white dark:bg-[#161b22] border border-gray-200 dark:border-gray-700 rounded-xl p-6 w-full max-w-lg shadow-2xl">
            <h3 className="text-lg font-bold flex items-center gap-2 text-red-600 border-b border-gray-100 dark:border-gray-800 pb-3 mb-4">
              <AlertCircle size={20} /> Historial de Infracciones
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              El estudiante <strong>{viewLogsOf.studentName}</strong> fue detectado violando las reglas del examen <strong>{viewLogsOf.name}</strong> en los siguientes horarios:
            </p>
            <div className="max-h-60 overflow-y-auto space-y-3 pr-2">
              {viewLogsOf.cheating_logs.map((log, i) => (
                <div key={i} className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 p-3 rounded-lg text-sm">
                  <div className="flex justify-between items-start mb-1">
                    <strong className="text-red-700 dark:text-red-400 flex items-center gap-2">
                      <Clock size={12} /> {new Date(log.timestamp).toLocaleTimeString("es-EC")}
                    </strong>
                    <span className="bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-200 text-[10px] px-2 py-0.5 rounded font-mono uppercase">
                      {log.action}
                    </span>
                  </div>
                  <div className="text-red-900/80 dark:text-red-300/80 text-xs">
                    {log.details || "Infracción no detallada"}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => setViewLogsOf(null)}
                className="bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-4 py-2 rounded font-semibold hover:bg-gray-300 dark:hover:bg-gray-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Asignar Examen Masivo ────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[200] p-4" onClick={(e) => { if(e.target===e.currentTarget) setIsModalOpen(false) }}>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6 w-full max-w-xl shadow-2xl">
            <h3 className="text-xl font-bold flex items-center gap-2 text-gray-800 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3 mb-4">
              <BookOpen size={20} className="text-blue-500" /> Asignar Nuevo Examen
            </h3>
            
            <form onSubmit={handleAssignSubmit} className="flex flex-col gap-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Modo de Envío</label>
                  <select 
                    value={assignMode} onChange={e => {setAssignMode(e.target.value as any); setTargetInstId(""); setTargetInstFilter("");}}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md p-2 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-blue-500"
                  >
                    <option value="course">Masivo: Por Curso/Carrera</option>
                    <option value="student">Individual: Alumno Específico</option>
                  </select>
                </div>
                
                {assignMode === "course" && (
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                      Filtrar por Institución
                    </label>
                    <select 
                      value={targetInstFilter} onChange={e => {setTargetInstFilter(e.target.value); setTargetInstId("");}}
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md p-2 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-blue-500"
                    >
                      <option value="">— Todas las Instituciones —</option>
                      {instsQ.data?.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Seleccionar {assignMode === "course" ? "Curso" : "Alumno"} *
                </label>
                <select 
                  required value={targetInstId} onChange={e => setTargetInstId(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md p-2 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-blue-500"
                >
                  <option value="">— Elija —</option>
                  {assignMode === "course" && coursesQ.data?.filter(c => !targetInstFilter || c.institution_id === targetInstFilter).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  {assignMode === "student" && studentsQ.data?.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre del examen *</label>
                <input required value={examName} onChange={e => setExamName(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md p-2 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-primary"
                  placeholder="Ej: Prueba Parcial Algoritmos" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Lenguaje</label>
                  <select value={examLang} onChange={e => setExamLang(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md p-2 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-blue-500">
                    <option value="python">Python</option>
                    <option value="node">Node.js</option>
                    <option value="typescript">TypeScript</option>
                    <option value="java">Java</option>
                    <option value="kotlin">Kotlin</option>
                    <option value="dart">Dart</option>
                    <option value="html">HTML/CSS/JS</option>
                    <option value="react">React</option>
                    <option value="vue">Vue.js</option>
                    <option value="angular">Angular</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Materia</label>
                  <input value={examMateria} onChange={e => setExamMateria(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md p-2 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-blue-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Apertura (Opcional)</label>
                  <input type="datetime-local" value={examStart} onChange={e => setExamStart(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md p-2 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cierre (Opcional)</label>
                  <input type="datetime-local" value={examEnd} onChange={e => setExamEnd(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md p-2 text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-blue-500" />
                </div>
              </div>

              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 p-3 rounded-lg mt-2">
                <p className="text-xs font-bold text-red-600 dark:text-red-400 mb-2">RESTICCIONES DE SEGURIDAD</p>
                <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-800 dark:text-gray-200">
                  <input type="checkbox" checked={examCopyPaste} onChange={e => setExamCopyPaste(e.target.checked)} className="w-4 h-4 cursor-pointer accent-red-500" />
                  Permitir Copiar / Pegar
                </label>
                <p className="text-[10px] text-gray-500 mt-1 leading-tight">
                  Al estar bloqueado, el sistema capturará cada vez que el alumno cambie de pestaña para advertirte de un posible fraude, mostrándolo en tu registro con hora exacta.
                </p>
              </div>

              <div className="flex justify-end gap-3 mt-4 border-t border-gray-100 dark:border-gray-800 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded font-bold text-sm transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={assignMutation.isPending} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-sm flex items-center gap-2 disabled:opacity-50 transition-colors shadow-md">
                  {assignMutation.isPending ? "Asignando..." : "Asignar Grupo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
