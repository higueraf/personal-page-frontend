import { Play, Save, Loader2, ChevronLeft, TerminalSquare, Eye, EyeOff, Sun, Moon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LANGUAGE_CONFIGS } from "../templates";
import { usePlaygroundStore } from "../store/playgroundStore";
import { useTheme } from "../../../../shared/theme/ThemeProvider";

interface ToolbarProps {
  onRun: () => void;
  onSave: () => void;
  showTerminal: boolean;
  onToggleTerminal: () => void;
  showPreview: boolean;
  onTogglePreview: () => void;
}

export default function Toolbar({
  onRun,
  onSave,
  showTerminal,
  onToggleTerminal,
  showPreview,
  onTogglePreview,
}: ToolbarProps) {
  const navigate = useNavigate();
  const { projectName, language, isRunning, isSaving } = usePlaygroundStore();
  const { theme, toggle } = useTheme();

  const config = LANGUAGE_CONFIGS[language];

  return (
    <header className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-[#161b22] border-b border-black/10 dark:border-white/10 flex-shrink-0 z-10 shadow-sm dark:shadow-none">
      {/* Back */}
      <button
        onClick={() => navigate("/playground")}
        className="flex items-center gap-1 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors text-sm px-2 py-1 rounded hover:bg-black/5 dark:hover:bg-white/10"
      >
        <ChevronLeft size={16} />
      </button>

      <div className="w-px h-5 bg-black/10 dark:bg-white/10" />

      {/* Language badge */}
      <div
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.borderColor} ${config.bgColor} ${config.color}`}
      >
        <span>{config.emoji}</span>
        <span>{config.label}</span>
      </div>

      {/* Project name */}
      <span className="text-gray-700 dark:text-slate-300 text-sm font-medium truncate max-w-[200px]">
        {projectName}
      </span>

      <div className="flex-1" />

      {/* Toggle terminal */}
      <button
        onClick={onToggleTerminal}
        title={showTerminal ? "Ocultar terminal" : "Mostrar terminal"}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs transition-colors ${
          showTerminal
            ? "bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-white"
            : "text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10"
        }`}
      >
        <TerminalSquare size={14} />
        <span className="hidden sm:inline">Terminal</span>
      </button>

      {/* Toggle preview (only for web languages) */}
      {config.supportsPreview && (
        <button
          onClick={onTogglePreview}
          title={showPreview ? "Ocultar preview" : "Mostrar preview"}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs transition-colors ${
            showPreview
              ? "bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-white"
              : "text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10"
          }`}
        >
          {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
          <span className="hidden sm:inline">Preview</span>
        </button>
      )}

      <div className="w-px h-5 bg-black/10 dark:bg-white/10" />

      {/* Theme toggle */}
      <button
        onClick={toggle}
        title={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
        className="p-1.5 rounded text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
      >
        {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
      </button>

      {/* Save */}
      <button
        onClick={onSave}
        disabled={isSaving}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-50"
      >
        {isSaving ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Save size={14} />
        )}
        <span className="hidden sm:inline">Guardar</span>
      </button>

      {/* Run */}
      <button
        onClick={onRun}
        disabled={isRunning}
        className={`flex items-center gap-1.5 px-4 py-1.5 rounded text-xs font-semibold transition-all disabled:opacity-60 ${
          isRunning
            ? "bg-green-600/40 text-green-600 dark:text-green-300"
            : "bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-500/20"
        }`}
      >
        {isRunning ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            <span>Ejecutando…</span>
          </>
        ) : (
          <>
            <Play size={14} fill="currentColor" />
            <span>Ejecutar</span>
          </>
        )}
      </button>
    </header>
  );
}
