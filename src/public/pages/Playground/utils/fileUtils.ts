/** Returns Monaco language identifier for a filename */
export function getMonacoLanguage(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    py: "python",
    kt: "kotlin",
    dart: "dart",
    html: "html",
    css: "css",
    scss: "scss",
    json: "json",
    md: "markdown",
    txt: "plaintext",
    java: "java",
    go: "go",
    rs: "rust",
    c: "c",
    cpp: "cpp",
    vue: "html",
    sh: "shell",
    yaml: "yaml",
    yml: "yaml",
    xml: "xml",
    sql: "sql",
  };
  return map[ext] ?? "plaintext";
}

/** Returns an emoji icon for a filename */
export function getFileIcon(filename: string, isFolder = false): string {
  if (isFolder) return "📁";
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    js: "🟨",
    jsx: "⚛️",
    ts: "🔷",
    tsx: "⚛️",
    py: "🐍",
    kt: "🎯",
    dart: "🎨",
    html: "🌐",
    css: "🎨",
    scss: "🎨",
    json: "📋",
    md: "📝",
    txt: "📄",
    java: "☕",
    go: "🐹",
    rs: "🦀",
    vue: "💚",
    sh: "⚙️",
    sql: "🗄️",
  };
  return map[ext] ?? "📄";
}

/** Returns the primary extension for a language */
export function getExtension(language: string): string {
  const map: Record<string, string> = {
    python: "py",
    javascript: "js",
    typescript: "ts",
    kotlin: "kt",
    dart: "dart",
    html: "html",
    css: "css",
    react: "jsx",
    vue: "js",
    angular: "ts",
    java: "java",
    go: "go",
    rust: "rs",
  };
  return map[language] ?? "txt";
}

/** Generates a unique local ID */
export function newId(): string {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
