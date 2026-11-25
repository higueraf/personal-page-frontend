import { X } from "lucide-react";
import { usePlaygroundStore } from "../store/playgroundStore";

interface TabBarProps {
  files: ReturnType<typeof usePlaygroundStore.getState>["files"];
  openFileIds: string[];
  activeFileId: string | null;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
}

export default function TabBar({ files, openFileIds, activeFileId, onSelect, onClose }: TabBarProps) {
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
