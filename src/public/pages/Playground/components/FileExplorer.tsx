import { useState, useRef } from "react";
import {
  FilePlus,
  FolderPlus,
  Trash2,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
} from "lucide-react";
import { usePlaygroundStore, type VirtualFile } from "../store/playgroundStore";
import { getFileIcon, getExtension, newId } from "../utils/fileUtils";

// ─── helpers ──────────────────────────────────────────────────────────────────

function directChildren(folder: VirtualFile, files: VirtualFile[]): VirtualFile[] {
  const prefix = folder.path.endsWith("/") ? folder.path : `${folder.path}/`;
  return files.filter((f) => {
    if (f.is_folder || !f.path.startsWith(prefix)) return false;
    const rest = f.path.slice(prefix.length);
    return !rest.includes("/");
  });
}

function directSubFolders(folder: VirtualFile, folders: VirtualFile[]): VirtualFile[] {
  const prefix = folder.path.endsWith("/") ? folder.path : `${folder.path}/`;
  return folders.filter((f) => {
    if (f.id === folder.id || !f.path.startsWith(prefix)) return false;
    const rest = f.path.slice(prefix.length);
    return !rest.includes("/");
  });
}

function belongsToAnyFolder(file: VirtualFile, folders: VirtualFile[]): boolean {
  return folders.some(
    (folder) =>
      file.path !== folder.path &&
      file.path.startsWith(
        folder.path.endsWith("/") ? folder.path : `${folder.path}/`
      )
  );
}

function isTopLevelFolder(folder: VirtualFile, allFolders: VirtualFile[]): boolean {
  // A top-level folder: no other folder is its parent
  return !allFolders.some(
    (other) =>
      other.id !== folder.id &&
      folder.path.startsWith(
        other.path.endsWith("/") ? other.path : `${other.path}/`
      )
  );
}

// ─── Creation state type ──────────────────────────────────────────────────────

interface CreatingIn {
  folderId: string;
  folderPath: string;
  type: "file" | "folder";
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function FileExplorer() {
  const { files, activeFileId, language, openFile, addFile, removeFile } =
    usePlaygroundStore();

  // Root-level creation
  const [showNewFile, setShowNewFile] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [newFolderName, setNewFolderName] = useState("");

  // Nested (in-folder) creation
  const [creatingIn, setCreatingIn] = useState<CreatingIn | null>(null);
  const [creatingInName, setCreatingInName] = useState("");

  // Misc
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const folders = files.filter((f) => f.is_folder);
  const topFolders = folders.filter((f) => isTopLevelFolder(f, folders));
  const rootFiles = files.filter(
    (f) => !f.is_folder && !belongsToAnyFolder(f, folders)
  );

  // ── Helpers ────────────────────────────────────────────────────────────────

  function cancelAll() {
    setShowNewFile(false);
    setShowNewFolder(false);
    setNewFileName("");
    setNewFolderName("");
    setCreatingIn(null);
    setCreatingInName("");
  }

  function toggleFolder(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // ── Root-level creation ────────────────────────────────────────────────────

  function handleAddFile() {
    const raw = newFileName.trim();
    if (!raw) return;
    let name = raw.includes(".") ? raw : `${raw}.${getExtension(language)}`;
    const justName = name.includes("/") ? name.split("/").pop()! : name;
    addFile({
      id: newId(),
      name: justName,
      content: "",
      language,
      path: `/${justName}`,
      is_folder: false,
    });
    setNewFileName("");
    setShowNewFile(false);
  }

  function handleAddFolder() {
    const raw = newFolderName.trim().replace(/[\\/]/g, "").replace(/\s+/g, "-");
    if (!raw) return;
    const folder: VirtualFile = {
      id: newId(),
      name: raw,
      content: "",
      language: "",
      path: `/${raw}`,
      is_folder: true,
    };
    addFile(folder);
    setNewFolderName("");
    setShowNewFolder(false);
    setCollapsed((prev) => { const n = new Set(prev); n.delete(folder.id); return n; });
  }

  // ── Nested (in-folder) creation ────────────────────────────────────────────

  function handleAddInFolder() {
    if (!creatingIn || !creatingInName.trim()) return;
    const raw = creatingInName.trim();

    if (creatingIn.type === "file") {
      const name = raw.includes(".") ? raw : `${raw}.${getExtension(language)}`;
      addFile({
        id: newId(),
        name,
        content: "",
        language,
        path: `${creatingIn.folderPath}/${name}`,
        is_folder: false,
      });
    } else {
      const name = raw.replace(/[\\/]/g, "").replace(/\s+/g, "-");
      const subFolder: VirtualFile = {
        id: newId(),
        name,
        content: "",
        language: "",
        path: `${creatingIn.folderPath}/${name}`,
        is_folder: true,
      };
      addFile(subFolder);
      // Auto-expand parent + new subfolder
      setCollapsed((prev) => {
        const n = new Set(prev);
        n.delete(creatingIn.folderId);
        n.delete(subFolder.id);
        return n;
      });
    }
    setCreatingIn(null);
    setCreatingInName("");
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  function handleDelete(file: VirtualFile) {
    if (confirmDelete === file.id) {
      if (file.is_folder) {
        const prefix = `${file.path}/`;
        files.filter((f) => f.path.startsWith(prefix)).forEach((c) => removeFile(c.id));
      }
      removeFile(file.id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(file.id);
      setTimeout(() => setConfirmDelete(null), 2500);
    }
  }

  // ── Recursive folder renderer ──────────────────────────────────────────────

  function renderFolder(folder: VirtualFile, depth: number) {
    const isCollapsed = collapsed.has(folder.id);
    const children = directChildren(folder, files);
    const subFolders = directSubFolders(folder, folders);
    const totalItems = children.length + subFolders.length;
    const isCreatingHere = creatingIn?.folderId === folder.id;

    return (
      <div key={folder.id}>
        {/* Folder row */}
        <FolderRow
          folder={folder}
          depth={depth}
          collapsed={isCollapsed}
          totalItems={totalItems}
          confirmingDelete={confirmDelete === folder.id}
          onToggle={() => toggleFolder(folder.id)}
          onDelete={() => handleDelete(folder)}
          onCreateFileIn={() => {
            cancelAll();
            setCollapsed((prev) => { const n = new Set(prev); n.delete(folder.id); return n; });
            setCreatingIn({ folderId: folder.id, folderPath: folder.path, type: "file" });
          }}
          onCreateFolderIn={() => {
            cancelAll();
            setCollapsed((prev) => { const n = new Set(prev); n.delete(folder.id); return n; });
            setCreatingIn({ folderId: folder.id, folderPath: folder.path, type: "folder" });
          }}
        />

        {/* Expanded contents */}
        {!isCollapsed && (
          <>
            {/* Inline creation input */}
            {isCreatingHere && (
              <InlineCreateInput
                depth={depth + 1}
                type={creatingIn!.type}
                value={creatingInName}
                language={language}
                onChange={setCreatingInName}
                onConfirm={handleAddInFolder}
                onCancel={() => { setCreatingIn(null); setCreatingInName(""); }}
              />
            )}

            {/* Sub-folders (recursive) */}
            {subFolders.map((sf) => renderFolder(sf, depth + 1))}

            {/* Files */}
            {children.map((child) => (
              <FileRow
                key={child.id}
                file={child}
                depth={depth + 1}
                active={activeFileId === child.id}
                confirmingDelete={confirmDelete === child.id}
                onOpen={() => openFile(child.id)}
                onDelete={() => handleDelete(child)}
              />
            ))}

            {/* Empty hint */}
            {totalItems === 0 && !isCreatingHere && (
              <p
                className="text-[10px] text-gray-400 dark:text-slate-600 italic py-1"
                style={{ paddingLeft: (depth + 1) * 16 + 12 }}
              >
                vacía — usa + para agregar
              </p>
            )}
          </>
        )}
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full bg-[#f8f9fc] dark:bg-[#0d1117] border-r border-black/10 dark:border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-black/10 dark:border-white/10">
        <span className="text-[10px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-widest">
          Explorador
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => { cancelAll(); setShowNewFile((v) => !v); }}
            title="Nuevo archivo raíz"
            className="p-1 rounded text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          >
            <FilePlus size={13} />
          </button>
          <button
            onClick={() => { cancelAll(); setShowNewFolder((v) => !v); }}
            title="Nueva carpeta raíz"
            className="p-1 rounded text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          >
            <FolderPlus size={13} />
          </button>
        </div>
      </div>

      {/* Root-level new file */}
      {showNewFile && (
        <NewItemInput
          placeholder={`nombre.${getExtension(language)}`}
          value={newFileName}
          onChange={setNewFileName}
          onConfirm={handleAddFile}
          onCancel={cancelAll}
          label="archivo"
          icon={<FilePlus size={11} />}
        />
      )}

      {/* Root-level new folder */}
      {showNewFolder && (
        <NewItemInput
          placeholder="nombre-carpeta"
          value={newFolderName}
          onChange={setNewFolderName}
          onConfirm={handleAddFolder}
          onCancel={cancelAll}
          label="carpeta"
          icon={<FolderPlus size={11} />}
        />
      )}

      {/* File tree */}
      <div className="flex-1 overflow-y-auto py-1">
        {files.length === 0 ? (
          <p className="text-gray-400 dark:text-slate-500 text-xs px-4 py-4 text-center">
            Sin archivos — usa los botones de arriba
          </p>
        ) : (
          <>
            {rootFiles.map((file) => (
              <FileRow
                key={file.id}
                file={file}
                depth={0}
                active={activeFileId === file.id}
                confirmingDelete={confirmDelete === file.id}
                onOpen={() => openFile(file.id)}
                onDelete={() => handleDelete(file)}
              />
            ))}
            {topFolders.map((folder) => renderFolder(folder, 0))}
          </>
        )}
      </div>
    </div>
  );
}

// ─── NewItemInput (root level) ────────────────────────────────────────────────

interface NewItemInputProps {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  label: string;
  icon: React.ReactNode;
}

function NewItemInput({
  placeholder, value, onChange, onConfirm, onCancel, label, icon,
}: NewItemInputProps) {
  return (
    <div className="px-3 py-2 border-b border-black/10 dark:border-white/10 bg-gray-100 dark:bg-[#161b22]">
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-gray-400 dark:text-slate-500">{icon}</span>
        <span className="text-[10px] text-gray-500 dark:text-slate-400">Nuevo {label}</span>
      </div>
      <input
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onConfirm();
          if (e.key === "Escape") onCancel();
        }}
        placeholder={placeholder}
        className="w-full bg-white dark:bg-[#0d1117] text-gray-900 dark:text-white text-xs px-2 py-1.5 rounded border border-black/20 dark:border-white/20 focus:outline-none focus:border-blue-500 placeholder:text-gray-400 dark:placeholder:text-slate-600"
      />
      <div className="flex gap-1 mt-1.5">
        <button
          onClick={onConfirm}
          className="flex-1 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded py-0.5 transition-colors"
        >
          Crear {label}
        </button>
        <button
          onClick={onCancel}
          className="flex-1 text-xs bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 text-gray-600 dark:text-slate-300 rounded py-0.5 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

// ─── InlineCreateInput (inside folders) ───────────────────────────────────────

interface InlineCreateInputProps {
  depth: number;
  type: "file" | "folder";
  value: string;
  language: string;
  onChange: (v: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

function InlineCreateInput({
  depth, type, value, language, onChange, onConfirm, onCancel,
}: InlineCreateInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className="flex items-center gap-1 py-1 pr-2"
      style={{ paddingLeft: depth * 16 + 8 }}
    >
      <span className="text-gray-400 dark:text-slate-500 flex-shrink-0 text-xs">
        {type === "file" ? <FilePlus size={11} /> : <FolderPlus size={11} />}
      </span>
      <input
        ref={inputRef}
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onConfirm();
          if (e.key === "Escape") onCancel();
        }}
        placeholder={
          type === "file"
            ? `archivo.${getExtension(language)}`
            : "subcarpeta"
        }
        className="flex-1 min-w-0 bg-white dark:bg-[#1c2333] text-gray-900 dark:text-white text-xs px-2 py-0.5 rounded border border-blue-500/60 focus:outline-none focus:border-blue-400 placeholder:text-gray-400 dark:placeholder:text-slate-600"
      />
      <button
        onClick={onConfirm}
        className="flex-shrink-0 text-[10px] bg-blue-600 hover:bg-blue-500 text-white rounded px-1.5 py-0.5 transition-colors"
      >
        ✓
      </button>
      <button
        onClick={onCancel}
        className="flex-shrink-0 text-[10px] text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 rounded px-1 py-0.5 transition-colors"
      >
        ✕
      </button>
    </div>
  );
}

// ─── FolderRow ────────────────────────────────────────────────────────────────

interface FolderRowProps {
  folder: VirtualFile;
  depth: number;
  collapsed: boolean;
  totalItems: number;
  confirmingDelete: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onCreateFileIn: () => void;
  onCreateFolderIn: () => void;
}

function FolderRow({
  folder, depth, collapsed, totalItems, confirmingDelete,
  onToggle, onDelete, onCreateFileIn, onCreateFolderIn,
}: FolderRowProps) {
  return (
    <div
      className="group flex items-center justify-between py-1 cursor-pointer text-xs text-gray-700 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-colors"
      style={{ paddingLeft: depth * 16 + 6, paddingRight: 6 }}
      onClick={onToggle}
    >
      <div className="flex items-center gap-1 min-w-0">
        <span className="text-gray-400 dark:text-slate-500 flex-shrink-0">
          {collapsed ? <ChevronRight size={11} /> : <ChevronDown size={11} />}
        </span>
        <span className="text-yellow-500/80 dark:text-yellow-400/80 flex-shrink-0">
          {collapsed ? <Folder size={13} /> : <FolderOpen size={13} />}
        </span>
        <span className="truncate font-mono text-[11px] text-gray-700 dark:text-slate-300">
          {folder.name}
        </span>
        {totalItems > 0 && (
          <span className="text-[9px] text-gray-400 dark:text-slate-600 ml-0.5 flex-shrink-0">
            ({totalItems})
          </span>
        )}
      </div>

      {/* Action buttons — visible on hover */}
      <div
        className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onCreateFileIn}
          title="Nuevo archivo aquí"
          className="p-0.5 rounded text-gray-400 dark:text-slate-500 hover:text-green-600 dark:hover:text-green-400 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
        >
          <FilePlus size={11} />
        </button>
        <button
          onClick={onCreateFolderIn}
          title="Nueva subcarpeta aquí"
          className="p-0.5 rounded text-gray-400 dark:text-slate-500 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
        >
          <FolderPlus size={11} />
        </button>
        <button
          onClick={onDelete}
          title={confirmingDelete ? "¿Confirmar? Borrará contenido" : "Eliminar carpeta"}
          className={`p-0.5 rounded transition-colors ${
            confirmingDelete
              ? "text-red-500 dark:text-red-400"
              : "text-gray-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-black/10 dark:hover:bg-white/10"
          }`}
        >
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  );
}

// ─── FileRow ──────────────────────────────────────────────────────────────────

interface FileRowProps {
  file: VirtualFile;
  depth: number;
  active: boolean;
  confirmingDelete: boolean;
  onOpen: () => void;
  onDelete: () => void;
}

function FileRow({ file, depth, active, confirmingDelete, onOpen, onDelete }: FileRowProps) {
  return (
    <div
      className={`group flex items-center justify-between py-1 cursor-pointer text-xs transition-colors ${
        active
          ? "bg-blue-600/20 text-blue-700 dark:text-white border-l-2 border-blue-500"
          : "text-gray-600 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-slate-200 border-l-2 border-transparent"
      }`}
      style={{ paddingLeft: depth * 16 + 10, paddingRight: 6 }}
      onClick={onOpen}
    >
      <div className="flex items-center gap-1.5 truncate min-w-0">
        <span className="text-sm flex-shrink-0">{getFileIcon(file.name)}</span>
        <span className="truncate font-mono text-[11px]">{file.name}</span>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        title={confirmingDelete ? "¿Confirmar?" : "Eliminar"}
        className={`flex-shrink-0 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-all ${
          confirmingDelete
            ? "text-red-500 dark:text-red-400 opacity-100"
            : "text-gray-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-black/10 dark:hover:bg-white/10"
        }`}
      >
        <Trash2 size={11} />
      </button>
    </div>
  );
}
