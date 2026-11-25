import { useCallback, useEffect, useRef } from "react";
import { playgroundUseCases } from "../../../../../infrastructure/factories/playground-module.factory";
import type { VirtualFile } from "../store/playgroundStore";

interface UseProjectSaveParams {
  id: string | undefined;
  files: VirtualFile[];
  setSaving: (saving: boolean) => void;
  setSaveError: (error: string | null) => void;
}

export function useProjectSave({ id, files, setSaving, setSaveError }: UseProjectSaveParams) {
  // Uses a single batch request to avoid URL-encoding issues with underscores,
  // hyphens, or dots in file names, and to guarantee atomicity on time expiry.
  const handleSave = useCallback(async (): Promise<boolean> => {
    if (!id) return false;
    setSaving(true);
    setSaveError(null);
    try {
      const filesToSave = files
        .map(f => ({ id: f.id, name: f.name, content: f.content, path: f.path, is_folder: f.is_folder }));
      await playgroundUseCases.saveAll(id, filesToSave);
      return true;
    } catch (err: any) {
      console.error("Save error:", err);
      const msg =
        err?.response?.data?.message ??
        (err?.response?.status === 413
          ? "El proyecto es demasiado grande para guardarse en un solo request."
          : "No se pudo guardar el proyecto. Revisa tu conexión e intenta de nuevo.");
      setSaveError(msg);
      return false;
    } finally {
      setSaving(false);
    }
  }, [id, files, setSaving, setSaveError]);

  // ── Stable save ref — always points to the latest handleSave so the timer
  //    effect never captures a stale closure over an old `files` snapshot.
  const handleSaveRef = useRef<() => Promise<boolean>>(async () => false);
  useEffect(() => { handleSaveRef.current = handleSave; }, [handleSave]);

  return { handleSave, handleSaveRef };
}
