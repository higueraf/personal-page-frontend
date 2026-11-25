import type { VirtualFile } from "../store/playgroundStore";

export async function downloadProjectZip(files: VirtualFile[], projectName: string) {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  for (const file of files) {
    if (!file.is_folder) {
      const path = (file.path ?? `/${file.name}`).replace(/^\//, "");
      zip.file(path || file.name, file.content ?? "");
    }
  }
  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${projectName.replace(/[^a-zA-Z0-9_\-]/g, "_")}.zip`;
  a.click();
  URL.revokeObjectURL(url);
}
