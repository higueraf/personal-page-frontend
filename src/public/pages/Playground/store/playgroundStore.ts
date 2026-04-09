import { create } from "zustand";

export type Language =
  | "python"
  | "javascript"
  | "typescript"
  | "kotlin"
  | "dart"
  | "html"
  | "react"
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
    files: VirtualFile[]
  ) => void;
  setActiveFile: (id: string) => void;
  openFile: (id: string) => void;
  closeFile: (id: string) => void;
  updateFileContent: (id: string, content: string) => void;
  addFile: (file: VirtualFile) => void;
  removeFile: (id: string) => void;
  setRunning: (v: boolean) => void;
  setSaving: (v: boolean) => void;
  appendTerminalLine: (line: string) => void;
  clearTerminal: () => void;
}

export const usePlaygroundStore = create<PlaygroundStore>((set) => ({
  projectId: null,
  projectName: "Mi Proyecto",
  language: "python",
  isExam: false,
  allowCopyPaste: true,
  files: [],
  activeFileId: null,
  openFileIds: [],
  isRunning: false,
  isSaving: false,
  terminalLines: [],

  initProject: (id, name, language, isExam, allowCopyPaste, files) => {
    const firstFile = files.find((f) => !f.is_folder);
    set({
      projectId: id,
      projectName: name,
      language,
      isExam,
      allowCopyPaste,
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

  setRunning: (v) => set({ isRunning: v }),
  setSaving: (v) => set({ isSaving: v }),

  appendTerminalLine: (line) =>
    set((state) => ({ terminalLines: [...state.terminalLines, line] })),

  clearTerminal: () => set({ terminalLines: [] }),
}));
