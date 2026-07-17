import { useState, useRef } from "react";
import {
  FilePlus,
  FolderPlus,
  Trash2,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Pencil,
  Upload,
} from "lucide-react";
import { usePlaygroundStore, type VirtualFile } from "../store/playgroundStore";
import { getFileIcon, getExtension, newId } from "../utils/fileUtils";
import http from "../../../../shared/api/http";

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
  const { files, activeFileId, language, projectId, openFile, addFile, removeFile, renameFile, updateFileContent } =
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

  // Rename state: which file is being renamed and the current input value
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // File upload
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB per file

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

  // ── File upload ────────────────────────────────────────────────────────────

  function handleUploadFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    const oversized = picked.filter((f) => f.size > MAX_FILE_SIZE).map((f) => f.name);
    if (oversized.length > 0) {
      alert(
        `Los siguientes archivos superan el límite de 2 MB y no serán cargados:\n• ${oversized.join("\n• ")}`
      );
    }
    for (const file of picked) {
      if (file.size > MAX_FILE_SIZE) continue;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const content = (ev.target?.result as string) ?? "";
        // If a file with the same name already exists, update its content in-place
        const existing = files.find((f) => !f.is_folder && f.name === file.name);
        if (existing) {
          updateFileContent(existing.id, content);
          openFile(existing.id);
          return;
        }
        addFile({
          id: newId(),
          name: file.name,
          content,
          language: "",
          path: `/${file.name}`,
          is_folder: false,
        });
      };
      reader.readAsText(file, "UTF-8");
    }
    // Reset so the same file can be uploaded again after a modification
    e.target.value = "";
  }

  function startRename(file: VirtualFile) {
    cancelAll();
    setRenamingId(file.id);
    setRenameValue(file.name);
  }

  async function commitRename(file: VirtualFile) {
    const trimmed = renameValue.trim();
    if (!trimmed || trimmed === file.name) {
      setRenamingId(null);
      return;
    }

    const parentPath = file.path.substring(0, file.path.lastIndexOf('/') + 1);
    const newPath = `${parentPath}${trimmed}`;

    // Update store immediately for responsive UI
    renameFile(file.id, trimmed, newPath);
    setRenamingId(null);

    // Persist to backend when file has a DB UUID (not a local ID)
    if (projectId && !file.id.startsWith('local-')) {
      http.patch(`/playground/${projectId}/files/${file.id}/rename`, { name: trimmed })
        .catch(() => {
          // Roll back store on failure
          renameFile(file.id, file.name, file.path);
        });
    }
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
          isRenaming={renamingId === folder.id}
          renameValue={renamingId === folder.id ? renameValue : folder.name}
          onToggle={() => toggleFolder(folder.id)}
          onDelete={() => handleDelete(folder)}
          onRename={() => startRename(folder)}
          onRenameChange={setRenameValue}
          onRenameCommit={() => commitRename(folder)}
          onRenameCancel={() => setRenamingId(null)}
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
                isRenaming={renamingId === child.id}
                renameValue={renamingId === child.id ? renameValue : child.name}
                onOpen={() => openFile(child.id)}
                onDelete={() => handleDelete(child)}
                onRename={() => startRename(child)}
                onRenameChange={setRenameValue}
                onRenameCommit={() => commitRename(child)}
                onRenameCancel={() => setRenamingId(null)}
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
          {/* Upload: accepts text-based data and source files, max 2 MB each */}
          <button
            onClick={() => uploadInputRef.current?.click()}
            title="Subir archivo(s) — máx. 2 MB c/u"
            className="p-1 rounded text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          >
            <Upload size={13} />
          </button>
          <input
            ref={uploadInputRef}
            type="file"
            multiple
            className="hidden"
            accept="*/*"
            onChange={handleUploadFiles}
          />
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
                isRenaming={renamingId === file.id}
                renameValue={renamingId === file.id ? renameValue : file.name}
                onOpen={() => openFile(file.id)}
                onDelete={() => handleDelete(file)}
                onRename={() => startRename(file)}
                onRenameChange={setRenameValue}
                onRenameCommit={() => commitRename(file)}
                onRenameCancel={() => setRenamingId(null)}
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
  isRenaming: boolean;
  renameValue: string;
  onToggle: () => void;
  onDelete: () => void;
  onRename: () => void;
  onRenameChange: (v: string) => void;
  onRenameCommit: () => void;
  onRenameCancel: () => void;
  onCreateFileIn: () => void;
  onCreateFolderIn: () => void;
}

function FolderRow({
  folder, depth, collapsed, totalItems, confirmingDelete,
  isRenaming, renameValue,
  onToggle, onDelete, onRename, onRenameChange, onRenameCommit, onRenameCancel,
  onCreateFileIn, onCreateFolderIn,
}: FolderRowProps) {
  if (isRenaming) {
    return (
      <div
        className="flex items-center gap-1 py-1 pr-2"
        style={{ paddingLeft: depth * 16 + 6 }}
      >
        <span className="text-yellow-500/80 dark:text-yellow-400/80 flex-shrink-0"><Folder size={13} /></span>
        <input
          autoFocus
          value={renameValue}
          onChange={(e) => onRenameChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onRenameCommit();
            if (e.key === 'Escape') onRenameCancel();
          }}
          onBlur={onRenameCommit}
          className="flex-1 min-w-0 bg-white dark:bg-[#1c2333] text-gray-900 dark:text-white text-xs px-2 py-0.5 rounded border border-blue-500/60 focus:outline-none focus:border-blue-400"
        />
      </div>
    );
  }

  return (
    <div
      className="group flex items-center justify-between py-1 cursor-pointer text-xs text-gray-700 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-colors"
      style={{ paddingLeft: depth * 16 + 6, paddingRight: 6 }}
      onClick={onToggle}
      onDoubleClick={(e) => { e.stopPropagation(); onRename(); }}
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
          onClick={onRename}
          title="Renombrar carpeta"
          className="p-0.5 rounded text-gray-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
        >
          <Pencil size={11} />
        </button>
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
  isRenaming: boolean;
  renameValue: string;
  onOpen: () => void;
  onDelete: () => void;
  onRename: () => void;
  onRenameChange: (v: string) => void;
  onRenameCommit: () => void;
  onRenameCancel: () => void;
}

function FileRow({
  file, depth, active, confirmingDelete,
  isRenaming, renameValue,
  onOpen, onDelete, onRename, onRenameChange, onRenameCommit, onRenameCancel,
}: FileRowProps) {
  if (isRenaming) {
    return (
      <div
        className="flex items-center gap-1.5 py-1 border-l-2 border-blue-500"
        style={{ paddingLeft: depth * 16 + 10, paddingRight: 6 }}
      >
        <span className="text-sm flex-shrink-0">{getFileIcon(renameValue)}</span>
        <input
          autoFocus
          value={renameValue}
          onChange={(e) => onRenameChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onRenameCommit();
            if (e.key === 'Escape') onRenameCancel();
          }}
          onBlur={onRenameCommit}
          className="flex-1 min-w-0 bg-white dark:bg-[#1c2333] text-gray-900 dark:text-white text-xs px-2 py-0.5 rounded border border-blue-500/60 focus:outline-none focus:border-blue-400 font-mono"
        />
      </div>
    );
  }

  return (
    <div
      className={`group flex items-center justify-between py-1 cursor-pointer text-xs transition-colors ${
        active
          ? "bg-blue-600/20 text-blue-700 dark:text-white border-l-2 border-blue-500"
          : "text-gray-600 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-slate-200 border-l-2 border-transparent"
      }`}
      style={{ paddingLeft: depth * 16 + 10, paddingRight: 6 }}
      onClick={onOpen}
      onDoubleClick={(e) => { e.stopPropagation(); onRename(); }}
    >
      <div className="flex items-center gap-1.5 truncate min-w-0">
        <span className="text-sm flex-shrink-0">{getFileIcon(file.name)}</span>
        <span className="truncate font-mono text-[11px]">{file.name}</span>
      </div>
      <div
        className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onRename}
          title="Renombrar"
          className="p-0.5 rounded text-gray-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
        >
          <Pencil size={11} />
        </button>
        <button
          onClick={onDelete}
          title={confirmingDelete ? "¿Confirmar?" : "Eliminar"}
          className={`p-0.5 rounded transition-all ${
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
