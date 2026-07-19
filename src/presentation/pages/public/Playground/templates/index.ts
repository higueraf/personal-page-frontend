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
  r: {
    id: "r",
    label: "R",
    description: "Estadística, análisis de datos y visualización",
    color: "text-blue-800 dark:text-blue-300",
    bgColor: "bg-blue-50 dark:bg-blue-950/40",
    borderColor: "border-blue-300 dark:border-blue-500/40",
    emoji: "📊",
    supportsPreview: false,
    runtime: "backend",
    monacoLanguage: "r",
    mainFileName: "main.R",
    defaultFiles: [
      {
        name: "main.R", path: "/main.R", language: "r", is_folder: false,
        content:
`# ── Bienvenido a R ──────────────────────────────────────────────
cat("Hello, World!\\n")

# Variables y tipos básicos
nombre <- "Estudiante"
edad   <- 20L
nota   <- 8.5

cat("Nombre:", nombre, "\\n")
cat("Edad:  ", edad,   "\\n")
cat("Nota:  ", nota,   "\\n")

# Vector y operaciones estadísticas
notas <- c(7.0, 8.5, 9.0, 6.5, 10.0)
cat("\\nNotas:  ", notas, "\\n")
cat("Media:  ", mean(notas),   "\\n")
cat("Mediana:", median(notas), "\\n")
cat("Máximo: ", max(notas),    "\\n")
cat("Mínimo: ", min(notas),    "\\n")
`,
      },
    ],
  },
  flutter: {
    id: "flutter",
    label: "Flutter",
    description: "UI multiplataforma con Dart — preview en teléfono",
    color: "text-sky-600 dark:text-sky-400",
    bgColor: "bg-sky-50 dark:bg-sky-950/40",
    borderColor: "border-sky-200 dark:border-sky-500/40",
    emoji: "📱",
    supportsPreview: true,
    runtime: "iframe",          // no ejecución en backend — preview via DartPad
    monacoLanguage: "dart",
    mainFileName: "lib/main.dart",
    defaultFiles: [
      // Folder
      { name: "lib", path: "/lib", language: "plaintext", is_folder: true, content: "" },
      // Entry point
      {
        name: "main.dart", path: "/lib/main.dart", language: "dart", is_folder: false,
        content:
`import 'package:flutter/material.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Mi App',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
        useMaterial3: true,
      ),
      home: const CounterPage(),
    );
  }
}

class CounterPage extends StatefulWidget {
  const CounterPage({super.key});

  @override
  State<CounterPage> createState() => _CounterPageState();
}

class _CounterPageState extends State<CounterPage> {
  int _count = 0;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        backgroundColor: theme.colorScheme.primaryContainer,
        title: const Text('Flutter Playground'),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.flutter_dash,
                size: 80, color: theme.colorScheme.primary),
            const SizedBox(height: 24),
            Text('Contador:', style: theme.textTheme.titleMedium),
            Text(
              '\$_count',
              style: theme.textTheme.displayLarge?.copyWith(
                color: theme.colorScheme.primary,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                FilledButton.tonal(
                  onPressed: () => setState(() => _count--),
                  child: const Icon(Icons.remove),
                ),
                const SizedBox(width: 16),
                FilledButton(
                  onPressed: () => setState(() => _count++),
                  child: const Icon(Icons.add),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
`,
      },
      // pubspec reference (informational only — DartPad provides Flutter packages)
      {
        name: "pubspec.yaml", path: "/pubspec.yaml", language: "yaml", is_folder: false,
        content:
`name: flutter_playground
description: Proyecto Flutter en el Playground.

environment:
  sdk: '>=3.0.0 <4.0.0'
  flutter: '>=3.10.0'

dependencies:
  flutter:
    sdk: flutter
  # Paquetes disponibles en el preview (DartPad):
  #   flutter/material, flutter/cupertino, flutter/widgets
  #   provider, riverpod, http, intl, collection …
  # Para paquetes adicionales necesitas el SDK local de Flutter.

flutter:
  uses-material-design: true
`,
      },
    ],
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
    label: "React + TypeScript",
    description: "Componentes con TypeScript, TSX y hooks — preview en vivo",
    color: "text-cyan-700 dark:text-cyan-400",
    bgColor: "bg-cyan-50 dark:bg-cyan-950/40",
    borderColor: "border-cyan-200 dark:border-cyan-400/40",
    emoji: "⚛️",
    supportsPreview: true,
    runtime: "iframe",
    monacoLanguage: "typescript",
    mainFileName: "src/main.tsx",
    defaultFiles: [
      // Folders
      { name: "src",        path: "/src",            language: "plaintext", is_folder: true,  content: "" },
      { name: "components", path: "/src/components", language: "plaintext", is_folder: true,  content: "" },
      // Entry point
      {
        name: "main.tsx", path: "/src/main.tsx", language: "typescript", is_folder: false,
        content:
`import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
`,
      },
      // Root component
      {
        name: "App.tsx", path: "/src/App.tsx", language: "typescript", is_folder: false,
        content:
`import React from 'react';
import Counter from './components/Counter';

export default function App() {
  return (
    <div style={{ fontFamily: 'sans-serif', padding: '2rem', maxWidth: 600, margin: '0 auto' }}>
      <h1 style={{ color: '#0ea5e9' }}>⚛️ React + TypeScript</h1>
      <p style={{ color: '#64748b' }}>Edita los archivos en <code>src/</code> para empezar.</p>
      <Counter />
    </div>
  );
}
`,
      },
      // Example component with TypeScript types and hooks
      {
        name: "Counter.tsx", path: "/src/components/Counter.tsx", language: "typescript", is_folder: false,
        content:
`import React, { useState } from 'react';

interface Props {
  initialCount?: number;
}

export default function Counter({ initialCount = 0 }: Props) {
  const [count, setCount] = useState<number>(initialCount);

  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '1rem', marginTop: '1rem' }}>
      <p style={{ fontSize: '1.1rem', margin: '0 0 0.75rem' }}>
        Contador: <strong>{count}</strong>
      </p>
      <button onClick={() => setCount(c => c + 1)} style={{ marginRight: 8, padding: '4px 12px', cursor: 'pointer' }}>
        +
      </button>
      <button onClick={() => setCount(c => c - 1)} style={{ padding: '4px 12px', cursor: 'pointer' }}>
        −
      </button>
    </div>
  );
}
`,
      },
    ],
  },
  "react-native": {
    id: "react-native",
    label: "React Native",
    description: "Apps móviles con React — preview instantáneo vía Expo Snack",
    color: "text-cyan-700 dark:text-cyan-300",
    bgColor: "bg-cyan-50 dark:bg-cyan-950/40",
    borderColor: "border-cyan-200 dark:border-cyan-500/40",
    emoji: "📲",
    supportsPreview: true,
    runtime: "iframe",          // preview via Expo Snack embed — sin backend
    monacoLanguage: "typescript",
    mainFileName: "App.tsx",
    defaultFiles: [
      {
        name: "App.tsx", path: "/App.tsx", language: "typescript", is_folder: false,
        content:
`import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <Text style={styles.title}>React Native 📲</Text>
      <Text style={styles.subtitle}>Edita App.tsx para empezar</Text>
      <Text style={styles.count}>{count}</Text>
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.btn, styles.btnSecondary]}
          onPress={() => setCount(c => c - 1)}
        >
          <Text style={[styles.btnText, styles.btnTextSecondary]}>−</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => setCount(c => c + 1)}
        >
          <Text style={styles.btnText}>+</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 32,
  },
  count: {
    fontSize: 80,
    fontWeight: '200',
    color: '#2563eb',
    marginBottom: 32,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  btn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondary: {
    backgroundColor: '#e2e8f0',
  },
  btnText: {
    fontSize: 30,
    color: '#fff',
    fontWeight: '300',
    lineHeight: 36,
  },
  btnTextSecondary: {
    color: '#475569',
  },
});
`,
      },
    ],
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
  "r",
  "html",
  "react",
  "flutter",
  "react-native",
  "vue",
  "angular",
];
