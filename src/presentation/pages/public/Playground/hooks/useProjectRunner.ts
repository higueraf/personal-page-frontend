import { useCallback, useEffect, useRef, useState } from "react";
import { useExecutionSocket } from "../runners/useExecutionSocket";
import type { TerminalApi } from "../components/TerminalPanel";
import type { VirtualFile, Language } from "../store/playgroundStore";
import type { LanguageConfig } from "../templates/index";

// ANSI color helpers for terminal output
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

interface UseProjectRunnerParams {
  language: Language;
  files: VirtualFile[];
  activeFileId: string | null;
  id: string | undefined;
  config: LanguageConfig;
  setRunning: (running: boolean) => void;
}

export function useProjectRunner({ language, files, activeFileId, id, config, setRunning }: UseProjectRunnerParams) {
  const terminalApiRef = useRef<TerminalApi | null>(null);

  const [showTerminal, setShowTerminal] = useState(true);
  const [showPreview, setShowPreview] = useState(true);
  const [previewRefreshKey, setPreviewRefreshKey] = useState(0);

  // ── Auto-show preview for web languages ─────────────────────────────────────
  useEffect(() => {
    setShowPreview(config.supportsPreview);
  }, [config.supportsPreview]);

  // ── WebSocket execution ──────────────────────────────────────────────────────
  const { startExecution, startTestExecution, sendInput, stopExecution } = useExecutionSocket({
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
    // Flutter and React Native use iframe embeds (DartPad / Expo Snack) —
    // no backend execution, no terminal output relevant to the user.
    // For all other languages the terminal stays visible.
    if (language !== "flutter" && language !== "react-native") {
      setShowTerminal(true);
    }

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

    // NestJS .spec.ts files have no Jest globals (describe/it/expect) when run
    // directly with tsx — they need to go through the Jest runner instead
    // (same one the "Ejecutar tests" button uses).
    if (language === "nestjs" && targetFile && /\.(spec|test)\.ts$/.test(targetFile)) {
      const now = new Date().toLocaleTimeString();
      terminalApiRef.current?.write(
        `${C.gray}[${now}]${C.reset} ${C.yellow}⚠ ${targetFile} es un archivo de test: ejecutándolo con Jest en vez de tsx…${C.reset}\r\n`
      );
      terminalApiRef.current?.write(`${C.dim}${"─".repeat(48)}${C.reset}\r\n`);
      startTestExecution(files, language, id);
      return;
    }

    const now = new Date().toLocaleTimeString();
    const label = targetFile ?? config.label;
    terminalApiRef.current?.write(
      `${C.gray}[${now}]${C.reset} ${C.bold}${C.green}▶ Ejecutando ${label}…${C.reset}\r\n`
    );
    terminalApiRef.current?.write(`${C.dim}${"─".repeat(48)}${C.reset}\r\n`);

    startExecution(language, files, targetFile, id);
  }, [
    config,
    language,
    files,
    activeFileId,
    id,
    setRunning,
    setShowTerminal,
    startExecution,
    startTestExecution,
  ]);

  // ── Run specific file (from terminal commands like `kotlin archivo.kt`) ────
  const handleRunFile = useCallback((targetFile: string) => {
    // Framework/bundled projects (React, React Native, Vue, Angular, HTML…) always run
    // as a whole project through their entry point — never a single active/open file
    // (e.g. clicking "Ejecutar" while ENUNCIADO.md or any non-entry file is open must
    // never attempt to execute that file's raw content as if it were the app).
    if (config.runtime === "iframe") {
      setPreviewRefreshKey((k) => k + 1);
      setShowPreview(true);
      return;
    }

    setShowTerminal(true);

    terminalApiRef.current?.clear();
    setRunning(true);

    const now = new Date().toLocaleTimeString();
    terminalApiRef.current?.write(
      `${C.gray}[${now}]${C.reset} ${C.bold}${C.green}▶ Ejecutando ${targetFile}…${C.reset}\r\n`
    );
    terminalApiRef.current?.write(`${C.dim}${"─".repeat(48)}${C.reset}\r\n`);

    startExecution(language, files, targetFile, id);
  }, [
    config,
    language,
    files,
    id,
    setRunning,
    setShowPreview,
    startExecution,
  ]);

  // ── Run tests (Vitest, solo proyectos React de práctica) ────────────────────
  const handleRunTests = useCallback(() => {
    setShowTerminal(true);
    terminalApiRef.current?.clear();
    setRunning(true);

    const now = new Date().toLocaleTimeString();
    terminalApiRef.current?.write(
      `${C.gray}[${now}]${C.reset} ${C.bold}${C.green}▶ Ejecutando tests…${C.reset}\r\n`
    );
    terminalApiRef.current?.write(`${C.dim}${"─".repeat(48)}${C.reset}\r\n`);

    startTestExecution(files, language, id);
  }, [
    files,
    language,
    id,
    setRunning,
    setShowTerminal,
    startTestExecution,
  ]);

  return {
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
  };
}
