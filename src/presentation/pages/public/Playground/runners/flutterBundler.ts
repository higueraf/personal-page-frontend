import type { VirtualFile } from "../store/playgroundStore";

/**
 * DartPad's embed-flutter preview only accepts a single Dart source string via
 * postMessage — it has no concept of a multi-file project. To let users
 * organize their Flutter code across multiple files (models/, services/,
 * screens/, etc.) in the Playground, we merge all .dart files into one
 * synthetic library before sending it to DartPad:
 *
 *   1. Collect every non-folder .dart file.
 *   2. Strip each file's `import` lines. Relative imports (imports of the
 *      user's own files, e.g. `import '../models/product.dart';`) are
 *      dropped entirely since everything ends up in the same library.
 *      External imports (`dart:...`, `package:...`) are kept and deduped
 *      across all files.
 *   3. Concatenate: deduped external imports first, then each file's body
 *      (imports stripped), with `lib/main.dart` placed first for readability.
 */

const IMPORT_LINE_RE =
  /^[ \t]*import[ \t]+'([^']+)'(?:[ \t]+as[ \t]+\w+)?(?:[ \t]+(?:show|hide)[ \t]+[^;]+)?[ \t]*;[ \t]*$/gm;

function isExternalImport(uri: string): boolean {
  return uri.startsWith("dart:") || uri.startsWith("package:");
}

export function buildFlutterBundle(files: VirtualFile[]): string {
  const dartFiles = files
    .filter((f) => !f.is_folder && f.name.endsWith(".dart"))
    .sort((a, b) => {
      if (a.path === "/lib/main.dart") return -1;
      if (b.path === "/lib/main.dart") return 1;
      return a.path.localeCompare(b.path);
    });

  const externalImports = new Set<string>();
  const bodies: string[] = [];

  for (const file of dartFiles) {
    const body = file.content.replace(IMPORT_LINE_RE, (match, uri: string) => {
      if (isExternalImport(uri)) {
        externalImports.add(match.trim());
        return "";
      }
      return "";
    });
    bodies.push(`// ── ${file.path} ──\n${body.trim()}`);
  }

  const sortedImports = Array.from(externalImports).sort((a, b) => {
    const aDart = a.includes("'dart:");
    const bDart = b.includes("'dart:");
    if (aDart !== bDart) return aDart ? -1 : 1;
    return a.localeCompare(b);
  });

  return [...sortedImports, "", ...bodies].join("\n").trim() + "\n";
}
