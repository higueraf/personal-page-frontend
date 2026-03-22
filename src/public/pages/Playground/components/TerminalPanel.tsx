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

interface TerminalPanelProps {
  onRun?: () => void;
}

export default function TerminalPanel({ onRun }: TerminalPanelProps) {
  const terminalLines = usePlaygroundStore((s) => s.terminalLines);
  const clearTerminal = usePlaygroundStore((s) => s.clearTerminal);
  const language = usePlaygroundStore((s) => s.language);
  const { theme } = useTheme();

  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const prevLinesCount = useRef(0);
  const inputBuffer = useRef(""); // keyboard input buffer
  const hasInitialized = useRef(false); // prevents double prompt on mount
  const onRunRef = useRef(onRun);       // stable ref for onRun callback
  const themeRef = useRef(theme);       // stable ref for theme at mount time
  themeRef.current = theme;             // always up-to-date (sync on each render)

  // Keep onRunRef in sync with the latest prop value
  useEffect(() => {
    onRunRef.current = onRun;
  }, [onRun]);

  // Sync xterm color theme when the app theme changes (dark ↔ light)
  useEffect(() => {
    if (termRef.current) {
      termRef.current.options.theme = TERMINAL_THEMES[theme];
    }
  }, [theme]);

  // Mount xterm once
  useEffect(() => {
    if (!containerRef.current) return;

    const term = new Terminal({
      theme: TERMINAL_THEMES[themeRef.current],
      fontFamily: '"Cascadia Code", "Fira Code", "JetBrains Mono", monospace',
      fontSize: 13,
      lineHeight: 1.5,
      cursorBlink: true,
      cursorStyle: "bar",
      scrollback: 1000,
      convertEol: true,
      disableStdin: false, // ← allow keyboard input
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(containerRef.current);
    fitAddon.fit();

    termRef.current = term;
    fitRef.current = fitAddon;

    // Welcome hint + initial prompt
    term.writeln(
      `\x1b[90m# Playground terminal  ·  escribe \x1b[36mhelp\x1b[90m para ver comandos\x1b[0m`
    );
    writePrompt(term, language);

    // ── Keyboard input ─────────────────────────────────────────────────────
    const disposable = term.onData((data) => {
      const code = data.charCodeAt(0);

      // Ctrl+C — cancel line
      if (data === "\x03") {
        term.writeln("^C");
        inputBuffer.current = "";
        writePrompt(term, language);
        return;
      }
      // Ctrl+L — clear
      if (data === "\x0c") {
        term.clear();
        inputBuffer.current = "";
        writePrompt(term, language);
        return;
      }
      // Enter
      if (code === 13) {
        const cmd = inputBuffer.current.trim();
        const cmdLower = cmd.toLowerCase();
        inputBuffer.current = "";
        term.writeln("");

        // Detect interpreter / run commands → trigger execution
        if (isRunCommand(cmdLower)) {
          if (onRunRef.current) {
            term.writeln(`\x1b[90m  ▶ Ejecutando…\x1b[0m`);
            onRunRef.current();
          } else {
            term.writeln(`\x1b[31m✖ No hay ningún runner activo\x1b[0m`);
          }
          writePrompt(term, usePlaygroundStore.getState().language);
          return;
        }

        handleCommand(term, cmdLower, language);
        return;
      }
      // Backspace
      if (code === 127 || data === "\x08") {
        if (inputBuffer.current.length > 0) {
          inputBuffer.current = inputBuffer.current.slice(0, -1);
          term.write("\b \b");
        }
        return;
      }
      // Ignore escape sequences (arrows, F-keys)
      if (data.startsWith("\x1b")) return;
      // Printable chars
      if (code >= 32 && code !== 127) {
        inputBuffer.current += data;
        term.write(data);
      }
    });

    const resizeObserver = new ResizeObserver(() => {
      try { fitAddon.fit(); } catch {}
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      disposable.dispose();
      resizeObserver.disconnect();
      term.dispose();
      termRef.current = null;
      // Reset so the clear-effect skips again on the next mount
      // (React StrictMode mounts effects twice in development)
      hasInitialized.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Write new output lines (from store)
  useEffect(() => {
    const term = termRef.current;
    if (!term) return;

    const newLines = terminalLines.slice(prevLinesCount.current);
    prevLinesCount.current = terminalLines.length;
    if (newLines.length === 0) return;

    // Erase user's partial input before writing output
    if (inputBuffer.current.length > 0) {
      term.write("\r" + " ".repeat(inputBuffer.current.length + 30) + "\r");
    }
    newLines.forEach((line) => term.writeln(line));
    // Re-print prompt + partial input
    writePrompt(term, usePlaygroundStore.getState().language);
    if (inputBuffer.current.length > 0) term.write(inputBuffer.current);
  }, [terminalLines]);

  // Full clear (triggered by clearTerminal() or language change)
  // hasInitialized prevents this from firing on initial mount — the
  // mount effect already wrote the first prompt.
  useEffect(() => {
    const term = termRef.current;
    if (!term) return;

    if (!hasInitialized.current) {
      // First execution: mark as initialized and skip (prompt already shown)
      hasInitialized.current = true;
      return;
    }

    if (terminalLines.length > 0) return;
    term.clear();
    prevLinesCount.current = 0;
    inputBuffer.current = "";
    writePrompt(term, language);
  }, [terminalLines.length, language]);

  // Refit on language change
  useEffect(() => {
    const id = setTimeout(() => {
      try { fitRef.current?.fit(); } catch {}
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
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-[10px] text-gray-400 dark:text-slate-600">
            Ctrl+L limpiar · Ctrl+C cancelar · run ejecutar · help comandos
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

/** Writes a styled shell prompt */
function writePrompt(term: Terminal, language: string) {
  const langColors: Record<string, string> = {
    python: "\x1b[34m",
    javascript: "\x1b[33m",
    typescript: "\x1b[34m",
    kotlin: "\x1b[35m",
    dart: "\x1b[36m",
    html: "\x1b[33m",
    react: "\x1b[36m",
    vue: "\x1b[32m",
    angular: "\x1b[31m",
  };
  const c = langColors[language] ?? "\x1b[37m";
  term.write(`\x1b[32m❯\x1b[0m ${c}${language}\x1b[0m \x1b[90m$\x1b[0m `);
}

/**
 * Returns true when the typed command looks like a language-runner invocation:
 *   python main.py | python3 app.py | node index.js | dart main.dart |
 *   kotlin Main.kt | kotlinc Main.kt | tsc main.ts | ts-node file.ts |
 *   tsx file.ts | npx tsx file.ts | java Main | javac Main.java |
 *   npm run dev | npm start | run
 */
function isRunCommand(cmd: string): boolean {
  return (
    /^(python3?|node|dart|kotlin|kotlinc|tsc|ts-node|tsx|java|javac|npx)\s+\S+/.test(cmd) ||
    /^npm\s+(run|start|test)\b/.test(cmd) ||
    cmd === "run" ||
    cmd === "npm start" ||
    cmd === "npm test"
  );
}

/** Handles commands typed in the terminal */
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
      term.writeln("  \x1b[32mpython main.py\x1b[0m  — Ejecutar Python");
      term.writeln("  \x1b[32mnode index.js\x1b[0m   — Ejecutar Node.js");
      term.writeln("  \x1b[32mdart main.dart\x1b[0m  — Ejecutar Dart");
      term.writeln("  \x1b[32mrun\x1b[0m             — Ejecutar código activo");
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
      term.writeln(
        `\x1b[31m✖ Comando no encontrado: \x1b[37m${cmd}\x1b[0m`
      );
      term.writeln(
        `\x1b[90m  Escribe \x1b[36mhelp\x1b[90m para ver comandos · \x1b[32mCtrl+Enter\x1b[90m para ejecutar código\x1b[0m`
      );
      writePrompt(term, language);
  }
}
