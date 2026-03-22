import { useState } from "react";
import { Plus, Users, Calendar, Shield, Search, Filter, MoreVertical, CheckCircle, Clock } from "lucide-react";

interface Assignment {
  id: string;
  projectName: string;
  studentName: string;
  materia: string;
  status: 'active' | 'expired' | 'graded';
  startTime: string;
  endTime: string;
  antiCheat: boolean;
}

export default function AdminAssignments() {
  const [assignments] = useState<Assignment[]>([
    { id: "a-1", projectName: "Examen 1: Algoritmos", studentName: "Juan Pérez", materia: "Programación II", status: 'active', startTime: "2026-03-21 10:00", endTime: "2026-03-21 18:00", antiCheat: true },
    { id: "a-2", projectName: "Landing Page", studentName: "María García", materia: "Diseño Web", status: 'graded', startTime: "2026-03-20 08:00", endTime: "2026-03-20 12:00", antiCheat: false },
  ]);

  return (
    <div className="p-6 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Gestión de Exámenes y Proyectos</h1>
          <p className="text-sm text-gray-500">Asigna tareas, controla tiempos y revisa el progreso de tus alumnos.</p>
        </div>
        <button className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-hover transition-colors">
          <Plus size={20} /> Nueva Asignación
        </button>
      </header>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input type="text" placeholder="Buscar por alumno o proyecto..." className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border rounded-lg text-sm outline-none focus:border-primary" />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <select className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border rounded-lg text-sm outline-none focus:border-primary appearance-none">
            <option>Todas las Materias</option>
            <option>Programación II</option>
            <option>Diseño Web</option>
          </select>
        </div>
        <div className="relative">
          <Users className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <select className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border rounded-lg text-sm outline-none focus:border-primary appearance-none">
            <option>Todos los Estados</option>
            <option>Activos</option>
            <option>Expirados</option>
            <option>Calificados</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900 border-b dark:border-gray-700">
            <tr>
              <th className="px-6 py-4 font-bold text-gray-700 dark:text-gray-300">Proyecto / Examen</th>
              <th className="px-6 py-4 font-bold text-gray-700 dark:text-gray-300">Alumno</th>
              <th className="px-6 py-4 font-bold text-gray-700 dark:text-gray-300">Materia</th>
              <th className="px-6 py-4 font-bold text-gray-700 dark:text-gray-300">Tiempo</th>
              <th className="px-6 py-4 font-bold text-gray-700 dark:text-gray-300">Opciones</th>
              <th className="px-6 py-4 font-bold text-gray-700 dark:text-gray-300 text-center">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-gray-700">
            {assignments.map(ass => (
              <tr key={ass.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                <td className="px-6 py-4 font-medium">{ass.projectName}</td>
                <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{ass.studentName}</td>
                <td className="px-6 py-4">
                  <span className="bg-primary/10 text-primary px-2 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider">
                    {ass.materia}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col text-[10px] text-gray-500">
                    <span className="flex items-center gap-1"><Clock size={10} /> {ass.startTime}</span>
                    <span className="flex items-center gap-1"><Calendar size={10} /> {ass.endTime}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {ass.antiCheat && <Shield size={16} className="text-red-500" />}
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  {ass.status === 'active' ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold bg-green-100 text-green-700 uppercase">En progreso</span>
                  ) : ass.status === 'graded' ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 uppercase">Calificado</span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700 uppercase">Expirado</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
