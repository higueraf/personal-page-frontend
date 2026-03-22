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
    defaultFiles: [
      {
        name: "main.py",
        path: "/main.py",
        language: "python",
        is_folder: false,
        content: `# 🐍 Python Playground

def saludar(nombre: str) -> str:
    return f"¡Hola, {nombre}! 👋"

# Variables
nombre = "Estudiante"
print(saludar(nombre))

# Listas y comprensiones
numeros = list(range(1, 6))
cuadrados = [n ** 2 for n in numeros]
print(f"Cuadrados: {cuadrados}")

# Diccionarios
persona = {"nombre": "Ana", "edad": 22, "lenguaje": "Python"}
for clave, valor in persona.items():
    print(f"  {clave}: {valor}")

# Funciones de orden superior
pares = list(filter(lambda n: n % 2 == 0, range(1, 11)))
print(f"Números pares: {pares}")
`,
      },
    ],
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
    defaultFiles: [
      {
        name: "main.js",
        path: "/main.js",
        language: "javascript",
        is_folder: false,
        content: `// 🟨 Node.js Playground

// Funciones modernas
const saludar = (nombre) => \`¡Hola, \${nombre}! 👋\`;
console.log(saludar("Estudiante"));

// Desestructuración
const persona = { nombre: "Carlos", edad: 25, lenguaje: "JavaScript" };
const { nombre, edad } = persona;
console.log(\`\${nombre} tiene \${edad} años\`);

// Arrays y métodos funcionales
const numeros = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const pares = numeros.filter(n => n % 2 === 0);
const cuadrados = pares.map(n => n ** 2);
const suma = cuadrados.reduce((acc, n) => acc + n, 0);
console.log("Cuadrados de pares:", cuadrados);
console.log("Suma:", suma);

// Promesas con async/await
async function obtenerDatos() {
  return new Promise(resolve => {
    setTimeout(() => resolve({ status: "ok", message: "¡Datos listos!" }), 100);
  });
}

(async () => {
  const datos = await obtenerDatos();
  console.log("Respuesta:", datos.message);
})();
`,
      },
    ],
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
    defaultFiles: [
      {
        name: "main.ts",
        path: "/main.ts",
        language: "typescript",
        is_folder: false,
        content: `// 🔷 TypeScript Playground

interface Persona {
  nombre: string;
  edad: number;
  lenguaje?: string;
}

class Estudiante implements Persona {
  nombre: string;
  edad: number;
  lenguaje: string;

  constructor(nombre: string, edad: number, lenguaje = "TypeScript") {
    this.nombre = nombre;
    this.edad = edad;
    this.lenguaje = lenguaje;
  }

  saludar(): string {
    return \`¡Hola! Soy \${this.nombre}, tengo \${this.edad} años y aprendo \${this.lenguaje} 🔷\`;
  }
}

// Generics
function obtenerPrimero<T>(arr: T[]): T | undefined {
  return arr[0];
}

// Uso
const estudiante = new Estudiante("María", 21);
console.log(estudiante.saludar());

const numeros: number[] = [10, 20, 30, 40, 50];
console.log("Primer número:", obtenerPrimero(numeros));
console.log("Suma:", numeros.reduce((a, b) => a + b, 0));

// Union types y type guards
type Resultado = { ok: true; valor: number } | { ok: false; error: string };

function dividir(a: number, b: number): Resultado {
  if (b === 0) return { ok: false, error: "División por cero" };
  return { ok: true, valor: a / b };
}

const res = dividir(10, 3);
if (res.ok) {
  console.log(\`10 / 3 = \${res.valor.toFixed(2)}\`);
}
`,
      },
    ],
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
    defaultFiles: [
      {
        name: "main.kt",
        path: "/main.kt",
        language: "kotlin",
        is_folder: false,
        content: `// 🎯 Kotlin Playground

data class Persona(val nombre: String, val edad: Int)

fun saludar(persona: Persona): String =
    "¡Hola, \${persona.nombre}! Tienes \${persona.edad} años 🎯"

fun main() {
    // Data classes
    val persona = Persona("Carlos", 23)
    println(saludar(persona))

    // Listas y lambdas
    val numeros = listOf(1, 2, 3, 4, 5, 6, 7, 8, 9, 10)
    val pares = numeros.filter { it % 2 == 0 }
    val cuadrados = pares.map { it * it }
    println("Cuadrados de pares: $cuadrados")

    // When expression
    val calificacion = 87
    val letra = when {
        calificacion >= 90 -> "A"
        calificacion >= 80 -> "B"
        calificacion >= 70 -> "C"
        calificacion >= 60 -> "D"
        else -> "F"
    }
    println("Calificación $calificacion → $letra")

    // String templates y nullable
    val lenguaje: String? = "Kotlin"
    println("Aprendiendo: \${lenguaje ?: "algo nuevo"}")
}
`,
      },
    ],
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
    defaultFiles: [
      {
        name: "main.dart",
        path: "/main.dart",
        language: "dart",
        is_folder: false,
        content: `// 🎨 Dart Playground

class Persona {
  final String nombre;
  final int edad;

  Persona(this.nombre, this.edad);

  String saludar() => '¡Hola! Soy \$nombre y tengo \$edad años 🎨';
}

void main() {
  final persona = Persona('Ana', 22);
  print(persona.saludar());

  // Listas
  final numeros = List.generate(10, (i) => i + 1);
  final pares = numeros.where((n) => n.isEven).toList();
  final cuadrados = pares.map((n) => n * n).toList();
  print('Cuadrados de pares: \$cuadrados');

  // Map (diccionario)
  final calificaciones = {'Ana': 95, 'Carlos': 82, 'María': 78};
  calificaciones.forEach((nombre, nota) {
    final letra = nota >= 90 ? 'A' : nota >= 80 ? 'B' : 'C';
    print('\$nombre: \$nota → \$letra');
  });

  // Null safety
  String? mensaje;
  print(mensaje ?? 'Sin mensaje');
  mensaje = '¡Dart es moderno!';
  print(mensaje);
}
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
      {
        name: "index.html",
        path: "/index.html",
        language: "html",
        is_folder: false,
        content: `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mi Página Web</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="container">
    <h1>¡Hola, Mundo! 🌐</h1>
    <p id="mensaje">Bienvenido al Playground</p>
    <button onclick="cambiarMensaje()">Haz clic aquí</button>
    <div class="contador">
      <button onclick="cambiarContador(-1)">−</button>
      <span id="contador">0</span>
      <button onclick="cambiarContador(1)">+</button>
    </div>
  </div>
  <script src="script.js"></script>
</body>
</html>
`,
      },
      {
        name: "style.css",
        path: "/style.css",
        language: "css",
        is_folder: false,
        content: `/* Estilos */
* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: 'Segoe UI', sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.container {
  background: white;
  padding: 2.5rem;
  border-radius: 20px;
  box-shadow: 0 25px 60px rgba(0,0,0,0.3);
  text-align: center;
  max-width: 380px;
  width: 90%;
}

h1 { color: #333; margin-bottom: 1rem; font-size: 1.8rem; }
p { color: #666; margin-bottom: 1.5rem; font-size: 1.1rem; }

button {
  background: #667eea;
  color: white;
  border: none;
  padding: 0.6rem 1.5rem;
  border-radius: 10px;
  cursor: pointer;
  font-size: 1rem;
  transition: transform 0.15s, background 0.15s;
  margin: 0.25rem;
}

button:hover { transform: scale(1.07); background: #5a6fd6; }

.contador {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.2rem;
}

.contador span {
  font-size: 2rem;
  font-weight: bold;
  color: #333;
  min-width: 3rem;
}
`,
      },
      {
        name: "script.js",
        path: "/script.js",
        language: "javascript",
        is_folder: false,
        content: `// Script JavaScript
const mensajes = [
  "¡Hola, Mundo! 🌍",
  "¡Bienvenido! 👋",
  "¡Aprendiendo JavaScript! 🚀",
  "¡Sigue adelante! 💪",
  "¡Eres increíble! ⭐",
];
let idx = 0;
let contador = 0;

function cambiarMensaje() {
  idx = (idx + 1) % mensajes.length;
  document.getElementById("mensaje").textContent = mensajes[idx];
}

function cambiarContador(delta) {
  contador += delta;
  document.getElementById("contador").textContent = contador;
}
`,
      },
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
    defaultFiles: [
      {
        name: "App.jsx",
        path: "/App.jsx",
        language: "javascript",
        is_folder: false,
        content: `// ⚛️ React Playground
// Edita este archivo y ve los cambios en el preview →

function Counter() {
  const [count, setCount] = React.useState(0);
  const color = count > 0 ? "#22c55e" : count < 0 ? "#ef4444" : "#6b7280";

  return (
    <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
      <div style={{
        fontSize: "3rem",
        fontWeight: "bold",
        color,
        transition: "color 0.3s",
        marginBottom: "0.75rem",
      }}>{count}</div>
      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
        <button onClick={() => setCount(c => c - 1)} style={btnStyle("#ef4444")}>−1</button>
        <button onClick={() => setCount(0)} style={btnStyle("#6b7280")}>Reset</button>
        <button onClick={() => setCount(c => c + 1)} style={btnStyle("#22c55e")}>+1</button>
      </div>
    </div>
  );
}

function TodoItem({ text, done, onToggle, onDelete }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.4rem 0" }}>
      <input type="checkbox" checked={done} onChange={onToggle} />
      <span style={{ flex: 1, textDecoration: done ? "line-through" : "none", color: done ? "#aaa" : "#333" }}>{text}</span>
      <button onClick={onDelete} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444" }}>✕</button>
    </div>
  );
}

function TodoList() {
  const [items, setItems] = React.useState([
    { id: 1, text: "Aprender React ⚛️", done: true },
    { id: 2, text: "Usar hooks", done: false },
    { id: 3, text: "Crear componentes", done: false },
  ]);
  const [input, setInput] = React.useState("");

  function addItem() {
    if (!input.trim()) return;
    setItems(prev => [...prev, { id: Date.now(), text: input.trim(), done: false }]);
    setInput("");
  }

  function toggle(id) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, done: !i.done } : i));
  }

  function remove(id) {
    setItems(prev => prev.filter(i => i.id !== id));
  }

  return (
    <div>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && addItem()}
          placeholder="Nueva tarea..."
          style={{ flex: 1, padding: "0.4rem 0.75rem", borderRadius: "8px", border: "1px solid #ddd" }}
        />
        <button onClick={addItem} style={btnStyle("#667eea")}>Agregar</button>
      </div>
      {items.map(item => (
        <TodoItem key={item.id} {...item} onToggle={() => toggle(item.id)} onDelete={() => remove(item.id)} />
      ))}
      <p style={{ marginTop: "0.5rem", fontSize: "0.85rem", color: "#888" }}>
        {items.filter(i => i.done).length} / {items.length} completadas
      </p>
    </div>
  );
}

function App() {
  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: "420px", margin: "2rem auto", padding: "0 1rem" }}>
      <h1 style={{ color: "#61dafb", textAlign: "center", marginBottom: "1.5rem" }}>⚛️ React Playground</h1>
      <div style={cardStyle}>
        <h3 style={{ marginBottom: "0.75rem", color: "#555" }}>Contador</h3>
        <Counter />
      </div>
      <div style={cardStyle}>
        <h3 style={{ marginBottom: "0.75rem", color: "#555" }}>Lista de Tareas</h3>
        <TodoList />
      </div>
    </div>
  );
}

const cardStyle = {
  background: "white",
  borderRadius: "12px",
  padding: "1.25rem",
  marginBottom: "1rem",
  boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
};

const btnStyle = (bg) => ({
  background: bg,
  color: "white",
  border: "none",
  padding: "0.4rem 0.9rem",
  borderRadius: "8px",
  cursor: "pointer",
  fontSize: "0.95rem",
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
    defaultFiles: [
      {
        name: "App.js",
        path: "/App.js",
        language: "javascript",
        is_folder: false,
        content: `// 💚 Vue.js Playground — Composition API
const { createApp, ref, computed } = Vue;

createApp({
  setup() {
    const nombre = ref("");
    const contador = ref(0);
    const tareas = ref([
      { id: 1, texto: "Aprender Vue 💚", hecha: true },
      { id: 2, texto: "Usar Composition API", hecha: false },
      { id: 3, texto: "Crear componentes", hecha: false },
    ]);
    const nuevaTarea = ref("");

    const saludo = computed(() =>
      nombre.value ? \`¡Hola, \${nombre.value}! 👋\` : "Escribe tu nombre..."
    );

    const tareasPendientes = computed(
      () => tareas.value.filter(t => !t.hecha).length
    );

    function agregarTarea() {
      if (!nuevaTarea.value.trim()) return;
      tareas.value.push({ id: Date.now(), texto: nuevaTarea.value.trim(), hecha: false });
      nuevaTarea.value = "";
    }

    function eliminarTarea(id) {
      tareas.value = tareas.value.filter(t => t.id !== id);
    }

    return { nombre, contador, tareas, nuevaTarea, saludo, tareasPendientes, agregarTarea, eliminarTarea };
  },

  template: \`
    <div style="font-family:sans-serif; max-width:420px; margin:2rem auto; padding:0 1rem;">
      <h1 style="color:#42b883; text-align:center; margin-bottom:1.5rem;">💚 Vue Playground</h1>

      <div style="background:white; border-radius:12px; padding:1.25rem; margin-bottom:1rem; box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <h3 style="margin-bottom:0.75rem; color:#555;">Saludo reactivo</h3>
        <input v-model="nombre" placeholder="Tu nombre..." style="width:100%; padding:0.4rem 0.75rem; border:1px solid #ddd; border-radius:8px; margin-bottom:0.5rem; font-size:1rem;" />
        <p style="color:#42b883; font-weight:500;">{{ saludo }}</p>
      </div>

      <div style="background:white; border-radius:12px; padding:1.25rem; margin-bottom:1rem; box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <h3 style="margin-bottom:0.75rem; color:#555;">Contador: {{ contador }}</h3>
        <div style="display:flex; gap:0.5rem;">
          <button @click="contador--" style="background:#ef4444; color:white; border:none; padding:0.4rem 1rem; border-radius:8px; cursor:pointer;">−</button>
          <button @click="contador=0" style="background:#6b7280; color:white; border:none; padding:0.4rem 1rem; border-radius:8px; cursor:pointer;">0</button>
          <button @click="contador++" style="background:#42b883; color:white; border:none; padding:0.4rem 1rem; border-radius:8px; cursor:pointer;">+</button>
        </div>
      </div>

      <div style="background:white; border-radius:12px; padding:1.25rem; box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <h3 style="margin-bottom:0.75rem; color:#555;">Tareas ({{ tareasPendientes }} pendientes)</h3>
        <div style="display:flex; gap:0.5rem; margin-bottom:0.75rem;">
          <input v-model="nuevaTarea" @keyup.enter="agregarTarea" placeholder="Nueva tarea..." style="flex:1; padding:0.4rem 0.75rem; border:1px solid #ddd; border-radius:8px; font-size:0.9rem;" />
          <button @click="agregarTarea" style="background:#42b883; color:white; border:none; padding:0.4rem 0.9rem; border-radius:8px; cursor:pointer;">+</button>
        </div>
        <div v-for="t in tareas" :key="t.id" style="display:flex; align-items:center; gap:0.5rem; padding:0.3rem 0;">
          <input type="checkbox" v-model="t.hecha" />
          <span :style="{ flex:1, textDecoration: t.hecha ? 'line-through' : 'none', color: t.hecha ? '#aaa' : '#333' }">{{ t.texto }}</span>
          <button @click="eliminarTarea(t.id)" style="background:none; border:none; cursor:pointer; color:#ef4444;">✕</button>
        </div>
      </div>
    </div>
  \`
}).mount("#app");
`,
      },
    ],
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
    defaultFiles: [
      {
        name: "app.ts",
        path: "/app.ts",
        language: "typescript",
        is_folder: false,
        content: `// 🔺 Angular-style Playground
// Usa Web Components nativos + TypeScript simplificado

class CounterElement extends HTMLElement {
  private count = 0;

  connectedCallback() { this.render(); }

  increment() { this.count++; this.render(); }
  decrement() { this.count--; this.render(); }
  reset() { this.count = 0; this.render(); }

  render() {
    const color = this.count > 0 ? "#22c55e" : this.count < 0 ? "#ef4444" : "#6b7280";
    this.innerHTML = \`
      <div style="text-align:center; margin-bottom:1rem;">
        <div style="font-size:3rem; font-weight:bold; color:\${color}; transition:color 0.3s;">\${this.count}</div>
        <div style="display:flex; gap:0.5rem; justify-content:center; margin-top:0.5rem;">
          <button onclick="this.closest('app-counter').decrement()" style="\${btnCss('#ef4444')}">−1</button>
          <button onclick="this.closest('app-counter').reset()" style="\${btnCss('#6b7280')}">Reset</button>
          <button onclick="this.closest('app-counter').increment()" style="\${btnCss('#22c55e')}">+1</button>
        </div>
      </div>
    \`;
  }
}

class TodoAppElement extends HTMLElement {
  private items: Array<{id: number; text: string; done: boolean}> = [
    { id: 1, text: "Aprender Angular 🔺", done: true },
    { id: 2, text: "Crear componentes", done: false },
    { id: 3, text: "Usar TypeScript", done: false },
  ];

  connectedCallback() { this.render(); }

  addItem() {
    const input = this.querySelector<HTMLInputElement>(".todo-input");
    if (!input?.value.trim()) return;
    this.items.push({ id: Date.now(), text: input.value.trim(), done: false });
    input.value = "";
    this.render();
  }

  toggle(id: number) {
    const item = this.items.find(i => i.id === id);
    if (item) item.done = !item.done;
    this.render();
  }

  remove(id: number) {
    this.items = this.items.filter(i => i.id !== id);
    this.render();
  }

  render() {
    const pending = this.items.filter(i => !i.done).length;
    this.innerHTML = \`
      <div>
        <p style="font-weight:500; color:#555; margin-bottom:0.5rem;">Tareas (\${pending} pendientes)</p>
        <div style="display:flex; gap:0.5rem; margin-bottom:0.5rem;">
          <input class="todo-input" placeholder="Nueva tarea..." style="flex:1; padding:0.4rem 0.75rem; border:1px solid #ddd; border-radius:8px;" />
          <button onclick="this.closest('app-todo').addItem()" style="\${btnCss('#dd0031')}">+</button>
        </div>
        \${this.items.map(item => \`
          <div style="display:flex; align-items:center; gap:0.5rem; padding:0.3rem 0;">
            <input type="checkbox" \${item.done ? "checked" : ""} onchange="this.closest('app-todo').toggle(\${item.id})" />
            <span style="flex:1; \${item.done ? "text-decoration:line-through; color:#aaa;" : ""}">\${item.text}</span>
            <button onclick="this.closest('app-todo').remove(\${item.id})" style="background:none; border:none; cursor:pointer; color:#ef4444;">✕</button>
          </div>
        \`).join("")}
      </div>
    \`;
  }
}

const btnCss = (bg: string) =>
  \`background:\${bg}; color:white; border:none; padding:0.4rem 0.9rem; border-radius:8px; cursor:pointer; font-size:0.95rem;\`;

customElements.define("app-counter", CounterElement);
customElements.define("app-todo", TodoAppElement);

document.body.innerHTML = \`
  <div style="font-family:sans-serif; max-width:420px; margin:2rem auto; padding:0 1rem;">
    <h1 style="color:#dd0031; text-align:center; margin-bottom:1.5rem;">🔺 Angular Playground</h1>
    <div style="\${cardCss}"><h3 style="margin-bottom:0.75rem; color:#555;">Contador</h3><app-counter></app-counter></div>
    <div style="\${cardCss}"><app-todo></app-todo></div>
  </div>
\`;
const cardCss = "background:white; border-radius:12px; padding:1.25rem; margin-bottom:1rem; box-shadow:0 2px 12px rgba(0,0,0,0.08);";
`,
      },
    ],
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
