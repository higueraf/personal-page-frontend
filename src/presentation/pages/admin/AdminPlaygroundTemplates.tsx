import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Editor from "@monaco-editor/react";
import { LayoutTemplate, Plus, Trash2, Pencil, FileCode2, X, Save, FileText, Upload } from "lucide-react";
import { playgroundTemplateUseCases } from "../../../infrastructure/factories/playground-template-module.factory";
import {
  PlaygroundTemplate,
  PlaygroundTemplateFile,
  SavePlaygroundTemplatePayload,
  StatementType,
} from "../../../domain/entities/playground-template.entity";
import { uploadUrl } from "../../store/auth.store";

const LANGUAGE_OPTIONS = [
  "python", "javascript", "typescript", "java", "kotlin", "dart", "html", "html-array", "react", "vue", "angular",
];

function emptyFile(path: string): PlaygroundTemplateFile {
  return { name: path.split("/").pop() || path, path, content: "", is_folder: false };
}

function TemplateEditorModal({
  template,
  onClose,
}: {
  template: PlaygroundTemplate | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(template?.name ?? "");
  const [description, setDescription] = useState(template?.description ?? "");
  const [language, setLanguage] = useState(template?.language ?? "python");
  const [files, setFiles] = useState<PlaygroundTemplateFile[]>(
    template?.files?.length ? template.files : [emptyFile("/main.py")]
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [newFilePath, setNewFilePath] = useState("");

  // Enunciado como PDF en vez de texto — solo se puede subir una vez la plantilla ya existe.
  const [savedTemplateId, setSavedTemplateId] = useState(template?.id ?? null);
  const [statementType, setStatementType] = useState<StatementType>(template?.statement_type ?? "text");
  const [statementPdfUrl, setStatementPdfUrl] = useState(template?.statement_pdf_url ?? null);
  const [statementPdfName, setStatementPdfName] = useState(template?.statement_pdf_original_name ?? null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const saveMutation = useMutation({
    mutationFn: (payload: SavePlaygroundTemplatePayload) =>
      template ? playgroundTemplateUseCases.update(template.id, payload) : playgroundTemplateUseCases.create(payload),
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ["playground-templates"] });
      setSavedTemplateId(saved.id);
      onClose();
    },
  });

  const uploadPdfMutation = useMutation({
    mutationFn: (file: File) => playgroundTemplateUseCases.uploadStatementPdf(savedTemplateId!, file),
    onSuccess: (updated) => {
      setStatementType("pdf");
      setStatementPdfUrl(updated.statement_pdf_url ?? null);
      setStatementPdfName(updated.statement_pdf_original_name ?? null);
      queryClient.invalidateQueries({ queryKey: ["playground-templates"] });
    },
  });

  const removePdfMutation = useMutation({
    mutationFn: () => playgroundTemplateUseCases.removeStatementPdf(savedTemplateId!),
    onSuccess: () => {
      setStatementType("text");
      setStatementPdfUrl(null);
      setStatementPdfName(null);
      queryClient.invalidateQueries({ queryKey: ["playground-templates"] });
    },
  });

  function handlePickPdf(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) uploadPdfMutation.mutate(file);
  }

  function handleAddFile() {
    const path = newFilePath.trim();
    if (!path) return;
    const normalized = path.startsWith("/") ? path : `/${path}`;
    if (files.some((f) => f.path === normalized)) return;
    setFiles((prev) => [...prev, emptyFile(normalized)]);
    setActiveIndex(files.length);
    setNewFilePath("");
  }

  function handleRemoveFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setActiveIndex((prev) => (prev >= index ? Math.max(0, prev - 1) : prev));
  }

  function handleContentChange(value: string | undefined) {
    setFiles((prev) => prev.map((f, i) => (i === activeIndex ? { ...f, content: value ?? "" } : f)));
  }

  function handleSave() {
    if (!name.trim() || files.length === 0) return;
    saveMutation.mutate({ name: name.trim(), description: description.trim() || undefined, language, files });
  }

  const activeFile = files[activeIndex];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <LayoutTemplate size={20} className="text-blue-500" />
            {template ? "Editar plantilla" : "Nueva plantilla"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Nombre</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-blue-500"
                placeholder="Ej. CRUD Flutter básico"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Lenguaje</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-blue-500"
              >
                {LANGUAGE_OPTIONS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Descripción (opcional)</label>
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-900 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setStatementType("text")}
                  className={`flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-md transition-colors ${
                    statementType === "text" ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" : "text-gray-500"
                  }`}
                >
                  <FileText size={12} /> Texto
                </button>
                <button
                  type="button"
                  onClick={() => setStatementType("pdf")}
                  className={`flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-md transition-colors ${
                    statementType === "pdf" ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" : "text-gray-500"
                  }`}
                >
                  <Upload size={12} /> PDF
                </button>
              </div>
            </div>

            {statementType === "text" ? (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-blue-500 resize-none"
                placeholder="Breve descripción de la plantilla..."
              />
            ) : !savedTemplateId ? (
              <p className="mt-1 text-xs text-gray-400 italic">
                Guarda la plantilla primero para poder subir el PDF del enunciado.
              </p>
            ) : (
              <div className="mt-1 flex items-center gap-2">
                {statementPdfUrl ? (
                  <>
                    <a
                      href={uploadUrl(statementPdfUrl)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 truncate px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {statementPdfName ?? "Ver PDF"}
                    </a>
                    <button
                      type="button"
                      onClick={() => pdfInputRef.current?.click()}
                      disabled={uploadPdfMutation.isPending}
                      className="px-2 py-2 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-700"
                    >
                      Reemplazar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm("¿Quitar el PDF y volver al enunciado en texto?")) removePdfMutation.mutate();
                      }}
                      disabled={removePdfMutation.isPending}
                      className="px-2 py-2 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg border border-gray-300 dark:border-gray-700"
                    >
                      Quitar
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => pdfInputRef.current?.click()}
                    disabled={uploadPdfMutation.isPending}
                    className="flex items-center gap-2 px-3 py-2 text-sm border border-dashed border-gray-300 dark:border-gray-600 text-gray-500 hover:text-blue-500 hover:border-blue-400 rounded-lg w-full justify-center"
                  >
                    <Upload size={14} /> {uploadPdfMutation.isPending ? "Subiendo..." : "Subir PDF del enunciado"}
                  </button>
                )}
                <input ref={pdfInputRef} type="file" accept="application/pdf" className="hidden" onChange={handlePickPdf} />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="md:col-span-1 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex flex-col">
              <div className="p-2 flex gap-1">
                <input
                  value={newFilePath}
                  onChange={(e) => setNewFilePath(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddFile()}
                  placeholder="/ruta/archivo.ext"
                  className="flex-1 min-w-0 px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleAddFile}
                  className="shrink-0 p-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded"
                  title="Agregar archivo"
                >
                  <Plus size={14} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto max-h-64">
                {files.map((f, i) => (
                  <div
                    key={f.path + i}
                    onClick={() => setActiveIndex(i)}
                    className={`group flex items-center justify-between gap-1 px-3 py-2 text-xs cursor-pointer border-l-2 ${
                      i === activeIndex
                        ? "bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-300"
                        : "border-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      <FileCode2 size={12} className="shrink-0" /> <span className="truncate">{f.path}</span>
                    </span>
                    {files.length > 1 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRemoveFile(i); }}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 shrink-0"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="md:col-span-3 h-64">
              {activeFile && (
                <Editor
                  key={activeFile.path}
                  height="100%"
                  language={language === "react" || language === "javascript" ? "javascript" : language}
                  value={activeFile.content}
                  onChange={handleContentChange}
                  theme="vs-dark"
                  options={{ minimap: { enabled: false }, fontSize: 13 }}
                />
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
            <Save size={16} /> {saveMutation.isPending ? "Guardando..." : "Guardar plantilla"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminPlaygroundTemplates() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<PlaygroundTemplate | null | undefined>(undefined);

  const templatesQ = useQuery({
    queryKey: ["playground-templates"],
    queryFn: () => playgroundTemplateUseCases.list(),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => playgroundTemplateUseCases.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["playground-templates"] }),
  });

  const templates = useMemo(() => templatesQ.data ?? [], [templatesQ.data]);

  function handleDelete(t: PlaygroundTemplate) {
    if (confirm(`¿Eliminar la plantilla "${t.name}"? Esta acción no se puede deshacer.`)) {
      removeMutation.mutate(t.id);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <LayoutTemplate size={24} className="text-blue-500" /> Plantillas de Proyecto
          </h1>
          <p className="text-sm text-gray-500">
            Proyectos de ejemplo reutilizables para inicializar playgrounds y exámenes.
          </p>
        </div>
        <button
          onClick={() => setEditing(null)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg self-start"
        >
          <Plus size={16} /> Nueva plantilla
        </button>
      </header>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        {templatesQ.isLoading ? (
          <div className="p-8 text-center text-gray-500 animate-pulse">Cargando plantillas...</div>
        ) : templates.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Aún no hay plantillas creadas.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 font-bold text-gray-700 dark:text-gray-300">Nombre</th>
                <th className="px-6 py-4 font-bold text-gray-700 dark:text-gray-300">Lenguaje</th>
                <th className="px-6 py-4 font-bold text-gray-700 dark:text-gray-300">Archivos</th>
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
                    <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider border border-blue-200 dark:border-blue-800/50">
                      {t.language}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{t.files.length} archivo(s)</td>
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
