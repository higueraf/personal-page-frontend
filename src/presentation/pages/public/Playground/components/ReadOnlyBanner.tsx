import { History, Lock } from "lucide-react";

interface ReadOnlyBannerProps {
  isAdminReview: boolean;
  reviewFrom: string | null;
  isInSEB: boolean;
  securityLocked: boolean;
  unlocking: boolean;
  studentUser: { first_name: string; last_name: string; email: string } | null;
  grade: number | "";
  setGrade: (g: number | "") => void;
  feedback: string;
  setFeedback: (f: string) => void;
  savingGrade: boolean;
  onBack: () => void;
  onOpenHistory: () => void;
  onUnlock: () => void;
  onSaveGrade: () => void;
  onCloseSeb: () => void;
}

export default function ReadOnlyBanner({
  isAdminReview,
  isInSEB,
  securityLocked,
  unlocking,
  studentUser,
  grade,
  setGrade,
  feedback,
  setFeedback,
  savingGrade,
  onBack,
  onOpenHistory,
  onUnlock,
  onSaveGrade,
  onCloseSeb,
}: ReadOnlyBannerProps) {
  return (
    <div className="flex flex-col gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-300 text-sm font-medium shrink-0">
      <div className="flex items-center gap-3 flex-wrap">
        {isAdminReview && (
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1 bg-amber-200 dark:bg-amber-800/50 hover:bg-amber-300 dark:hover:bg-amber-700/60 rounded-lg text-amber-900 dark:text-amber-200 font-semibold text-xs transition-colors"
          >
            ← Volver a proyectos del examen
          </button>
        )}
        {isAdminReview && (
          <button
            onClick={onOpenHistory}
            className="flex items-center gap-1.5 px-3 py-1 bg-amber-200 dark:bg-amber-800/50 hover:bg-amber-300 dark:hover:bg-amber-700/60 rounded-lg text-amber-900 dark:text-amber-200 font-semibold text-xs transition-colors"
          >
            <History size={14} /> Ver historial
          </button>
        )}
        {isAdminReview && securityLocked && (
          <button
            disabled={unlocking}
            onClick={onUnlock}
            className="flex items-center gap-1.5 px-3 py-1 bg-red-200 dark:bg-red-800/50 hover:bg-red-300 dark:hover:bg-red-700/60 disabled:opacity-50 rounded-lg text-red-900 dark:text-red-200 font-semibold text-xs transition-colors"
          >
            <Lock size={14} /> {unlocking ? "Reactivando…" : "Reactivar examen bloqueado"}
          </button>
        )}
        <span className="text-xs opacity-90">
          {isAdminReview
            ? `Modo revisión — revisando examen de ${studentUser ? `${studentUser.first_name} ${studentUser.last_name}` : "alumno"}`
            : "Examen entregado — modo solo lectura, puedes ver y ejecutar tu código"}
        </span>
        {!isAdminReview && isInSEB && (
          <button
            onClick={onCloseSeb}
            className="flex items-center gap-1.5 px-3 py-1 bg-amber-600 hover:bg-amber-500 rounded-lg text-white font-semibold text-xs transition-colors"
          >
            Cerrar Safe Exam Browser
          </button>
        )}
      </div>

      {isAdminReview && (
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-xs">Nota (0-10):</label>
          <input
            type="number"
            min={0}
            max={10}
            step={0.1}
            value={grade}
            onChange={(e) => setGrade(e.target.value === "" ? "" : Number(e.target.value))}
            className="w-20 px-2 py-1 rounded border border-amber-300 dark:border-amber-700 bg-white dark:bg-[#1c1a10] text-xs text-gray-900 dark:text-white"
          />
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Feedback (opcional)"
            rows={1}
            className="flex-1 min-w-[200px] px-2 py-1 rounded border border-amber-300 dark:border-amber-700 bg-white dark:bg-[#1c1a10] text-xs text-gray-900 dark:text-white resize-y"
          />
          <button
            disabled={savingGrade || grade === ""}
            onClick={onSaveGrade}
            className="px-3 py-1 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded text-xs font-semibold transition-colors"
          >
            {savingGrade ? "Guardando…" : "Guardar nota"}
          </button>
        </div>
      )}
    </div>
  );
}
