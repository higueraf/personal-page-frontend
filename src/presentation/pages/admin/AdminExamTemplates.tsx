import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileQuestion, Plus, Trash2, Pencil, X, Save } from "lucide-react";
import { examTemplateUseCases } from "../../../infrastructure/factories/exam-template-module.factory";
import {
  ExamTemplateSummary,
  ExamTemplateQuestion,
  ExamVersion,
  SaveExamTemplatePayload,
} from "../../../domain/entities/exam-template.entity";

function emptyQuestion(order: number): ExamTemplateQuestion {
  return { order, title: "", points: 2.5, statement: "" };
}

function emptyVersion(order_index: number): ExamVersion {
  return {
    id: `local-${order_index}`,
    theme_name: "",
    order_index,
    questions: [1, 2, 3, 4].map(emptyQuestion),
  };
}

function TemplateEditorModal({
  template,
  onClose,
}: {
  template: ExamTemplateSummary | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(template?.name ?? "");
  const [description, setDescription] = useState(template?.description ?? "");
  const [versions, setVersions] = useState<ExamVersion[]>(
    template?.versions?.length ? template.versions : [emptyVersion(0)]
  );
  const [activeVersion, setActiveVersion] = useState(0);

  const saveMutation = useMutation({
    mutationFn: (payload: SaveExamTemplatePayload) =>
      template ? examTemplateUseCases.update(template.id, payload) : examTemplateUseCases.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exam-templates"] });
      onClose();
    },
  });

  function handleAddVersion() {
    setVersions((prev) => [...prev, emptyVersion(prev.length)]);
    setActiveVersion(versions.length);
  }

  function handleRemoveVersion(index: number) {
    setVersions((prev) => prev.filter((_, i) => i !== index).map((v, i) => ({ ...v, order_index: i })));
    setActiveVersion((prev) => (prev >= index ? Math.max(0, prev - 1) : prev));
  }

  function updateVersion(index: number, patch: Partial<ExamVersion>) {
    setVersions((prev) => prev.map((v, i) => (i === index ? { ...v, ...patch } : v)));
  }

  function updateQuestion(versionIndex: number, questionIndex: number, patch: Partial<ExamTemplateQuestion>) {
    setVersions((prev) =>
      prev.map((v, i) =>
        i === versionIndex
          ? { ...v, questions: v.questions.map((q, qi) => (qi === questionIndex ? { ...q, ...patch } : q)) }
          : v
      )
    );
  }

  function handleSave() {
    if (!name.trim() || versions.length === 0) return;
    saveMutation.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
      language: "typescript",
      versions: versions.map((v, i) => ({
        theme_name: v.theme_name.trim(),
        order_index: i,
        questions: v.questions.map((q, qi) => ({ ...q, order: qi + 1 })),
      })),
    });
  }

  const current = versions[activeVersion];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <FileQuestion size={20} className="text-blue-500" />
            {template ? "Editar examen" : "Nuevo examen con variantes"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Nombre del examen</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-blue-500"
              placeholder="Ej. Programación IV — Estructuras de Control"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Descripción (opcional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-blue-500 resize-none"
              placeholder="Breve descripción del examen..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="md:col-span-1 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex flex-col">
              <div className="p-2">
                <button
                  onClick={handleAddVersion}
                  className="w-full flex items-center justify-center gap-1 px-2 py-1.5 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded"
                >
                  <Plus size={14} /> Variante
                </button>
              </div>
              <div className="flex-1 overflow-y-auto max-h-96">
                {versions.map((v, i) => (
                  <div
                    key={v.id}
                    onClick={() => setActiveVersion(i)}
                    className={`group flex items-center justify-between gap-1 px-3 py-2 text-xs cursor-pointer border-l-2 ${
                      i === activeVersion
                        ? "bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-300"
                        : "border-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    <span className="truncate">{v.theme_name || `Variante ${i + 1}`}</span>
                    {versions.length > 1 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRemoveVersion(i); }}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 shrink-0"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="md:col-span-3 p-4 space-y-4 max-h-96 overflow-y-auto">
              {current && (
                <>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Tema de la variante</label>
                    <input
                      value={current.theme_name}
                      onChange={(e) => updateVersion(activeVersion, { theme_name: e.target.value })}
                      className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-blue-500"
                      placeholder="Ej. Restaurante, Cine, Veterinaria..."
                    />
                  </div>

                  {current.questions.map((q, qi) => (
                    <div key={qi} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-400 shrink-0">Ejercicio {qi + 1}</span>
                        <input
                          value={q.title}
                          onChange={(e) => updateQuestion(activeVersion, qi, { title: e.target.value })}
                          className="flex-1 px-2 py-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded text-sm outline-none focus:border-blue-500"
                          placeholder="Título del ejercicio"
                        />
                        <input
                          type="number"
                          step="0.1"
                          value={q.points}
                          onChange={(e) => updateQuestion(activeVersion, qi, { points: Number(e.target.value) })}
                          className="w-20 px-2 py-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded text-sm outline-none focus:border-blue-500"
                          title="Puntos"
                        />
                      </div>
                      <textarea
                        value={q.statement}
                        onChange={(e) => updateQuestion(activeVersion, qi, { statement: e.target.value })}
                        rows={3}
                        className="w-full px-2 py-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded text-sm outline-none focus:border-blue-500 resize-none"
                        placeholder="Enunciado del ejercicio..."
                      />
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saveMutation.isPending || !name.trim()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg"
          >
            <Save size={16} /> {saveMutation.isPending ? "Guardando..." : "Guardar examen"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminExamTemplates() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<ExamTemplateSummary | null | undefined>(undefined);

  const templatesQ = useQuery({
    queryKey: ["exam-templates"],
    queryFn: () => examTemplateUseCases.list(),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => examTemplateUseCases.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["exam-templates"] }),
  });

  const templates = useMemo(() => templatesQ.data ?? [], [templatesQ.data]);

  function handleDelete(t: ExamTemplateSummary) {
    if (confirm(`¿Eliminar el examen "${t.name}"? Esta acción no se puede deshacer.`)) {
      removeMutation.mutate(t.id);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <FileQuestion size={24} className="text-blue-500" /> Exámenes (Plantillas)
          </h1>
          <p className="text-sm text-gray-500">
            Exámenes reutilizables con variantes temáticas para repartir automáticamente entre alumnos y evitar copias.
          </p>
        </div>
        <button
          onClick={() => setEditing(null)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg self-start"
        >
          <Plus size={16} /> Nuevo examen
        </button>
      </header>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        {templatesQ.isLoading ? (
          <div className="p-8 text-center text-gray-500 animate-pulse">Cargando exámenes...</div>
        ) : templates.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Aún no hay exámenes creados.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 font-bold text-gray-700 dark:text-gray-300">Nombre</th>
                <th className="px-6 py-4 font-bold text-gray-700 dark:text-gray-300">Variantes</th>
                <th className="px-6 py-4 font-bold text-gray-700 dark:text-gray-300">Actualizado</th>
                <th className="px-6 py-4 font-bold text-gray-700 dark:text-gray-300 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {templates.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900 dark:text-white">{t.name}</div>
                    {t.description && <div className="text-xs text-gray-500 mt-0.5">{t.description}</div>}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {(t.versions ?? []).map((v) => (
                        <span
                          key={v.id}
                          className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-md text-[10px] font-bold tracking-wide border border-blue-200 dark:border-blue-800/50"
                        >
                          {v.theme_name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500">
                    {new Date(t.updated_at).toLocaleString("es-EC", { dateStyle: "short", timeStyle: "short" })}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setEditing(t)}
                        className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                        title="Editar"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(t)}
                        className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editing !== undefined && (
        <TemplateEditorModal template={editing} onClose={() => setEditing(undefined)} />
      )}
    </div>
  );
}
