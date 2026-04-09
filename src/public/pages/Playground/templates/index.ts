import type { Language, VirtualFile } from "../store/playgroundStore";

export interface LanguageConfig {
  id: Language;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  emoji: string;
  supportsPreview: boolean;
  runtime: "backend" | "iframe";
  monacoLanguage: string;
  defaultFiles: Omit<VirtualFile, "id">[];
  mainFileName: string;
}

export const LANGUAGE_CONFIGS: Record<Language, LanguageConfig> = {
  python: {
    id: "python",
    label: "Python",
    description: "Scripting, datos y machine learning",
    color: "text-blue-700 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/40",
    borderColor: "border-blue-200 dark:border-blue-500/40",
    emoji: "🐍",
    supportsPreview: false,
    runtime: "backend",
    monacoLanguage: "python",
    mainFileName: "main.py",
    defaultFiles: [{ name: "main.py", path: "/main.py", language: "python", is_folder: false, content: `print("Hello World!")\n` }],
  },
  javascript: {
    id: "javascript",
    label: "Node.js",
    description: "JavaScript del lado del servidor con Node.js",
    color: "text-amber-700 dark:text-yellow-400",
    bgColor: "bg-amber-50 dark:bg-yellow-950/40",
    borderColor: "border-amber-200 dark:border-yellow-500/40",
    emoji: "🟨",
    supportsPreview: false,
    runtime: "backend",
    monacoLanguage: "javascript",
    mainFileName: "main.js",
    defaultFiles: [{ name: "main.js", path: "/main.js", language: "javascript", is_folder: false, content: `console.log("Hello World!");\n` }],
  },
  typescript: {
    id: "typescript",
    label: "TypeScript",
    description: "JavaScript con tipos estáticos y clases",
    color: "text-sky-700 dark:text-blue-500",
    bgColor: "bg-sky-50 dark:bg-blue-950/40",
    borderColor: "border-sky-200 dark:border-blue-400/40",
    emoji: "🔷",
    supportsPreview: false,
    runtime: "backend",
    monacoLanguage: "typescript",
    mainFileName: "main.ts",
    defaultFiles: [{ name: "main.ts", path: "/main.ts", language: "typescript", is_folder: false, content: `const message: string = "Hello World!";\nconsole.log(message);\n` }],
  },
  kotlin: {
    id: "kotlin",
    label: "Kotlin",
    description: "Lenguaje moderno para JVM y Android",
    color: "text-purple-700 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-950/40",
    borderColor: "border-purple-200 dark:border-purple-500/40",
    emoji: "🎯",
    supportsPreview: false,
    runtime: "backend",
    monacoLanguage: "kotlin",
    mainFileName: "main.kt",
    defaultFiles: [{ name: "main.kt", path: "/main.kt", language: "kotlin", is_folder: false, content: `fun main() {\n    println("Hello World!")\n}\n` }],
  },
  dart: {
    id: "dart",
    label: "Dart",
    description: "Lenguaje de Flutter y Google",
    color: "text-teal-700 dark:text-cyan-400",
    bgColor: "bg-teal-50 dark:bg-cyan-950/40",
    borderColor: "border-teal-200 dark:border-cyan-500/40",
    emoji: "🎨",
    supportsPreview: false,
    runtime: "backend",
    monacoLanguage: "dart",
    mainFileName: "main.dart",
    defaultFiles: [{ name: "main.dart", path: "/main.dart", language: "dart", is_folder: false, content: `void main() {\n  print("Hello World!");\n}\n` }],
  },
  html: {
    id: "html",
    label: "HTML/CSS/JS",
    description: "Desarrollo web estático con preview en vivo",
    color: "text-orange-700 dark:text-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-950/40",
    borderColor: "border-orange-200 dark:border-orange-500/40",
    emoji: "🌐",
    supportsPreview: true,
    runtime: "iframe",
    monacoLanguage: "html",
    mainFileName: "index.html",
    defaultFiles: [
      { name: "index.html", path: "/index.html", language: "html", is_folder: false, content: `<!DOCTYPE html>\n<html>\n<head>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <h1>Hello World!</h1>\n  <script src="script.js"></script>\n</body>\n</html>\n` },
      { name: "style.css", path: "/style.css", language: "css", is_folder: false, content: `h1 { color: #333; text-align: center; font-family: sans-serif; }\n` },
      { name: "script.js", path: "/script.js", language: "javascript", is_folder: false, content: `console.log("Hello World!");\n` },
    ],
  },
  react: {
    id: "react",
    label: "React",
    description: "Componentes con JSX y hooks — preview en vivo",
    color: "text-cyan-700 dark:text-cyan-400",
    bgColor: "bg-cyan-50 dark:bg-cyan-950/40",
    borderColor: "border-cyan-200 dark:border-cyan-400/40",
    emoji: "⚛️",
    supportsPreview: true,
    runtime: "iframe",
    monacoLanguage: "javascript",
    mainFileName: "App.jsx",
    defaultFiles: [{ name: "App.jsx", path: "/App.jsx", language: "javascript", is_folder: false, content: `function App() {\n  return <h1 style={{ textAlign: "center", fontFamily: "sans-serif", marginTop: "2rem" }}>Hello World!</h1>;\n}\n` }],
  },
  vue: {
    id: "vue",
    label: "Vue.js",
    description: "Framework progresivo — preview en vivo",
    color: "text-green-700 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950/40",
    borderColor: "border-green-200 dark:border-green-500/40",
    emoji: "💚",
    supportsPreview: true,
    runtime: "iframe",
    monacoLanguage: "javascript",
    mainFileName: "App.js",
    defaultFiles: [{ name: "App.js", path: "/App.js", language: "javascript", is_folder: false, content: `const { createApp } = Vue;\n\ncreateApp({\n  template: \`<h1 style="text-align: center; font-family: sans-serif; margin-top: 2rem;">Hello World!</h1>\`\n}).mount("#app");\n` }],
  },
  angular: {
    id: "angular",
    label: "Angular",
    description: "Web Components con TypeScript — preview en vivo",
    color: "text-red-700 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950/40",
    borderColor: "border-red-200 dark:border-red-500/40",
    emoji: "🔺",
    supportsPreview: true,
    runtime: "iframe",
    monacoLanguage: "typescript",
    mainFileName: "app.ts",
    defaultFiles: [{ name: "app.ts", path: "/app.ts", language: "typescript", is_folder: false, content: `document.body.innerHTML = \`<h1 style="text-align: center; font-family: sans-serif; margin-top: 2rem;">Hello World!</h1>\`;\n` }],
  },
};

export const LANGUAGE_ORDER: Language[] = [
  "python",
  "javascript",
  "typescript",
  "kotlin",
  "dart",
  "html",
  "react",
  "vue",
  "angular",
];
