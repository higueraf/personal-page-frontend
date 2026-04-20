import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Editor } from "@monaco-editor/react";
import { X, AlertCircle, WifiOff, ShieldCheck } from "lucide-react";
import { useTheme } from "../../../shared/theme/ThemeProvider";

import { usePlaygroundStore } from "./store/playgroundStore";
import { LANGUAGE_CONFIGS } from "./templates";
import { useExecutionSocket } from "./runners/useExecutionSocket";
import type { TerminalApi } from "./components/TerminalPanel";
import { getMonacoLanguage } from "./utils/fileUtils";
import { setupMonacoCompletion } from "./utils/monacoCompletion";

import Toolbar from "./components/Toolbar";
import FileExplorer from "./components/FileExplorer";
import TerminalPanel from "./components/TerminalPanel";
import PreviewPanel from "./components/PreviewPanel";

import http from "../../../shared/api/http";
import type * as MonacoEditor from "monaco-editor";

// ─── ANSI helpers ──────────────────────────────────────────────────────────────
const C = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
  blue: "\x1b[34m",
  white: "\x1b[37m",
  gray: "\x1b[90m",
};

export default function PlaygroundIDE() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isAdminReview = searchParams.get("review") === "1";
  const reviewFrom = searchParams.get("from"); // exam_group_id to go back to
  const navigate = useNavigate();

  const {
    files,
    activeFileId,
    openFileIds,
    language,
    isExam,
    isRunning,
    allowCopyPaste,
    projectName,
    initProject,
    openFile,
    closeFile,
    updateFileContent,
    setRunning,
    setSaving,
  } = usePlaygroundStore();

  const { theme } = useTheme();
  const terminalApiRef = useRef<TerminalApi | null>(null);
  const editorInstanceRef = useRef<MonacoEditor.editor.IStandaloneCodeEditor | null>(null);

  // Internal clipboard: stores text copied/cut inside Monaco so we can
  // distinguish internal paste from external paste during exams.
  const internalClipboardRef = useRef<string>("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTerminal, setShowTerminal] = useState(true);
  const [showPreview, setShowPreview] = useState(true);
  const [previewRefreshKey, setPreviewRefreshKey] = useState(0);

  const [terminalHeight, setTerminalHeight] = useState(220);
  const [explorerWidth, setExplorerWidth] = useState(200);
  const [previewWidth, setPreviewWidth] = useState(380);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [isTabSwitchLocked, setIsTabSwitchLocked] = useState(false);
  const [examFinished, setExamFinished] = useState(false);

  // Store end_time for the timer — state drives Toolbar re-render, ref drives auto-submit closure
  const [endTime, setEndTime] = useState<Date | null>(null);
  const endTimeRef = useRef<Date | null>(null);

  const config = LANGUAGE_CONFIGS[language];

  // ── Load project ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) {
      navigate("/playground");
      return;
    }

    setLoading(true);
    setError(null);

    http
      .get(`/playground/${id}`)
      .then(({ data }) => {
        if (data.is_exam && !isAdminReview) {
          if (data.status === 'submitted' || data.status === 'graded') {
            setExamFinished(true);
            return;
          }
          if (data.end_time && new Date() > new Date(data.end_time)) {
            http.post(`/playground/${id}/submit`).catch(() => {});
            setExamFinished(true);
            return;
          }
          // Store end_time for the live timer
          const et = data.end_time ? new Date(data.end_time) : null;
          endTimeRef.current = et;
          setEndTime(et);
        }

        const projectFiles = (data.files ?? []).map((f: any) => ({
          id: f.id ?? f.name,
          name: f.name,
          content: f.content ?? "",
          language: f.language ?? "plaintext",
          path: f.path ?? `/${f.name}`,
          is_folder: f.is_folder ?? false,
        }));
        initProject(
          data.id,
          data.name ?? "Proyecto",
          data.language ?? "python",
          data.is_exam ?? false,
          data.allow_copy_paste ?? true,
          projectFiles
        );
        // Auto-open first file
        const firstCode = projectFiles.find((f: any) => !f.is_folder);
        if (firstCode) openFile(firstCode.id);
      })
      .catch((err) => {
        setError(
          err?.response?.data?.message ?? "No se pudo cargar el proyecto"
        );
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ── Auto-show preview for web languages ─────────────────────────────────────
  useEffect(() => {
    setShowPreview(config.supportsPreview);
  }, [config.supportsPreview]);

  // ── Exam Restrictions ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isExam || isAdminReview) return;

    // 1. Enter Fullscreen (may require user interaction so it's a best-effort)
    const enterFullscreen = () => {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    };
    enterFullscreen();
    // Try again on any click inside the document to bypass browser auto-block
    document.addEventListener("click", enterFullscreen, { once: true });

    // 2. Prevent exiting/reloading (beforeunload)
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const msg = "Estás en un examen activo. ¿Seguro que deseas salir?";
      e.returnValue = msg;
      return msg;
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    // 3. Block external paste — allow internal copy/paste within the editor
    //    Strategy: when user copies/cuts inside Monaco, we store the text in
    //    internalClipboardRef. On paste, we compare the clipboard text against
    //    internalClipboardRef; if it differs → it came from outside → block.
    const handlePaste = (e: ClipboardEvent) => {
      if (allowCopyPaste) return;
      const pastedText = e.clipboardData?.getData("text") ?? "";
      if (pastedText && pastedText !== internalClipboardRef.current) {
        e.preventDefault();
        e.stopPropagation();
        http.post(`/playground/${id}/log-cheat`, {
          action: "paste_external",
          details: "El alumno intentó pegar contenido externo al editor.",
        }).catch(() => {});
        alert("Solo puedes pegar contenido que hayas copiado dentro del editor. Pegar texto externo está bloqueado durante este examen.");
      }
    };

    // Block cut/copy ONLY outside the editor (context menus, other elements)
    const handleCopyCutOutsideEditor = (e: ClipboardEvent) => {
      if (allowCopyPaste) return;
      const editorContainer = document.querySelector(".monaco-editor");
      if (editorContainer && editorContainer.contains(e.target as Node)) {
        // Copy/cut inside Monaco — track in our internal clipboard
        // The actual text gets tracked via Monaco's onDidChangeCursorSelection below
        return; // allow it
      }
      // Outside the editor — block
      e.preventDefault();
      e.stopPropagation();
    };

    // 4. Fullscreen lock check
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsLockedOut(true);
        http.post(`/playground/${id}/log-cheat`, {
          action: "exit_fullscreen",
          details: "El alumno salió del modo pantalla completa.",
        }).catch(() => {});
      } else {
        setIsLockedOut(false);
      }
    };

    // 5. Tab/window switch monitoring (anti cheat)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        http.post(`/playground/${id}/log-cheat`, {
          action: "tab_switch",
          details: "El alumno cambió de pestaña, abrió otra ventana o minimizó el navegador.",
        }).catch(() => {});
        setIsTabSwitchLocked(true);
      }
    };

    if (!allowCopyPaste) {
      window.addEventListener("paste", handlePaste, true);
      window.addEventListener("copy", handleCopyCutOutsideEditor as any, true);
      window.addEventListener("cut", handleCopyCutOutsideEditor as any, true);
      document.addEventListener("fullscreenchange", handleFullscreenChange);
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    return () => {
      document.removeEventListener("click", enterFullscreen);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (!allowCopyPaste) {
        window.removeEventListener("paste", handlePaste, true);
        window.removeEventListener("copy", handleCopyCutOutsideEditor as any, true);
        window.removeEventListener("cut", handleCopyCutOutsideEditor as any, true);
        document.removeEventListener("fullscreenchange", handleFullscreenChange);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }
    };
  }, [isExam, allowCopyPaste]);

  // ── Exam Timer: auto-submit when end_time is reached ───────────────────────
  useEffect(() => {
    if (!isExam || examFinished || isAdminReview) return;

    const checkTimer = () => {
      if (endTimeRef.current && new Date() >= endTimeRef.current) {
        // Time's up — auto submit
        if (id) {
          handleSave().then(() => {
            http.post(`/playground/${id}/submit`).catch(() => {});
          }).catch(() => {});
        }
        setExamFinished(true);
        // Exit fullscreen
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
      }
    };

    const interval = setInterval(checkTimer, 15_000); // check every 15s
    return () => clearInterval(interval);
  }, [isExam, examFinished, id]);

  // ── Handle exam submitted callback (from Toolbar) ──────────────────────────
  const handleExamSubmitted = useCallback(() => {
    setExamFinished(true);
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  // ── WebSocket execution ──────────────────────────────────────────────────────
  const { startExecution, sendInput, stopExecution } = useExecutionSocket({
    onOutput: useCallback((data: string) => {
      terminalApiRef.current?.write(data);
    }, []),

    onDone: useCallback((code: number, killed?: boolean) => {
      setRunning(false);
      const api = terminalApiRef.current;
      if (!api) return;
      api.write(`\r\n${C.dim}${"─".repeat(48)}${C.reset}\r\n`);
      if (killed) {
        api.write(`${C.gray}✖ Proceso cancelado${C.reset}\r\n`);
      } else if (code === 0) {
        api.write(`${C.green}✔ Proceso terminado con código 0${C.reset}\r\n`);
      } else {
        api.write(`${C.red}✖ Proceso terminado con código ${code}${C.reset}\r\n`);
      }
    }, [setRunning]),

    onConnectionError: useCallback((msg: string) => {
      setRunning(false);
      terminalApiRef.current?.write(`${C.red}${C.bold}✖ Error de conexión WebSocket: ${msg}${C.reset}\r\n`);
    }, [setRunning]),
  });

  // ── Run ─────────────────────────────────────────────────────────────────────
  const handleRun = useCallback(() => {
    setShowTerminal(true);

    if (config.runtime === "iframe") {
      // Web preview — just refresh the iframe (no backend needed)
      setPreviewRefreshKey((k) => k + 1);
      setShowPreview(true);
      return;
    }

    // Clear terminal directly (bypasses the store-driven clear path)
    terminalApiRef.current?.clear();
    setRunning(true);

    const activeFile = files.find((f) => f.id === activeFileId);
    const targetFile = activeFile?.name;

    const now = new Date().toLocaleTimeString();
    const label = targetFile ?? config.label;
    terminalApiRef.current?.write(
      `${C.gray}[${now}]${C.reset} ${C.bold}${C.green}▶ Ejecutando ${label}…${C.reset}\r\n`
    );
    terminalApiRef.current?.write(`${C.dim}${"─".repeat(48)}${C.reset}\r\n`);

    startExecution(language, files, targetFile);
  }, [
    config,
    language,
    files,
    activeFileId,
    setRunning,
    startExecution,
  ]);

  // ── Run specific file (from terminal commands like `kotlin archivo.kt`) ────
  const handleRunFile = useCallback((targetFile: string) => {
    setShowTerminal(true);

    terminalApiRef.current?.clear();
    setRunning(true);

    const now = new Date().toLocaleTimeString();
    terminalApiRef.current?.write(
      `${C.gray}[${now}]${C.reset} ${C.bold}${C.green}▶ Ejecutando ${targetFile}…${C.reset}\r\n`
    );
    terminalApiRef.current?.write(`${C.dim}${"─".repeat(48)}${C.reset}\r\n`);

    startExecution(language, files, targetFile);
  }, [
    language,
    files,
    setRunning,
    startExecution,
  ]);

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!id) return;
    setSaving(true);
    try {
      for (const file of files) {
        if (!file.is_folder) {
          await http.put(`/playground/${id}/files/${file.name}`, {
            content: file.content,
            is_folder: false,
            path: file.path,
          });
        }
      }
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  }, [id, files, setSaving]);

  // ── Download ZIP ─────────────────────────────────────────────────────────────
  const handleDownloadZip = useCallback(async () => {
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    for (const file of files) {
      if (!file.is_folder) {
        const path = (file.path ?? `/${file.name}`).replace(/^\//, "");
        zip.file(path || file.name, file.content ?? "");
      }
    }
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${projectName.replace(/[^a-zA-Z0-9_\-]/g, "_")}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  }, [files, projectName]);

  // ── Exam auto-save every 5 minutes ──────────────────────────────────────────
  useEffect(() => {
    if (!isExam || examFinished || isAdminReview) return;
    const interval = setInterval(() => { handleSave(); }, 5 * 60_000);
    return () => clearInterval(interval);
  }, [isExam, examFinished, isAdminReview, handleSave]);

  // ── Keyboard shortcut: Ctrl+S ────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleRun();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleSave, handleRun]);

  // ─── Active file ─────────────────────────────────────────────────────────────
  const activeFile = files.find((f) => f.id === activeFileId);

  // ─── Loading / Error states ───────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-screen bg-[#f8f9fc] dark:bg-[#0d1117] text-gray-500 dark:text-slate-400">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">Cargando proyecto…</p>
        </div>
      </div>
    );
  }

  // ── Exam Finished screen ──────────────────────────────────────────────────
  if (examFinished) {
    return (
      <div className="flex items-center justify-center h-full min-h-screen bg-[#f8f9fc] dark:bg-[#0d1117] text-gray-700 dark:text-slate-300">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <ShieldCheck size={40} className="text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Examen Finalizado</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">
            Tu examen ha sido entregado exitosamente. Ya no es posible realizar modificaciones.
          </p>
          <button
            onClick={() => navigate("/playground")}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full min-h-screen bg-[#f8f9fc] dark:bg-[#0d1117] text-gray-700 dark:text-slate-300">
        <div className="text-center max-w-sm">
          <WifiOff size={40} className="mx-auto mb-3 text-red-400" />
          <p className="text-lg font-semibold mb-1">Error al cargar</p>
          <p className="text-sm text-gray-500 dark:text-slate-500 mb-4">{error}</p>
          <button
            onClick={() => navigate("/playground")}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm transition-colors"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  // ─── Main layout ──────────────────────────────────────────────────────────────
  const showPreviewPanel = config.supportsPreview && showPreview;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#f8f9fc] dark:bg-[#0d1117] text-gray-900 dark:text-white">
      
      {/* ── Lock Screen: fullscreen exit ── */}
      {isLockedOut && isExam && !allowCopyPaste && (
        <div className="fixed inset-0 bg-red-900/95 z-[9999] flex flex-col items-center justify-center text-white p-8 text-center backdrop-blur-sm">
          <AlertCircle size={80} className="mb-6 animate-pulse text-red-400" />
          <h2 className="text-4xl font-black tracking-tight mb-4 text-white">EXAMEN INTERRUMPIDO</h2>
          <p className="text-lg max-w-xl text-red-200 mb-8">
            Has minimizado la ventana o salido del modo de pantalla completa. Esta acción está directamente prohibida y el incidente ha sido notificado y añadido al historial de fraude.
          </p>
          <button
            onClick={() => document.documentElement.requestFullscreen().catch(() => {})}
            className="px-8 py-4 bg-white text-red-900 font-bold text-xl rounded-lg shadow-2xl hover:bg-gray-200 hover:scale-105 transition-all"
          >
            VOLVER A PANTALLA COMPLETA
          </button>
        </div>
      )}

      {/* ── Lock Screen: tab / window switch ── */}
      {isTabSwitchLocked && isExam && !allowCopyPaste && (
        <div className="fixed inset-0 bg-red-900/95 z-[9999] flex flex-col items-center justify-center text-white p-8 text-center backdrop-blur-sm">
          <AlertCircle size={80} className="mb-6 animate-pulse text-red-400" />
          <h2 className="text-4xl font-black tracking-tight mb-4 text-white">CAMBIO DE PESTAÑA DETECTADO</h2>
          <p className="text-lg max-w-xl text-red-200 mb-8">
            Has cambiado de pestaña o ventana durante el examen. Esta acción está directamente prohibida y el incidente ha sido notificado y añadido al historial de fraude.
          </p>
          <button
            onClick={() => setIsTabSwitchLocked(false)}
            className="px-8 py-4 bg-white text-red-900 font-bold text-xl rounded-lg shadow-2xl hover:bg-gray-200 hover:scale-105 transition-all"
          >
            VOLVER AL EXAMEN
          </button>
        </div>
      )}

      {/* ── Admin review banner ── */}
      {isAdminReview && (
        <div className="flex items-center gap-3 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-300 text-sm font-medium shrink-0">
          <button
            onClick={() => reviewFrom ? navigate(`/admin/assignments?group=${reviewFrom}`) : navigate("/admin/assignments")}
            className="flex items-center gap-1.5 px-3 py-1 bg-amber-200 dark:bg-amber-800/50 hover:bg-amber-300 dark:hover:bg-amber-700/60 rounded-lg text-amber-900 dark:text-amber-200 font-semibold text-xs transition-colors"
          >
            ← Volver a proyectos del examen
          </button>
          <span className="text-xs opacity-70">Modo revisión — solo lectura del examen del alumno</span>
        </div>
      )}

      {/* ── Toolbar ── */}
      <Toolbar
        onRun={handleRun}
        onStop={stopExecution}
        onSave={handleSave}
        onDownload={handleDownloadZip}
        showTerminal={showTerminal}
        onToggleTerminal={() => setShowTerminal((v) => !v)}
        showPreview={showPreview}
        onTogglePreview={() => setShowPreview((v) => !v)}
        onExamSubmitted={handleExamSubmitted}
        endTime={endTime}
      />

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* File Explorer */}
        <div
          className="flex-shrink-0 overflow-hidden"
          style={{ width: explorerWidth }}
        >
          <FileExplorer />
        </div>
        <ResizeHandle
          direction="horizontal"
          currentSize={explorerWidth}
          setSize={setExplorerWidth}
          min={140}
          max={420}
        />

        {/* Center: editor + terminal */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          {/* Tab bar */}
          <TabBar
            files={files}
            openFileIds={openFileIds}
            activeFileId={activeFileId}
            onSelect={openFile}
            onClose={closeFile}
          />

          {/* Editor area */}
          <div className="flex-1 overflow-hidden">
            {activeFile ? (
              <Editor
                height="100%"
                language={getMonacoLanguage(activeFile.name)}
                value={activeFile.content}
                onChange={(val) =>
                  updateFileContent(activeFile.id, val ?? "")
                }
                theme={theme === "dark" ? "vs-dark" : "vs"}
                beforeMount={setupMonacoCompletion}
                onMount={(editor) => {
                  editorInstanceRef.current = editor;
                  // Track copy/cut inside Monaco for the internal clipboard
                  if (isExam && !allowCopyPaste) {
                    editor.onDidChangeCursorSelection(() => {
                      const selection = editor.getSelection();
                      if (selection && !selection.isEmpty()) {
                        const model = editor.getModel();
                        if (model) {
                          internalClipboardRef.current = model.getValueInRange(selection);
                        }
                      }
                    });
                    // Also intercept the copy/cut keyboard actions to capture the text
                    editor.addCommand(
                      // Ctrl+C
                      // eslint-disable-next-line no-bitwise
                      (window as any).monaco?.KeyMod?.CtrlCmd | (window as any).monaco?.KeyCode?.KeyC,
                      () => {
                        const selection = editor.getSelection();
                        if (selection && !selection.isEmpty()) {
                          const model = editor.getModel();
                          if (model) {
                            internalClipboardRef.current = model.getValueInRange(selection);
                          }
                        }
                        // Trigger the default copy action
                        editor.trigger('keyboard', 'editor.action.clipboardCopyAction', null);
                      }
                    );
                    editor.addCommand(
                      // Ctrl+X
                      // eslint-disable-next-line no-bitwise
                      (window as any).monaco?.KeyMod?.CtrlCmd | (window as any).monaco?.KeyCode?.KeyX,
                      () => {
                        const selection = editor.getSelection();
                        if (selection && !selection.isEmpty()) {
                          const model = editor.getModel();
                          if (model) {
                            internalClipboardRef.current = model.getValueInRange(selection);
                          }
                        }
                        editor.trigger('keyboard', 'editor.action.clipboardCutAction', null);
                      }
                    );
                  }
                }}
                options={{
                  fontSize: 14,
                  fontFamily:
                    '"Cascadia Code", "Fira Code", "JetBrains Mono", monospace',
                  fontLigatures: true,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
                  lineNumbers: "on",
                  renderLineHighlight: "line",
                  tabSize: 2,
                  insertSpaces: true,
                  automaticLayout: true,
                  padding: { top: 12, bottom: 12 },
                  bracketPairColorization: { enabled: true },
                  smoothScrolling: true,
                  cursorSmoothCaretAnimation: "on",
                  suggestOnTriggerCharacters: true,
                  quickSuggestions: true,
                }}
              />
            ) : (
              <EmptyEditor language={language} config={config} />
            )}
          </div>

          {/* Terminal panel */}
          {showTerminal && (
            <>
              <ResizeHandle
                direction="vertical"
                inverted
                currentSize={terminalHeight}
                setSize={setTerminalHeight}
                min={100}
                max={600}
              />
              <div className="flex-shrink-0" style={{ height: terminalHeight }}>
                <TerminalPanel
                  onRun={handleRun}
                  onRunFile={handleRunFile}
                  isRunning={isRunning}
                  sendInput={sendInput}
                  onKill={stopExecution}
                  onReady={(api) => { terminalApiRef.current = api; }}
                />
              </div>
            </>
          )}
        </div>

        {/* Preview panel */}
        {showPreviewPanel && (
          <>
            <ResizeHandle
              direction="horizontal"
              inverted
              currentSize={previewWidth}
              setSize={setPreviewWidth}
              min={200}
              max={900}
            />
            <div
              className="flex-shrink-0 overflow-hidden"
              style={{ width: previewWidth }}
            >
              <PreviewPanel refreshKey={previewRefreshKey} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Tab Bar ──────────────────────────────────────────────────────────────────

interface TabBarProps {
  files: ReturnType<typeof usePlaygroundStore.getState>["files"];
  openFileIds: string[];
  activeFileId: string | null;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
}

function TabBar({ files, openFileIds, activeFileId, onSelect, onClose }: TabBarProps) {
  const openFiles = openFileIds
    .map((id) => files.find((f) => f.id === id))
    .filter(Boolean) as typeof files;

  return (
    <div className="flex items-center overflow-x-auto bg-gray-100 dark:bg-[#161b22] border-b border-black/10 dark:border-white/10 flex-shrink-0 scrollbar-none">
      {openFiles.map((file) => {
        const active = file.id === activeFileId;
        return (
          <div
            key={file.id}
            className={`group flex items-center gap-2 px-3 py-2 border-r border-black/10 dark:border-white/10 cursor-pointer flex-shrink-0 text-xs transition-colors ${
              active
                ? "bg-white dark:bg-[#0d1117] text-gray-900 dark:text-white border-t-2 border-t-blue-500"
                : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 border-t-2 border-t-transparent"
            }`}
            onClick={() => onSelect(file.id)}
          >
            <span className="font-mono">{file.name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose(file.id);
              }}
              className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all rounded"
            >
              <X size={11} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ─── Empty Editor Placeholder ─────────────────────────────────────────────────

function EmptyEditor({ language, config }: { language: string; config: any }) {
  return (
    <div className="flex items-center justify-center h-full text-gray-400 dark:text-slate-600">
      <div className="text-center">
        <div className="text-5xl mb-3">{config.emoji}</div>
        <p className="text-sm mb-1">Selecciona un archivo para empezar</p>
        <p className="text-xs text-gray-500 dark:text-slate-700">{language} playground</p>
      </div>
    </div>
  );
}

// ─── Resize Handle ────────────────────────────────────────────────────────────

interface ResizeHandleProps {
  direction: "horizontal" | "vertical";
  /** When true, dragging toward negative direction grows the panel */
  inverted?: boolean;
  currentSize: number;
  setSize: (s: number) => void;
  min?: number;
  max?: number;
}

function ResizeHandle({
  direction,
  inverted = false,
  currentSize,
  setSize,
  min = 100,
  max = 800,
}: ResizeHandleProps) {
  const isH = direction === "horizontal";

  function handleMouseDown(e: React.MouseEvent) {
    e.preventDefault();
    const startPos = isH ? e.clientX : e.clientY;
    const startSize = currentSize;

    function onMove(ev: MouseEvent) {
      const pos = isH ? ev.clientX : ev.clientY;
      const delta = inverted ? startPos - pos : pos - startPos;
      setSize(Math.max(min, Math.min(max, startSize + delta)));
    }

    function onUp() {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    }

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  return (
    <div
      onMouseDown={handleMouseDown}
      title="Arrastrar para redimensionar"
      className={[
        "flex-shrink-0 group relative flex items-center justify-center",
        "bg-black/[0.04] dark:bg-white/[0.04] hover:bg-blue-500/30 active:bg-blue-500/50",
        "transition-colors duration-100 select-none",
        isH
          ? "w-[5px] cursor-col-resize"
          : "h-[5px] cursor-row-resize",
      ].join(" ")}
    >
      {/* Wider invisible hit-area so tiny handles are still easy to grab */}
      <div
        className={
          isH
            ? "absolute inset-y-0 -left-2 -right-2"
            : "absolute inset-x-0 -top-2 -bottom-2"
        }
      />
      {/* Grip dots */}
      <div
        className={[
          "flex gap-[3px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none",
          isH ? "flex-col" : "flex-row",
        ].join(" ")}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-[3px] h-[3px] rounded-full bg-gray-500/60 dark:bg-white/60"
          />
        ))}
      </div>
    </div>
  );
}
