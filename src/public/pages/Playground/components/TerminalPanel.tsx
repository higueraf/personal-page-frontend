import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { Trash2 } from "lucide-react";
import { usePlaygroundStore } from "../store/playgroundStore";
import { useTheme } from "../../../../shared/theme/ThemeProvider";
import "@xterm/xterm/css/xterm.css";

// ─── xterm color themes ───────────────────────────────────────────────────────

const TERMINAL_THEMES = {
  dark: {
    background: "#0d1117",
    foreground: "#c9d1d9",
    cursor: "#58a6ff",
    cursorAccent: "#0d1117",
    selectionBackground: "#264f78",
    black: "#0d1117",
    brightBlack: "#6e7681",
    red: "#ff7b72",
    brightRed: "#ffa198",
    green: "#3fb950",
    brightGreen: "#56d364",
    yellow: "#d29922",
    brightYellow: "#e3b341",
    blue: "#58a6ff",
    brightBlue: "#79c0ff",
    magenta: "#bc8cff",
    brightMagenta: "#d2a8ff",
    cyan: "#76e3ea",
    brightCyan: "#b3f0ff",
    white: "#b1bac4",
    brightWhite: "#f0f6fc",
  },
  light: {
    background: "#f6f8fa",
    foreground: "#24292e",
    cursor: "#0969da",
    cursorAccent: "#f6f8fa",
    selectionBackground: "#c8d1da",
    black: "#24292e",
    brightBlack: "#57606a",
    red: "#cf222e",
    brightRed: "#a40e26",
    green: "#116329",
    brightGreen: "#1a7f37",
    yellow: "#4d2d00",
    brightYellow: "#633c01",
    blue: "#0969da",
    brightBlue: "#1f6feb",
    magenta: "#6e40c9",
    brightMagenta: "#8250df",
    cyan: "#1b7c83",
    brightCyan: "#3192aa",
    white: "#6e7781",
    brightWhite: "#24292e",
  },
} as const;

// ─── Public API exposed to the parent via onReady ─────────────────────────────

export interface TerminalApi {
  /** Write raw data (ANSI sequences included) directly to xterm */
  write: (data: string) => void;
  writeln: (data: string) => void;
  /** Full clear + reset cursor + erase input buffer */
  clear: () => void;
  fit: () => void;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface TerminalPanelProps {
  /** Called when user types a run command while no execution is active */
  onRun?: () => void;
  /** Called when user types a run command with a specific file (e.g. 'kotlin archivo.kt') */
  onRunFile?: (targetFile: string) => void;
  /** Whether a process is currently running (stdin live mode) */
  isRunning?: boolean;
  /** Forward raw keystrokes to the running process stdin */
  sendInput?: (data: string) => void;
  /** Stop / kill the running process (triggered on Ctrl+C while running) */
  onKill?: () => void;
  /** Called once after xterm is mounted, with the imperative API */
  onReady?: (api: TerminalApi) => void;
}

export default function TerminalPanel({
  onRun,
  onRunFile,
  isRunning = false,
  sendInput,
  onKill,
  onReady,
}: TerminalPanelProps) {
  const terminalLines = usePlaygroundStore((s) => s.terminalLines);
  const clearTerminal = usePlaygroundStore((s) => s.clearTerminal);
  const language = usePlaygroundStore((s) => s.language);
  const { theme } = useTheme();

  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const prevLinesCount = useRef(0);
  const inputBuffer = useRef(""); // keyboard buffer for fake-shell mode
  const hasInitialized = useRef(false);

  // Stable refs for callbacks
  const onRunRef = useRef(onRun);
  const onRunFileRef = useRef(onRunFile);
  const sendInputRef = useRef(sendInput);
  const onKillRef = useRef(onKill);
  const isRunningRef = useRef(isRunning);
  const themeRef = useRef(theme);
  themeRef.current = theme;

  useEffect(() => { onRunRef.current = onRun; }, [onRun]);
  useEffect(() => { onRunFileRef.current = onRunFile; }, [onRunFile]);
  useEffect(() => { sendInputRef.current = sendInput; }, [sendInput]);
  useEffect(() => { onKillRef.current = onKill; }, [onKill]);
  useEffect(() => { isRunningRef.current = isRunning; }, [isRunning]);

  // Sync xterm color theme on dark ↔ light change
  useEffect(() => {
    if (termRef.current) {
      termRef.current.options.theme = TERMINAL_THEMES[theme];
    }
  }, [theme]);

  // Write new prompt when execution finishes (isRunning: true → false)
  const prevIsRunning = useRef(isRunning);
  useEffect(() => {
    if (prevIsRunning.current && !isRunning) {
      if (termRef.current) {
        inputBuffer.current = "";
        writePrompt(termRef.current, usePlaygroundStore.getState().language);
      }
    }
    prevIsRunning.current = isRunning;
  }, [isRunning]);

  // ── Mount xterm once ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;

    const term = new Terminal({
      theme: TERMINAL_THEMES[themeRef.current],
      fontFamily: '"Cascadia Code", "Fira Code", "JetBrains Mono", monospace',
      fontSize: 13,
      lineHeight: 1.5,
      cursorBlink: true,
      cursorStyle: "bar",
      scrollback: 5000,
      convertEol: true,
      disableStdin: false,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(containerRef.current);
    fitAddon.fit();

    termRef.current = term;
    fitRef.current = fitAddon;

    // Expose imperative API to parent
    if (onReady) {
      onReady({
        write: (data) => termRef.current?.write(data),
        writeln: (data) => termRef.current?.writeln(data),
        clear: () => {
          termRef.current?.clear();
          prevLinesCount.current = 0;
          inputBuffer.current = "";
        },
        fit: () => { try { fitRef.current?.fit(); } catch { /* ignore */ } },
      });
    }

    // Welcome hint + initial prompt
    term.writeln(
      `\x1b[90m# Playground terminal  ·  escribe \x1b[36mhelp\x1b[90m para ver comandos\x1b[0m`
    );
    writePrompt(term, language);

    // ── Keyboard input ──────────────────────────────────────────────────────
    const disposable = term.onData((data) => {
      const code = data.charCodeAt(0);

      // ── RUNNING MODE: forward all keystrokes to the process stdin ──────────
      if (isRunningRef.current) {
        // Ctrl+C → send SIGINT to process and ask parent to kill
        if (data === "\x03") {
          term.write("^C\r\n");
          sendInputRef.current?.("\x03");
          onKillRef.current?.();
          return;
        }
        // Ctrl+L → clear locally only (process doesn't need it)
        if (data === "\x0c") {
          term.clear();
          return;
        }
        // Enter → local echo + send newline to stdin
        if (code === 13) {
          term.write("\r\n");
          sendInputRef.current?.("\n");
          return;
        }
        // Backspace
        if (code === 127 || data === "\x08") {
          term.write("\b \b");
          sendInputRef.current?.("\x7f");
          return;
        }
        // Ignore escape sequences (arrows, F-keys) — don't forward to process
        if (data.startsWith("\x1b")) return;
        // Printable chars: echo locally + forward to stdin char by char
        if (code >= 32 && code !== 127) {
          term.write(data);
          sendInputRef.current?.(data);
        }
        return;
      }

      // ── IDLE MODE: fake-shell interpreter ──────────────────────────────────
      if (data === "\x03") {
        term.writeln("^C");
        inputBuffer.current = "";
        writePrompt(term, usePlaygroundStore.getState().language);
        return;
      }
      if (data === "\x0c") {
        term.clear();
        inputBuffer.current = "";
        writePrompt(term, usePlaygroundStore.getState().language);
        return;
      }
      if (code === 13) {
        const cmd = inputBuffer.current.trim();
        inputBuffer.current = "";
        term.writeln("");

        if (isRunCommand(cmd)) {
          const targetFile = extractTargetFile(cmd);
          if (targetFile && onRunFileRef.current) {
            term.writeln(`\x1b[90m  ▶ Ejecutando ${targetFile}…\x1b[0m`);
            onRunFileRef.current(targetFile);
          } else if (onRunRef.current) {
            term.writeln(`\x1b[90m  ▶ Ejecutando…\x1b[0m`);
            onRunRef.current();
          } else {
            term.writeln(`\x1b[31m✖ No hay ningún runner activo\x1b[0m`);
          }
          writePrompt(term, usePlaygroundStore.getState().language);
          return;
        }

        handleCommand(term, cmd.toLowerCase(), usePlaygroundStore.getState().language);
        return;
      }
      if (code === 127 || data === "\x08") {
        if (inputBuffer.current.length > 0) {
          inputBuffer.current = inputBuffer.current.slice(0, -1);
          term.write("\b \b");
        }
        return;
      }
      if (data.startsWith("\x1b")) return;
      if (code >= 32 && code !== 127) {
        inputBuffer.current += data;
        term.write(data);
      }
    });

    const resizeObserver = new ResizeObserver(() => {
      try { fitAddon.fit(); } catch { /* ignore */ }
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      disposable.dispose();
      resizeObserver.disconnect();
      term.dispose();
      termRef.current = null;
      hasInitialized.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Write new lines from the store (used by handleCommand / legacy path) ──
  useEffect(() => {
    const term = termRef.current;
    if (!term) return;

    const newLines = terminalLines.slice(prevLinesCount.current);
    prevLinesCount.current = terminalLines.length;
    if (newLines.length === 0) return;

    if (inputBuffer.current.length > 0) {
      term.write("\r" + " ".repeat(inputBuffer.current.length + 30) + "\r");
    }
    newLines.forEach((line) => term.writeln(line));
    writePrompt(term, usePlaygroundStore.getState().language);
    if (inputBuffer.current.length > 0) term.write(inputBuffer.current);
  }, [terminalLines]);

  // ── Full clear (triggered by clearTerminal() from the Toolbar button) ─────
  useEffect(() => {
    const term = termRef.current;
    if (!term) return;

    if (!hasInitialized.current) {
      hasInitialized.current = true;
      return;
    }

    if (terminalLines.length > 0) return;
    term.clear();
    prevLinesCount.current = 0;
    inputBuffer.current = "";
    if (!isRunningRef.current) writePrompt(term, language);
  }, [terminalLines.length, language]);

  // Refit on language change
  useEffect(() => {
    const id = setTimeout(() => {
      try { fitRef.current?.fit(); } catch { /* ignore */ }
    }, 50);
    return () => clearTimeout(id);
  }, [language]);

  return (
    <div className={`flex flex-col h-full ${theme === "dark" ? "bg-[#0d1117]" : "bg-[#f6f8fa]"}`}>
      {/* Terminal header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-gray-100 dark:bg-[#161b22] border-b border-black/10 dark:border-white/10 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500/80" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <span className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <span className="text-[10px] text-gray-500 dark:text-slate-400 font-mono uppercase tracking-wider">
            Terminal
          </span>
          {isRunning && (
            <span className="flex items-center gap-1 text-[10px] text-green-500 font-mono animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
              ejecutando
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-[10px] text-gray-400 dark:text-slate-600">
            {isRunning
              ? "Ctrl+C cancelar proceso · escribe para enviar input"
              : "Ctrl+L limpiar · Ctrl+C cancelar · run ejecutar · help comandos"}
          </span>
          <button
            onClick={clearTerminal}
            title="Limpiar terminal"
            className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 transition-colors px-1.5 py-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10"
          >
            <Trash2 size={10} />
            Limpiar
          </button>
        </div>
      </div>

      {/* xterm container */}
      <div ref={containerRef} className="flex-1 overflow-hidden p-1" />
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function writePrompt(term: Terminal, language: string) {
  const langColors: Record<string, string> = {
    python:     "\x1b[34m",
    javascript: "\x1b[33m",
    typescript: "\x1b[34m",
    kotlin:     "\x1b[35m",
    dart:       "\x1b[36m",
    html:       "\x1b[33m",
    react:      "\x1b[36m",
    vue:        "\x1b[32m",
    angular:    "\x1b[31m",
  };
  const c = langColors[language] ?? "\x1b[37m";
  term.write(`\x1b[32m❯\x1b[0m ${c}${language}\x1b[0m \x1b[90m$\x1b[0m `);
}

function isRunCommand(cmd: string): boolean {
  const lower = cmd.toLowerCase();
  return (
    /^(python3?|node|dart|kotlin|kotlinc|tsc|ts-node|tsx|java|javac|npx)\s+\S+/i.test(cmd) ||
    /^npm\s+(run|start|test)\b/i.test(cmd) ||
    lower === "run" ||
    lower === "npm start" ||
    lower === "npm test"
  );
}

/** Extract the target filename from a terminal command like 'kotlin archivo.kt' */
function extractTargetFile(cmd: string): string | null {
  const match = cmd.match(
    /^(?:python3?|node|dart|kotlin|kotlinc|tsc|ts-node|tsx|java|javac|npx)\s+(\S+)/i,
  );
  return match ? match[1] : null;
}

function handleCommand(term: Terminal, cmd: string, language: string) {
  switch (cmd) {
    case "":
      writePrompt(term, language);
      break;

    case "clear":
    case "cls":
      term.clear();
      writePrompt(term, language);
      break;

    case "help":
      term.writeln("\x1b[36m╔══════════════════════════════════════╗\x1b[0m");
      term.writeln("\x1b[36m║     Playground Terminal  🖥️            ║\x1b[0m");
      term.writeln("\x1b[36m╚══════════════════════════════════════╝\x1b[0m");
      term.writeln("");
      term.writeln("\x1b[33mComandos disponibles:\x1b[0m");
      term.writeln("  \x1b[32mhelp\x1b[0m            — Esta ayuda");
      term.writeln("  \x1b[32mclear\x1b[0m           — Limpiar pantalla");
      term.writeln("  \x1b[32mlang\x1b[0m            — Ver lenguaje activo");
      term.writeln("  \x1b[32mCtrl+L\x1b[0m         — Limpiar pantalla");
      term.writeln("  \x1b[32mCtrl+C\x1b[0m         — Cancelar entrada");
      term.writeln("");
      term.writeln("\x1b[33mEjecución de código:\x1b[0m");
      term.writeln("  \x1b[32mpython main.py\x1b[0m    — Ejecutar archivo Python");
      term.writeln("  \x1b[32mnode index.js\x1b[0m     — Ejecutar archivo Node.js");
      term.writeln("  \x1b[32mkotlin archivo.kt\x1b[0m — Ejecutar archivo Kotlin");
      term.writeln("  \x1b[32mdart main.dart\x1b[0m    — Ejecutar archivo Dart");
      term.writeln("  \x1b[32mrun\x1b[0m               — Ejecutar archivo principal");
      term.writeln("");
      term.writeln(
        `\x1b[90m💡 Usa \x1b[0m\x1b[32mCtrl+Enter\x1b[0m\x1b[90m o el botón \x1b[0m\x1b[32m▶ Ejecutar\x1b[0m\x1b[90m para correr tu código\x1b[0m`
      );
      term.writeln("");
      writePrompt(term, language);
      break;

    case "lang":
    case "language":
      term.writeln(`\x1b[36m  Lenguaje activo: \x1b[33m${language}\x1b[0m`);
      writePrompt(term, language);
      break;

    default:
      term.writeln(`\x1b[31m✖ Comando no encontrado: \x1b[37m${cmd}\x1b[0m`);
      term.writeln(
        `\x1b[90m  Escribe \x1b[36mhelp\x1b[90m para ver comandos · \x1b[32mCtrl+Enter\x1b[90m para ejecutar código\x1b[0m`
      );
      writePrompt(term, language);
  }
}
