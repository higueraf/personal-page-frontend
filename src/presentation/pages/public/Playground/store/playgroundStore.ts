import { create } from "zustand";

export type Language =
  | "python"
  | "javascript"
  | "typescript"
  | "nestjs"
  | "kotlin"
  | "dart"
  | "r"
  | "html"
  | "react"
  | "flutter"
  | "react-native"
  | "vue"
  | "angular";

export interface VirtualFile {
  id: string;
  name: string;
  content: string;
  language: string;
  path: string;
  is_folder: boolean;
}

interface PlaygroundStore {
  projectId: string | null;
  projectName: string;
  language: Language;
  isExam: boolean;
  allowCopyPaste: boolean;
  requireSeb: boolean;
  isReadOnly: boolean;
  files: VirtualFile[];
  activeFileId: string | null;
  openFileIds: string[];
  isRunning: boolean;
  isSaving: boolean;
  terminalLines: string[];

  initProject: (
    id: string,
    name: string,
    language: Language,
    isExam: boolean,
    allowCopyPaste: boolean,
    requireSeb: boolean,
    files: VirtualFile[],
    isReadOnly?: boolean
  ) => void;
  setActiveFile: (id: string) => void;
  openFile: (id: string) => void;
  closeFile: (id: string) => void;
  updateFileContent: (id: string, content: string) => void;
  addFile: (file: VirtualFile) => void;
  removeFile: (id: string) => void;
  renameFile: (id: string, newName: string, newPath: string) => void;
  setRunning: (v: boolean) => void;
  setSaving: (v: boolean) => void;
  setReadOnly: (v: boolean) => void;
  appendTerminalLine: (line: string) => void;
  clearTerminal: () => void;
}

export const usePlaygroundStore = create<PlaygroundStore>((set) => ({
  projectId: null,
  projectName: "Mi Proyecto",
  language: "python",
  isExam: false,
  allowCopyPaste: true,
  requireSeb: false,
  isReadOnly: false,
  files: [],
  activeFileId: null,
  openFileIds: [],
  isRunning: false,
  isSaving: false,
  terminalLines: [],

  initProject: (id, name, language, isExam, allowCopyPaste, requireSeb, files, isReadOnly = false) => {
    const firstFile = files.find((f) => !f.is_folder);
    set({
      projectId: id,
      projectName: name,
      language,
      isExam,
      allowCopyPaste,
      requireSeb,
      isReadOnly,
      files,
      activeFileId: firstFile?.id ?? null,
      openFileIds: firstFile ? [firstFile.id] : [],
      terminalLines: [],
    });
  },

  setActiveFile: (id) => set({ activeFileId: id }),

  openFile: (id) =>
    set((state) => ({
      activeFileId: id,
      openFileIds: state.openFileIds.includes(id)
        ? state.openFileIds
        : [...state.openFileIds, id],
    })),

  closeFile: (id) =>
    set((state) => {
      const remaining = state.openFileIds.filter((f) => f !== id);
      return {
        openFileIds: remaining,
        activeFileId:
          state.activeFileId === id
            ? (remaining[remaining.length - 1] ?? null)
            : state.activeFileId,
      };
    }),

  updateFileContent: (id, content) =>
    set((state) => ({
      files: state.files.map((f) => (f.id === id ? { ...f, content } : f)),
    })),

  addFile: (file) =>
    set((state) => ({
      files: [...state.files, file],
      activeFileId: file.is_folder ? state.activeFileId : file.id,
      openFileIds: file.is_folder
        ? state.openFileIds
        : [...state.openFileIds, file.id],
    })),

  removeFile: (id) =>
    set((state) => {
      const remaining = state.openFileIds.filter((f) => f !== id);
      return {
        files: state.files.filter((f) => f.id !== id),
        openFileIds: remaining,
        activeFileId:
          state.activeFileId === id
            ? (remaining[remaining.length - 1] ?? null)
            : state.activeFileId,
      };
    }),

  renameFile: (id, newName, newPath) =>
    set((state) => {
      const target = state.files.find((f) => f.id === id);
      if (!target) return {};

      if (!target.is_folder) {
        // Simple file rename — only the one entry changes
        return {
          files: state.files.map((f) =>
            f.id === id ? { ...f, name: newName, path: newPath } : f
          ),
        };
      }

      // Folder rename — must also rebase every descendant's path so the tree
      // stays consistent (e.g. renaming /src → /source also updates
      // /src/main.tsx → /source/main.tsx, /src/components → /source/components …)
      const oldPrefix = target.path.endsWith("/") ? target.path : `${target.path}/`;
      const newPrefix = newPath.endsWith("/") ? newPath : `${newPath}/`;
      return {
        files: state.files.map((f) => {
          if (f.id === id) return { ...f, name: newName, path: newPath };
          if (f.path.startsWith(oldPrefix)) {
            return { ...f, path: newPrefix + f.path.slice(oldPrefix.length) };
          }
          return f;
        }),
      };
    }),

  setRunning: (v) => set({ isRunning: v }),
  setSaving: (v) => set({ isSaving: v }),
  setReadOnly: (v) => set({ isReadOnly: v }),

  appendTerminalLine: (line) =>
    set((state) => ({ terminalLines: [...state.terminalLines, line] })),

  clearTerminal: () => set({ terminalLines: [] }),
}));
