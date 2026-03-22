import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, Clock, Code2, Loader2, ChevronRight } from "lucide-react";
import { LANGUAGE_CONFIGS, LANGUAGE_ORDER } from "./templates";
import type { Language } from "./store/playgroundStore";
import http from "../../../shared/api/http";

interface Project {
  id: string;
  name: string;
  language: Language;
  updated_at?: string;
  created_at?: string;
}

export default function PlaygroundList() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<Language | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    http
      .get("/playground")
      .then(({ data }) => setProjects(Array.isArray(data) ? data : []))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, []);

  async function createProject(language: Language) {
    setCreating(language);
    try {
      const config = LANGUAGE_CONFIGS[language];
      const defaultFiles = config.defaultFiles.map((f, i) => ({
        ...f,
        id: `init-${i}`,
      }));
      const { data } = await http.post("/playground", {
        name: `${config.label} Project`,
        language,
        files: defaultFiles,
      });
      navigate(`/playground/${data.id}`);
    } catch (err) {
      console.error("Create project error:", err);
      setCreating(null);
    }
  }

  async function deleteProject(id: string) {
    if (deleting === id) {
      try {
        await http.delete(`/playground/${id}`);
        setProjects((prev) => prev.filter((p) => p.id !== id));
      } catch {}
      setDeleting(null);
    } else {
      setDeleting(id);
      setTimeout(() => setDeleting(null), 2500);
    }
  }

  return (
    <div className="min-h-screen text-[--color-text]">
      <div className="max-w-5xl mx-auto px-4 py-10">

        {/* ── Header ── */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-[--color-text] mb-2">
            🧠 Code Playground
          </h1>
          <p className="text-[--color-text-muted] text-sm">
            Editor online estilo StackBlitz — Monaco Editor · xterm.js · preview en vivo · Python · Kotlin · Dart · React · Vue · Angular
          </p>
        </div>

        {/* ── Language Templates Grid ── */}
        <section className="mb-12">
          <h2 className="text-lg font-semibold text-[--color-text] mb-4 flex items-center gap-2">
            <Plus size={16} className="text-blue-500 dark:text-blue-400" />
            Crear nuevo proyecto
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {LANGUAGE_ORDER.map((lang) => {
              const config = LANGUAGE_CONFIGS[lang];
              const isCreating = creating === lang;

              return (
                <button
                  key={lang}
                  onClick={() => createProject(lang)}
                  disabled={!!creating}
                  className={`relative group flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200
                    ${config.borderColor} ${config.bgColor}
                    hover:scale-[1.03] hover:shadow-lg dark:hover:shadow-black/40 hover:shadow-black/10
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                  `}
                >
                  {isCreating ? (
                    <Loader2 size={28} className="animate-spin text-[--color-text-muted]" />
                  ) : (
                    <span className="text-3xl">{config.emoji}</span>
                  )}
                  <div className="text-center">
                    <div className={`text-sm font-semibold ${config.color}`}>
                      {config.label}
                    </div>
                    <div className="text-[10px] text-[--color-text-sub] mt-0.5 leading-tight">
                      {config.description}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-wrap justify-center mt-1">
                    {config.supportsPreview && (
                      <span className="text-[9px] px-1.5 py-0.5 bg-green-500/20 text-green-600 dark:text-green-400 rounded-full border border-green-500/30">
                        Preview
                      </span>
                    )}
                    <span className="text-[9px] px-1.5 py-0.5 bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-full border border-blue-500/30">
                      {config.runtime === "backend" ? "Servidor" : "Browser"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Feature highlights ── */}
        <section className="mb-12 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: "🖊️", label: "Monaco Editor", desc: "El mismo editor de VS Code" },
            { icon: "⬛", label: "xterm.js",       desc: "Terminal con colores ANSI" },
            { icon: "🌐", label: "Preview en vivo", desc: "iframe para React, Vue, HTML" },
            { icon: "🐳", label: "Docker runtime",  desc: "Python, Kotlin, Dart, Node" },
          ].map((f) => (
            <div
              key={f.label}
              className="flex flex-col gap-1 p-3 bg-[--color-surface] rounded-xl border border-[--color-border] shadow-sm"
            >
              <span className="text-2xl">{f.icon}</span>
              <span className="text-sm font-semibold text-[--color-text]">{f.label}</span>
              <span className="text-xs text-[--color-text-muted]">{f.desc}</span>
            </div>
          ))}
        </section>

        {/* ── Keyboard shortcuts ── */}
        <section className="mb-12 p-4 bg-[--color-surface] rounded-xl border border-[--color-border] shadow-sm">
          <h3 className="text-xs font-semibold text-[--color-text-muted] uppercase tracking-widest mb-3">
            Atajos de teclado en el IDE
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
            {[
              ["Ctrl + Enter", "Ejecutar código"],
              ["Ctrl + S",     "Guardar archivos"],
              ["Ctrl + Space", "Autocompletar Monaco"],
              ["F1",           "Paleta de comandos"],
              ["Alt + Z",      "Word wrap"],
              ["Ctrl + /",     "Comentar línea"],
            ].map(([key, desc]) => (
              <div key={key} className="flex items-center gap-2 text-[--color-text-muted]">
                <kbd className="px-2 py-0.5 bg-[--color-bg-muted] rounded border border-[--color-border] text-[--color-text] font-mono text-[10px]">
                  {key}
                </kbd>
                <span>{desc}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Existing projects ── */}
        <section>
          <h2 className="text-lg font-semibold text-[--color-text] mb-4 flex items-center gap-2">
            <Code2 size={16} className="text-purple-500 dark:text-purple-400" />
            Mis proyectos
          </h2>

          {loading ? (
            <div className="flex items-center justify-center py-12 text-[--color-text-muted]">
              <Loader2 size={20} className="animate-spin mr-2" />
              Cargando proyectos…
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-[--color-border] rounded-xl">
              <p className="text-[--color-text-muted] text-sm mb-1">Sin proyectos guardados</p>
              <p className="text-[--color-text-sub] text-xs">
                Crea uno nuevo arriba para empezar
              </p>
            </div>
          ) : (
            <div className="grid gap-2">
              {projects.map((project) => {
                const config = LANGUAGE_CONFIGS[project.language] ?? LANGUAGE_CONFIGS.python;
                const date = project.updated_at ?? project.created_at;

                return (
                  <div
                    key={project.id}
                    className={`group flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all
                      ${config.borderColor} ${config.bgColor}
                      hover:shadow-md dark:hover:shadow-black/30 hover:shadow-black/10
                    `}
                    onClick={() => navigate(`/playground/${project.id}`)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xl flex-shrink-0">{config.emoji}</span>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-[--color-text] truncate">
                          {project.name}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[10px] font-semibold ${config.color}`}>
                            {config.label}
                          </span>
                          {date && (
                            <span className="flex items-center gap-1 text-[10px] text-[--color-text-sub]">
                              <Clock size={9} />
                              {new Date(date).toLocaleDateString("es-MX", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteProject(project.id); }}
                        title={deleting === project.id ? "¿Confirmar eliminación?" : "Eliminar"}
                        className={`p-1.5 rounded opacity-0 group-hover:opacity-100 transition-all ${
                          deleting === project.id
                            ? "text-red-500 opacity-100 bg-red-500/20"
                            : "text-[--color-text-muted] hover:text-red-500 hover:bg-red-500/10"
                        }`}
                      >
                        <Trash2 size={13} />
                      </button>
                      <ChevronRight
                        size={16}
                        className="text-[--color-text-sub] group-hover:text-[--color-text-muted] transition-colors"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
