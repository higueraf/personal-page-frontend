import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Filter, Terminal, User, Clock, FileCode2 } from "lucide-react";
import http from "../../shared/api/http";

interface PlaygroundProject {
  id: string;
  name: string;
  type: string;
  language: string;
  is_exam: boolean;
  created_at: string;
  user?: { id: string; first_name: string; last_name: string; email: string; };
}

async function fetchPlaygrounds() {
  return (await http.get("/playground/admin/playgrounds")).data.data as PlaygroundProject[];
}

export default function AdminPlaygrounds() {
  const [search, setSearch] = useState("");

  const playgroundsQ = useQuery({ queryKey: ["admin-playgrounds"], queryFn: fetchPlaygrounds });

  const parsedPlaygrounds = (playgroundsQ.data || []).map((p) => {
    return {
      ...p,
      studentName: p.user ? `${p.user.first_name} ${p.user.last_name}` : "Desconocido",
      formattedDate: new Date(p.created_at).toLocaleString("es-EC", { dateStyle: "short", timeStyle: "short" }),
    };
  });

  const filteredPlaygrounds = parsedPlaygrounds.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.studentName.toLowerCase().includes(q);
  });

  return (
    <div className="p-6 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Terminal size={24} className="text-blue-500" /> Todos los Playgrounds
          </h1>
          <p className="text-sm text-gray-500">
            Explora y revisa todos los proyectos (playgrounds) creados por los estudiantes.
          </p>
        </div>
      </header>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            type="text"
            placeholder="Buscar por alumno o nombre del proyecto..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
           <Filter size={16} /> Mostrando {filteredPlaygrounds.length} proyecto(s).
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        {playgroundsQ.isLoading ? (
          <div className="p-8 text-center text-gray-500 animate-pulse">Cargando datos...</div>
        ) : filteredPlaygrounds.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No hay proyectos que coincidan con la búsqueda.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 font-bold text-gray-700 dark:text-gray-300">Proyecto</th>
                <th className="px-6 py-4 font-bold text-gray-700 dark:text-gray-300">Alumno</th>
                <th className="px-6 py-4 font-bold text-gray-700 dark:text-gray-300">Lenguaje / Tipo</th>
                <th className="px-6 py-4 font-bold text-gray-700 dark:text-gray-300">Fecha de Creación</th>
                <th className="px-6 py-4 font-bold text-gray-700 dark:text-gray-300 text-center">Tipo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredPlaygrounds.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <FileCode2 size={16} className="text-gray-400" /> {p.name}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-gray-400" />
                      <div>
                        <span className="text-gray-800 dark:text-gray-200 font-medium block">{p.studentName}</span>
                        <span className="text-[10px] text-gray-500">{p.user?.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider border border-blue-200 dark:border-blue-800/50">
                      {p.language || p.type || "Desconocido"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-[12px] text-gray-500 font-medium">
                      <Clock size={12} className="text-gray-400" /> {p.formattedDate}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {p.is_exam ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-purple-100 text-purple-700 border border-purple-200">
                        Examen
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-green-100 text-green-700 border border-green-200">
                        Práctica
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
