import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Editor } from "@monaco-editor/react";
import { WifiOff } from "lucide-react";
import { useTheme } from "../../../providers/ThemeProvider";
import ErrorBoundary from "../../../components/ErrorBoundary";

import { usePlaygroundStore, type Language } from "./store/playgroundStore";
import { LANGUAGE_CONFIGS } from "./templates/index";
import { getMonacoLanguage } from "./utils/fileUtils";
import { setupMonacoCompletion } from "./utils/monacoCompletion";
import { downloadProjectZip } from "./utils/downloadZip";
import { useProjectRunner } from "./hooks/useProjectRunner";
import { useProjectSave } from "./hooks/useProjectSave";
import { useAdminReview } from "./hooks/useAdminReview";
import { useProjectLoader } from "./hooks/useProjectLoader";
import { useExamExit } from "./hooks/useExamExit";
import { useExamTimer } from "./hooks/useExamTimer";
import { useExamSecurity } from "./hooks/useExamSecurity";

import Toolbar from "./components/Toolbar";
import FileExplorer from "./components/FileExplorer";
import TerminalPanel from "./components/TerminalPanel";
import PreviewPanel from "./components/PreviewPanel";
import FlutterPreviewPanel from "./components/FlutterPreviewPanel";
import ReactNativePreviewPanel from "./components/ReactNativePreviewPanel";
import TabBar from "./components/TabBar";
import EmptyEditor from "./components/EmptyEditor";
import ResizeHandle from "./components/ResizeHandle";
import ReadOnlyBanner from "./components/ReadOnlyBanner";
import SnapshotHistoryModal from "./components/SnapshotHistoryModal";
import {
  SecurityLockedScreen,
  SebRequiredScreen,
  FullscreenLockScreen,
  TabSwitchLockScreen,
  KeyboardLockScreen,
} from "./components/ExamLockScreens";

import { uploadUrl } from "../../../store/auth.store";
import type * as MonacoEditor from "monaco-editor";

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
    requireSeb,
    projectName,
    isReadOnly,
    securityLocked,
    openFile,
    closeFile,
    updateFileContent,
    setRunning,
    setSaving,
    setSaveError,
    setSecurityLocked,
  } = usePlaygroundStore();

  // Detect Safe Exam Browser (SEB)
  const isInSEB = typeof (window as any).SafeExamBrowser !== 'undefined'
    || navigator.userAgent.includes('SEB');

  const { theme } = useTheme();
  const editorInstanceRef = useRef<MonacoEditor.editor.IStandaloneCodeEditor | null>(null);

  // Internal clipboard: stores text copied/cut inside Monaco so we can
  // distinguish internal paste from external paste during exams.
  const internalClipboardRef = useRef<string>("");

  const [terminalHeight, setTerminalHeight] = useState(220);
  const [explorerWidth, setExplorerWidth] = useState(200);
  const [previewWidth, setPreviewWidth] = useState(380);
  const examFinishedRef = useRef(false);

  const config = LANGUAGE_CONFIGS[language];

  const {
    loading,
    error,
    studentUser,
    grade,
    setGrade,
    feedback,
    setFeedback,
    examTimezoneOffset,
    endTime,
    endTimeRef,
    clockOffsetRef,
  } = useProjectLoader(id, isAdminReview);

  const {
    showTerminal,
    setShowTerminal,
    showPreview,
    setShowPreview,
    previewRefreshKey,
    terminalApiRef,
    handleRun,
    handleRunFile,
    handleRunTests,
    sendInput,
    stopExecution,
  } = useProjectRunner({ language, files, activeFileId, id, config, setRunning });

  const {
    isLockedOut,
    setIsLockedOut,
    isTabSwitchLocked,
    setIsTabSwitchLocked,
    isKeyboardAlertLocked,
    setIsKeyboardAlertLocked,
  } = useExamSecurity({ id, isExam, isReadOnly, allowCopyPaste, isInSEB, examFinishedRef, internalClipboardRef });

  const { handleSave, handleSaveRef } = useProjectSave({ id, files, setSaving, setSaveError });

  // ── Download ZIP ─────────────────────────────────────────────────────────────
  const handleDownloadZip = useCallback(async () => {
    await downloadProjectZip(files, projectName);
  }, [files, projectName]);

  const {
    savingGrade,
    handleSaveGrade,
    showHistory,
    setShowHistory,
    historyLoading,
    historyList,
    selectedSnapshot,
    setSelectedSnapshot,
    handleOpenHistory,
    handleViewSnapshot,
    unlocking,
    handleUnlockProject,
  } = useAdminReview({ id, grade, feedback, setSecurityLocked });

  const {
    handleExamSubmitted,
    retryingUnlock,
    handleRetryUnlock,
    exitingExam,
    handleExitExam,
    handleExitWithoutSubmit,
  } = useExamExit({ id, isInSEB, examFinishedRef, handleSave });

  useExamTimer({ isExam, isReadOnly, id, endTimeRef, clockOffsetRef, examFinishedRef, handleSaveRef });

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
      
      {/* ── Lock Screen: security lockout (persistent, no dismiss — 5+ real incidents) ── */}
      {securityLocked && isExam && !isAdminReview && (
        <SecurityLockedScreen
          retryingUnlock={retryingUnlock}
          onRetryUnlock={handleRetryUnlock}
          exitingExam={exitingExam}
          onExitExam={handleExitExam}
          onExitWithoutSubmit={handleExitWithoutSubmit}
        />
      )}

      {/* ── Lock Screen: SEB required ── */}
      {requireSeb && !isInSEB && isExam && !isReadOnly && (
        <SebRequiredScreen exitingExam={exitingExam} onExitWithoutSubmit={handleExitWithoutSubmit} />
      )}

      {/* ── Lock Screen: fullscreen exit ── */}
      {isLockedOut && isExam && <FullscreenLockScreen />}

      {/* ── Lock Screen: tab / window switch ── */}
      {isTabSwitchLocked && isExam && (
        <TabSwitchLockScreen onDismiss={() => setIsTabSwitchLocked(false)} />
      )}

      {/* ── Lock Screen: keyboard escape attempt ── */}
      {isKeyboardAlertLocked && isExam && (
        <KeyboardLockScreen onDismiss={() => setIsKeyboardAlertLocked(false)} />
      )}

      {/* ── Read-only banner: admin review OR student post-submission ── */}
      {isReadOnly && (
        <ReadOnlyBanner
          isAdminReview={isAdminReview}
          reviewFrom={reviewFrom}
          isInSEB={isInSEB}
          securityLocked={securityLocked}
          unlocking={unlocking}
          studentUser={studentUser}
          grade={grade}
          setGrade={setGrade}
          feedback={feedback}
          setFeedback={setFeedback}
          savingGrade={savingGrade}
          onBack={() => (reviewFrom ? navigate(`/admin/assignments?group=${reviewFrom}`) : navigate("/admin/assignments"))}
          onOpenHistory={handleOpenHistory}
          onUnlock={handleUnlockProject}
          onSaveGrade={handleSaveGrade}
          onCloseSeb={() => { window.location.href = "/seb-quit"; }}
        />
      )}

      {/* ── Toolbar ── */}
      <Toolbar
        onRun={handleRun}
        onStop={stopExecution}
        onSave={handleSave}
        onDownload={handleDownloadZip}
        onRunTests={handleRunTests}
        showTerminal={showTerminal}
        onToggleTerminal={() => setShowTerminal((v) => !v)}
        showPreview={showPreview}
        onTogglePreview={() => setShowPreview((v) => !v)}
        onExamSubmitted={handleExamSubmitted}
        onExitWithoutSubmit={handleExitWithoutSubmit}
        endTime={endTime}
        clockOffset={clockOffsetRef.current}
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
            {activeFile?.file_type === "pdf" ? (
              <iframe
                key={activeFile.id}
                src={uploadUrl(activeFile.external_url)}
                title={activeFile.name}
                className="w-full h-full bg-white"
              />
            ) : activeFile ? (
              <Editor
                height="100%"
                path={activeFile.path || activeFile.name}
                language={getMonacoLanguage(activeFile.name)}
                value={activeFile.content}
                onChange={(val) => {
                  // Al cambiar de archivo, Monaco cambia de modelo y dispara `onChange` con el
                  // contenido del archivo NUEVO, mientras que este closure todavía apunta al
                  // `activeFile` ANTERIOR: sin esta guarda, el contenido del archivo recién
                  // abierto se escribía encima del que acabábamos de dejar. En un examen eso
                  // corrompía el proyecto del alumno con solo pasear por las pestañas (el CSS
                  // acababa dentro de index.html y la vista previa mostraba código).
                  // Solo escribimos si el modelo que tiene el editor es el de este archivo.
                  const modelo = editorInstanceRef.current?.getModel();
                  const ruta = activeFile.path || activeFile.name;
                  if (modelo && modelo.uri.path !== ruta) return;
                  updateFileContent(activeFile.id, val ?? "");
                }}
                theme={theme === "dark" ? "vs-dark" : "vs"}
                beforeMount={setupMonacoCompletion}
                onMount={(editor) => {
                  editorInstanceRef.current = editor;
                  // Track copy/cut inside Monaco for the internal clipboard.
                  // Only update the ref when the user explicitly copies or cuts —
                  // NOT on every cursor selection change. If we updated on selection
                  // change, moving the cursor after copying would reset the ref to
                  // the new (possibly empty) selection, causing the paste check to
                  // block a legitimate internal paste.
                  if (isExam && !allowCopyPaste) {
                    const captureSelection = () => {
                      const selection = editor.getSelection();
                      if (selection && !selection.isEmpty()) {
                        const model = editor.getModel();
                        if (model) {
                          internalClipboardRef.current = model.getValueInRange(selection);
                        }
                      }
                    };

                    // Ctrl+C — capture then copy
                    editor.addCommand(
                      // eslint-disable-next-line no-bitwise
                      (window as any).monaco?.KeyMod?.CtrlCmd | (window as any).monaco?.KeyCode?.KeyC,
                      () => {
                        captureSelection();
                        editor.trigger('keyboard', 'editor.action.clipboardCopyAction', null);
                      }
                    );
                    // Ctrl+X — capture then cut
                    editor.addCommand(
                      // eslint-disable-next-line no-bitwise
                      (window as any).monaco?.KeyMod?.CtrlCmd | (window as any).monaco?.KeyCode?.KeyX,
                      () => {
                        captureSelection();
                        editor.trigger('keyboard', 'editor.action.clipboardCutAction', null);
                      }
                    );
                  }
                }}
                options={{
                  readOnly: isReadOnly,
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

        {/* Preview panel — each mobile language gets its own phone-frame embed */}
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
              <ErrorBoundary key={previewRefreshKey}>
                {language === "flutter" ? (
                  <FlutterPreviewPanel refreshKey={previewRefreshKey} />
                ) : language === "react-native" ? (
                  <ReactNativePreviewPanel refreshKey={previewRefreshKey} />
                ) : (
                  <PreviewPanel refreshKey={previewRefreshKey} />
                )}
              </ErrorBoundary>
            </div>
          </>
        )}
      </div>

      {/* ── Admin: modal de historial de cambios (snapshots) ── */}
      {showHistory && isAdminReview && (
        <SnapshotHistoryModal
          historyLoading={historyLoading}
          historyList={historyList}
          selectedSnapshot={selectedSnapshot}
          examTimezoneOffset={examTimezoneOffset}
          onSelectSnapshot={handleViewSnapshot}
          onClose={() => { setShowHistory(false); setSelectedSnapshot(null); }}
        />
      )}
    </div>
  );
}
