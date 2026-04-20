import { useState, useEffect } from "react";
import { Play, Square, Save, Loader2, ChevronLeft, TerminalSquare, Eye, EyeOff, Sun, Moon, Timer, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LANGUAGE_CONFIGS } from "../templates";
import { usePlaygroundStore } from "../store/playgroundStore";
import { useTheme } from "../../../../shared/theme/ThemeProvider";

import http from "../../../../shared/api/http";

interface ToolbarProps {
  onRun: () => void;
  onStop: () => void;
  onSave: () => void;
  onDownload: () => void;
  showTerminal: boolean;
  onToggleTerminal: () => void;
  showPreview: boolean;
  onTogglePreview: () => void;
  onExamSubmitted?: () => void;
  endTime?: Date | null;
}

export default function Toolbar({
  onRun,
  onStop,
  onSave,
  onDownload,
  showTerminal,
  onToggleTerminal,
  showPreview,
  onTogglePreview,
  onExamSubmitted,
  endTime,
}: ToolbarProps) {
  const navigate = useNavigate();
  const { projectId, projectName, language, isRunning, isSaving, isExam } = usePlaygroundStore();
  const { theme, toggle } = useTheme();

  // ── Countdown timer ─────────────────────────────────────────────────────────
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  useEffect(() => {
    if (!isExam || !endTime) { setTimeLeft(null); return; }

    const tick = () => {
      const now = Date.now();
      const diff = endTime.getTime() - now;
      if (diff <= 0) { setTimeLeft("00:00"); return; }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [isExam, endTime]);

  const handleSubmitExam = async () => {
    if (!projectId) return;
    if (!window.confirm("¿Estás seguro de que deseas entregar el examen? Ya no podrás realizar más modificaciones.")) return;
    try {
      await onSave(); // save files before submitting
      await http.post(`/playground/${projectId}/submit`);
      onExamSubmitted?.();
    } catch (err) {
      alert("Error al entregar el examen.");
    }
  };

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

      {/* Download ZIP */}
      <button
        onClick={onDownload}
        title="Descargar código como ZIP"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <Download size={14} />
        <span className="hidden sm:inline">Descargar</span>
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

      {/* Submit Exam + Timer */}
      {isExam && (
        <>
          {timeLeft !== null && (
            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-mono font-bold border ${
              timeLeft === "00:00"
                ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-300 dark:border-red-700 animate-pulse"
                : parseInt(timeLeft) < 5
                  ? "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border-orange-300 dark:border-orange-700"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600"
            }`}>
              <Timer size={13} />
              {timeLeft}
            </div>
          )}
          <button
            onClick={handleSubmitExam}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded text-xs font-semibold bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/20 transition-all"
          >
            <span>Entregar Examen</span>
          </button>
        </>
      )}

      {/* Run / Stop */}
      {isRunning ? (
        <button
          onClick={onStop}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded text-xs font-semibold bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/20 transition-all"
        >
          <Square size={14} fill="currentColor" />
          <span>Detener</span>
        </button>
      ) : (
        <button
          onClick={onRun}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded text-xs font-semibold bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-500/20 transition-all"
        >
          <Play size={14} fill="currentColor" />
          <span>Ejecutar</span>
        </button>
      )}
    </header>
  );
}
