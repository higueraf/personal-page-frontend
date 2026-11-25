import { History, X } from "lucide-react";
import { formatInOffset } from "../../../../lib/timezone";

interface SnapshotHistoryModalProps {
  historyLoading: boolean;
  historyList: { id: string; created_at: string; file_count: number }[];
  selectedSnapshot: { id: string; created_at: string; files: any[] } | null;
  examTimezoneOffset: number;
  onSelectSnapshot: (snapshotId: string) => void;
  onClose: () => void;
}

export default function SnapshotHistoryModal({
  historyLoading,
  historyList,
  selectedSnapshot,
  examTimezoneOffset,
  onSelectSnapshot,
  onClose,
}: SnapshotHistoryModalProps) {
  return (
    <div className="fixed inset-0 bg-black/60 z-[10001] flex items-center justify-center p-6">
      <div className="bg-white dark:bg-[#161b22] rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-black/10 dark:border-white/10">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <History size={16} /> Historial de cambios
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 dark:text-slate-400"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex flex-1 overflow-hidden">
          {/* Timeline */}
          <div className="w-64 shrink-0 border-r border-black/10 dark:border-white/10 overflow-y-auto">
            {historyLoading ? (
              <p className="text-xs text-gray-500 dark:text-slate-400 p-4">Cargando…</p>
            ) : historyList.length === 0 ? (
              <p className="text-xs text-gray-500 dark:text-slate-400 p-4">Sin snapshots guardados aún.</p>
            ) : (
              <ul>
                {historyList.map((snap) => (
                  <li key={snap.id}>
                    <button
                      onClick={() => onSelectSnapshot(snap.id)}
                      className={`w-full text-left px-4 py-2 text-xs border-b border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${
                        selectedSnapshot?.id === snap.id ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300" : "text-gray-700 dark:text-slate-300"
                      }`}
                    >
                      <div className="font-medium">{formatInOffset(snap.created_at, examTimezoneOffset)}</div>
                      <div className="text-[11px] opacity-70">{snap.file_count} archivo(s)</div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {/* Snapshot files viewer (read-only, no afecta el proyecto real) */}
          <div className="flex-1 overflow-y-auto p-4">
            {!selectedSnapshot ? (
              <p className="text-xs text-gray-500 dark:text-slate-400">Selecciona un momento del historial para ver los archivos de ese snapshot.</p>
            ) : (
              <div className="space-y-4">
                {selectedSnapshot.files
                  .filter((f) => !f.is_folder)
                  .map((f, idx) => (
                    <div key={f.id ?? idx} className="border border-black/10 dark:border-white/10 rounded-lg overflow-hidden">
                      <div className="px-3 py-1.5 bg-gray-100 dark:bg-[#0d1117] text-xs font-mono text-gray-700 dark:text-slate-300">
                        {f.path || f.name}
                      </div>
                      <pre className="p-3 text-xs overflow-x-auto bg-white dark:bg-[#0d1117] text-gray-800 dark:text-slate-200 whitespace-pre-wrap">
                        {f.content}
                      </pre>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
