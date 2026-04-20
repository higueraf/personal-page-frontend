/**
 * Monaco Editor – per-language completion providers
 *
 * Registers CompletionItemProviders for languages that Monaco doesn't ship
 * with full IntelliSense (Python, Kotlin, Dart, Java) and fine-tunes the
 * TypeScript/JavaScript worker for a Node.js backend environment.
 *
 * Call setupMonacoCompletion(monaco) exactly once, inside the `beforeMount`
 * prop of @monaco-editor/react.
 */
import type { Monaco } from "@monaco-editor/react";
import type * as ME from "monaco-editor";

let initialized = false;

export function setupMonacoCompletion(monaco: Monaco): void {
  if (initialized) return;
  initialized = true;

  configureTypeScript(monaco);
  registerPythonCompletions(monaco);
  registerKotlinCompletions(monaco);
  registerDartCompletions(monaco);
  registerJavaCompletions(monaco);
}

// ─── TypeScript / JavaScript ──────────────────────────────────────────────────

const NODE_TYPES_LIB = `
declare var process: {
  env: Record<string, string | undefined>;
  argv: string[];
  exit(code?: number): never;
  stdout: { write(s: string): void };
  stderr: { write(s: string): void };
  cwd(): string;
};
declare var __dirname: string;
declare var __filename: string;
declare function require(module: string): any;
declare function setTimeout(fn: (...args: any[]) => void, ms?: number, ...args: any[]): any;
declare function setInterval(fn: (...args: any[]) => void, ms?: number, ...args: any[]): any;
declare function clearTimeout(id?: any): void;
declare function clearInterval(id?: any): void;
declare function setImmediate(fn: (...args: any[]) => void, ...args: any[]): any;
declare function clearImmediate(id?: any): void;
declare class Buffer {
  static from(data: string | ArrayBuffer | number[], encoding?: string): Buffer;
  static alloc(size: number, fill?: number | string): Buffer;
  static isBuffer(obj: any): boolean;
  toString(encoding?: string): string;
  length: number;
}
declare var console: {
  log(...args: any[]): void;
  error(...args: any[]): void;
  warn(...args: any[]): void;
  info(...args: any[]): void;
  debug(...args: any[]): void;
  table(data: any): void;
  time(label?: string): void;
  timeEnd(label?: string): void;
  assert(condition?: boolean, ...args: any[]): void;
  clear(): void;
  dir(obj: any): void;
};
`;

function configureTypeScript(monaco: Monaco): void {
  const tsDefaults = monaco.languages.typescript.typescriptDefaults;
  const jsDefaults = monaco.languages.typescript.javascriptDefaults;

  const compilerOptions = {
    target: monaco.languages.typescript.ScriptTarget.ES2020,
    module: monaco.languages.typescript.ModuleKind.CommonJS,
    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    allowNonTsExtensions: true,
    allowJs: true,
    checkJs: true,
    noEmit: true,
    strict: false,
    esModuleInterop: true,
    allowSyntheticDefaultImports: true,
    jsx: monaco.languages.typescript.JsxEmit.React,
    lib: ["es2020"],
  };

  tsDefaults.setCompilerOptions(compilerOptions);
  jsDefaults.setCompilerOptions(compilerOptions);

  tsDefaults.setDiagnosticsOptions({ noSemanticValidation: false, noSyntaxValidation: false });
  jsDefaults.setDiagnosticsOptions({ noSemanticValidation: false, noSyntaxValidation: false });

  tsDefaults.addExtraLib(NODE_TYPES_LIB, "ts:node-globals.d.ts");
  jsDefaults.addExtraLib(NODE_TYPES_LIB, "ts:node-globals.d.ts");
}

// ─── Python ───────────────────────────────────────────────────────────────────

function registerPythonCompletions(monaco: Monaco): void {
  const { CompletionItemKind, CompletionItemInsertTextRule } = monaco.languages;
  const S = CompletionItemInsertTextRule.InsertAsSnippet;

  monaco.languages.registerCompletionItemProvider("python", {
    triggerCharacters: [".", "("],
    provideCompletionItems(
      model: ME.editor.ITextModel,
      position: ME.Position,
      context: ME.languages.CompletionContext,
    ) {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      // After ".", show only instance methods — not builtins/keywords
      if (context.triggerCharacter === '.') {
        return {
          suggestions: pyMemberItems.map(([label, detail, doc]) => ({
            label, detail, documentation: doc,
            kind: CompletionItemKind.Function,
            insertText: label, range,
          })),
        };
      }

      const suggestions: ME.languages.CompletionItem[] = [
        ...pyBuiltins.map(([label, detail, doc]) => ({
          label, detail, documentation: doc,
          kind: CompletionItemKind.Function,
          insertText: label, range,
        })),
        ...pyKeywords.map((kw) => ({
          label: kw,
          kind: CompletionItemKind.Keyword,
          insertText: kw, range,
        })),
        ...pySnippets.map(([label, insertText, detail]) => ({
          label, detail,
          kind: CompletionItemKind.Snippet,
          insertText, insertTextRules: S, range,
        })),
      ];

      return { suggestions };
    },
  });
}

const pyBuiltins: [string, string, string][] = [
  ["print",     "print(*objects, sep=' ', end='\\n')",  "Imprime objetos en la consola."],
  ["input",     "input(prompt='') -> str",              "Lee una línea del input estándar."],
  ["len",       "len(obj) -> int",                      "Retorna el número de ítems de un objeto."],
  ["range",     "range(stop) / range(start, stop[, step])", "Genera una secuencia inmutable de números."],
  ["type",      "type(object) -> type",                 "Retorna el tipo del objeto."],
  ["isinstance","isinstance(object, classinfo) -> bool","Comprueba si el objeto es instancia de la clase."],
  ["int",       "int(x=0, base=10) -> int",             "Convierte a entero."],
  ["float",     "float(x=0.0) -> float",                "Convierte a flotante."],
  ["str",       "str(object='') -> str",                "Convierte a cadena."],
  ["bool",      "bool(x=False) -> bool",                "Convierte a booleano."],
  ["list",      "list(iterable=[]) -> list",            "Crea una lista."],
  ["dict",      "dict(**kwargs) -> dict",               "Crea un diccionario."],
  ["set",       "set(iterable=[]) -> set",              "Crea un conjunto."],
  ["tuple",     "tuple(iterable=[]) -> tuple",          "Crea una tupla."],
  ["enumerate", "enumerate(iterable, start=0)",         "Retorna (índice, valor) para cada ítem."],
  ["zip",       "zip(*iterables)",                      "Combina iterables en tuplas."],
  ["map",       "map(func, iterable)",                  "Aplica función a cada ítem del iterable."],
  ["filter",    "filter(func, iterable)",               "Filtra ítems del iterable con la función."],
  ["sorted",    "sorted(iterable, key=None, reverse=False)", "Retorna lista ordenada."],
  ["reversed",  "reversed(sequence)",                   "Retorna iterador invertido."],
  ["sum",       "sum(iterable, start=0) -> number",     "Suma los ítems del iterable."],
  ["max",       "max(iterable, key=None)",              "Retorna el mayor elemento."],
  ["min",       "min(iterable, key=None)",              "Retorna el menor elemento."],
  ["abs",       "abs(x) -> number",                     "Valor absoluto."],
  ["round",     "round(number, ndigits=0)",             "Redondea al número de dígitos indicado."],
  ["open",      "open(file, mode='r', encoding=None)",  "Abre un archivo."],
  ["hasattr",   "hasattr(object, name) -> bool",        "Comprueba si el objeto tiene el atributo."],
  ["getattr",   "getattr(object, name[, default])",     "Obtiene el atributo del objeto."],
  ["setattr",   "setattr(object, name, value)",         "Asigna el atributo al objeto."],
  ["vars",      "vars([object]) -> dict",               "Retorna el __dict__ del objeto."],
  ["dir",       "dir([object]) -> list",                "Retorna lista de atributos/métodos."],
  ["help",      "help([object])",                       "Muestra documentación de ayuda."],
  ["id",        "id(object) -> int",                    "Retorna la identidad (dirección de memoria) del objeto."],
  ["hash",      "hash(object) -> int",                  "Retorna el hash del objeto."],
  ["repr",      "repr(object) -> str",                  "Retorna representación de cadena del objeto."],
  ["format",    "format(value[, format_spec]) -> str",  "Formatea el valor con el especificador."],
  ["chr",       "chr(i) -> str",                        "Retorna el carácter Unicode del entero."],
  ["ord",       "ord(c) -> int",                        "Retorna el código Unicode del carácter."],
  ["hex",       "hex(x) -> str",                        "Convierte entero a hexadecimal."],
  ["bin",       "bin(x) -> str",                        "Convierte entero a binario."],
  ["oct",       "oct(x) -> str",                        "Convierte entero a octal."],
  ["pow",       "pow(base, exp[, mod])",                "Eleva base a exp, opcionalmente módulo mod."],
  ["divmod",    "divmod(a, b) -> (div, mod)",           "Retorna cociente y residuo."],
  ["all",       "all(iterable) -> bool",                "True si todos los elementos son verdaderos."],
  ["any",       "any(iterable) -> bool",                "True si algún elemento es verdadero."],
  ["iter",      "iter(object[, sentinel])",             "Retorna un iterador del objeto."],
  ["next",      "next(iterator[, default])",            "Obtiene el siguiente ítem del iterador."],
  ["super",     "super() -> super",                     "Retorna el proxy del padre/hermano."],
  ["object",    "object()",                             "Clase base de todas las clases."],
  ["callable",  "callable(object) -> bool",             "True si el objeto es invocable."],
  ["staticmethod","@staticmethod",                      "Decorador de método estático."],
  ["classmethod", "@classmethod",                       "Decorador de método de clase."],
  ["property",  "@property",                            "Decorador de propiedad."],
];

const pyKeywords = [
  "False", "None", "True", "and", "as", "assert", "async", "await",
  "break", "class", "continue", "def", "del", "elif", "else", "except",
  "finally", "for", "from", "global", "if", "import", "in", "is",
  "lambda", "nonlocal", "not", "or", "pass", "raise", "return",
  "try", "while", "with", "yield",
];

const pySnippets: [string, string, string][] = [
  ["def",         "def ${1:nombre}(${2:parámetros}):\n    ${0:pass}",                     "Definir función"],
  ["class",       "class ${1:Nombre}:\n    def __init__(self${2:, parámetros}):\n        ${0:pass}", "Definir clase"],
  ["if/elif/else","if ${1:condición}:\n    ${2:pass}\nelif ${3:condición}:\n    ${4:pass}\nelse:\n    ${0:pass}", "Condicional completo"],
  ["for in",      "for ${1:item} in ${2:iterable}:\n    ${0:pass}",                      "Bucle for"],
  ["while",       "while ${1:condición}:\n    ${0:pass}",                                "Bucle while"],
  ["try/except",  "try:\n    ${1:pass}\nexcept ${2:Exception} as ${3:e}:\n    ${0:print(e)}", "Manejo de excepciones"],
  ["try/finally", "try:\n    ${1:pass}\nexcept ${2:Exception} as ${3:e}:\n    ${4:print(e)}\nfinally:\n    ${0:pass}", "Try-except-finally"],
  ["with open",   "with open('${1:archivo.txt}', '${2:r}') as ${3:f}:\n    ${0:contenido = f.read()}", "Abrir archivo"],
  ["list comp",   "[${1:expr} for ${2:item} in ${3:iterable}]",                          "Comprensión de lista"],
  ["dict comp",   "{${1:k}: ${2:v} for ${3:k}, ${4:v} in ${5:items}}",                  "Comprensión de diccionario"],
  ["lambda",      "lambda ${1:x}: ${0:x}",                                               "Función lambda"],
  ["main guard",  'if __name__ == "__main__":\n    ${0:main()}',                          "Guardia __main__"],
  ["import",      "import ${0:módulo}",                                                   "Importar módulo"],
  ["from import", "from ${1:módulo} import ${0:clase}",                                  "Importar desde módulo"],
  ["dataclass",   "from dataclasses import dataclass\n\n@dataclass\nclass ${1:Nombre}:\n    ${2:campo}: ${0:str}", "Data class"],
  ["input int",   "int(input('${0:Ingresa un número: }'))",                              "Leer entero del usuario"],
  ["print f",     'print(f"${1:texto} {${2:variable}}")',                                "Print con f-string"],
  ["enumerate",   "for ${1:i}, ${2:item} in enumerate(${3:lista}):\n    ${0:pass}",      "Enumerar lista"],
];

// Completions shown after "." — common instance methods for list / str / dict
const pyMemberItems: [string, string, string][] = [
  // list
  ["append",    "append(item)",                      "Añade item al final de la lista."],
  ["extend",    "extend(iterable)",                  "Extiende la lista con el iterable."],
  ["insert",    "insert(i, item)",                   "Inserta item en la posición i."],
  ["remove",    "remove(item)",                      "Elimina la primera ocurrencia de item."],
  ["pop",       "pop([i]) -> item",                  "Elimina y retorna el ítem en posición i."],
  ["clear",     "clear()",                           "Elimina todos los elementos."],
  ["index",     "index(item) -> int",                "Retorna el índice de la primera ocurrencia."],
  ["count",     "count(item) -> int",                "Cuenta las ocurrencias de item."],
  ["sort",      "sort(key=None, reverse=False)",     "Ordena la lista in-place."],
  ["reverse",   "reverse()",                        "Invierte la lista in-place."],
  ["copy",      "copy() -> list",                   "Retorna copia superficial de la lista."],
  // str
  ["upper",     "upper() -> str",                   "Convierte a mayúsculas."],
  ["lower",     "lower() -> str",                   "Convierte a minúsculas."],
  ["strip",     "strip([chars]) -> str",            "Elimina espacios al inicio y al final."],
  ["lstrip",    "lstrip([chars]) -> str",           "Elimina espacios a la izquierda."],
  ["rstrip",    "rstrip([chars]) -> str",           "Elimina espacios a la derecha."],
  ["split",     "split(sep=None) -> list",          "Divide la cadena en una lista."],
  ["join",      "join(iterable) -> str",            "Une los ítems del iterable con la cadena."],
  ["replace",   "replace(old, new) -> str",         "Reemplaza todas las ocurrencias de old."],
  ["find",      "find(sub) -> int",                 "Retorna el índice de la primera ocurrencia (−1 si no)."],
  ["startswith","startswith(prefix) -> bool",       "True si la cadena empieza con prefix."],
  ["endswith",  "endswith(suffix) -> bool",         "True si la cadena termina con suffix."],
  ["format",    "format(*args, **kwargs) -> str",   "Formatea la cadena."],
  ["encode",    "encode(encoding='utf-8') -> bytes","Codifica la cadena."],
  ["zfill",     "zfill(width) -> str",              "Rellena con ceros a la izquierda."],
  // dict
  ["keys",      "keys() -> KeysView",               "Retorna las claves del diccionario."],
  ["values",    "values() -> ValuesView",            "Retorna los valores del diccionario."],
  ["items",     "items() -> ItemsView",              "Retorna pares (clave, valor)."],
  ["get",       "get(key[, default]) -> value",     "Retorna el valor de la clave, o default si no existe."],
  ["update",    "update([other])",                  "Actualiza el diccionario con otro."],
  ["setdefault","setdefault(key[, default])",       "Retorna el valor de la clave; si no existe la inserta."],
];

// ─── Kotlin ───────────────────────────────────────────────────────────────────

function registerKotlinCompletions(monaco: Monaco): void {
  const { CompletionItemKind, CompletionItemInsertTextRule } = monaco.languages;
  const S = CompletionItemInsertTextRule.InsertAsSnippet;

  monaco.languages.registerCompletionItemProvider("kotlin", {
    triggerCharacters: [".", "("],
    provideCompletionItems(
      model: ME.editor.ITextModel,
      position: ME.Position,
      context: ME.languages.CompletionContext,
    ) {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      // After "." — show member methods/extensions only (no keywords, no class defs)
      if (context.triggerCharacter === '.') {
        return {
          suggestions: ktMemberSnippets.map(([label, insertText, detail]) => ({
            label, detail,
            kind: CompletionItemKind.Snippet,
            insertText, insertTextRules: S, range,
          })),
        };
      }

      const suggestions: ME.languages.CompletionItem[] = [
        ...ktStdlib.map(([label, detail, doc]) => ({
          label, detail, documentation: doc,
          kind: CompletionItemKind.Function,
          insertText: label, range,
        })),
        ...ktKeywords.map((kw) => ({
          label: kw, kind: CompletionItemKind.Keyword,
          insertText: kw, range,
        })),
        ...ktTypes.map(([label, detail]) => ({
          label, detail,
          kind: CompletionItemKind.Class,
          insertText: label, range,
        })),
        ...ktSnippets.map(([label, insertText, detail]) => ({
          label, detail,
          kind: CompletionItemKind.Snippet,
          insertText, insertTextRules: S, range,
        })),
      ];

      return { suggestions };
    },
  });
}

const ktStdlib: [string, string, string][] = [
  ["println",      "println(message: Any?)",                  "Imprime el mensaje con salto de línea."],
  ["print",        "print(message: Any?)",                    "Imprime el mensaje sin salto de línea."],
  ["readLine",     "readLine(): String?",                     "Lee una línea del input estándar."],
  ["readln",       "readln(): String",                        "Lee una línea (lanza excepción si null)."],
  ["listOf",       "listOf(vararg elements: T): List<T>",     "Crea una lista inmutable."],
  ["mutableListOf","mutableListOf(vararg elements: T): MutableList<T>", "Crea una lista mutable."],
  ["arrayOf",      "arrayOf(vararg elements: T): Array<T>",  "Crea un array."],
  ["mapOf",        "mapOf(vararg pairs: Pair<K,V>): Map<K,V>","Crea un mapa inmutable."],
  ["mutableMapOf", "mutableMapOf(vararg pairs: Pair<K,V>): MutableMap<K,V>", "Crea un mapa mutable."],
  ["setOf",        "setOf(vararg elements: T): Set<T>",       "Crea un conjunto inmutable."],
  ["mutableSetOf", "mutableSetOf(vararg elements: T): MutableSet<T>", "Crea un conjunto mutable."],
  ["emptyList",    "emptyList<T>(): List<T>",                 "Lista vacía inmutable."],
  ["emptyMap",     "emptyMap<K,V>(): Map<K,V>",              "Mapa vacío inmutable."],
  ["emptySet",     "emptySet<T>(): Set<T>",                  "Conjunto vacío inmutable."],
  ["arrayListOf",  "arrayListOf(vararg elements: T): ArrayList<T>", "Crea un ArrayList."],
  ["hashMapOf",    "hashMapOf(vararg pairs: Pair<K,V>): HashMap<K,V>", "Crea un HashMap."],
  ["maxOf",        "maxOf(a: T, b: T): T",                   "Retorna el mayor de los valores."],
  ["minOf",        "minOf(a: T, b: T): T",                   "Retorna el menor de los valores."],
  ["repeat",       "repeat(times: Int, action: (Int) -> Unit)","Repite el bloque N veces."],
  ["check",        "check(value: Boolean, lazyMessage: () -> Any = {})", "Valida una condición."],
  ["require",      "require(value: Boolean, lazyMessage: () -> Any = {})", "Valida argumento de entrada."],
  ["error",        "error(message: Any): Nothing",            "Lanza IllegalStateException."],
  ["TODO",         "TODO(reason: String = \"\"): Nothing",   "Marca código pendiente."],
  ["run",          "T.run(block: T.() -> R): R",             "Ejecuta el bloque con el receiver."],
  ["let",          "T.let(block: (T) -> R): R",              "Ejecuta el bloque con el valor como argumento."],
  ["apply",        "T.apply(block: T.() -> Unit): T",        "Ejecuta el bloque y retorna el receiver."],
  ["also",         "T.also(block: (T) -> Unit): T",          "Ejecuta el bloque y retorna el receiver sin cambiar."],
  ["with",         "with(receiver: T, block: T.() -> R): R", "Ejecuta bloque en el contexto del receiver."],
  ["takeIf",       "T.takeIf(predicate: (T) -> Boolean): T?","Retorna this si predicate es verdadero, sino null."],
  ["takeUnless",   "T.takeUnless(predicate: (T) -> Boolean): T?", "Retorna this si predicate es falso, sino null."],
  ["to",           "A.to(that: B): Pair<A, B>",             "Crea un Pair."],
  ["Pair",         "Pair(first: A, second: B)",              "Par de valores."],
  ["Triple",       "Triple(first: A, second: B, third: C)", "Triple de valores."],
];

const ktKeywords = [
  "fun", "val", "var", "class", "object", "interface", "when", "if", "else",
  "for", "while", "do", "try", "catch", "finally", "return", "break",
  "continue", "null", "true", "false", "this", "super", "is", "as", "in",
  "by", "companion", "data", "sealed", "enum", "abstract", "open", "override",
  "private", "protected", "public", "internal", "suspend", "inline", "init",
  "constructor", "typealias", "out", "import", "package", "throw",
];

const ktTypes: [string, string][] = [
  ["String",  "kotlin.String"],
  ["Int",     "kotlin.Int"],
  ["Long",    "kotlin.Long"],
  ["Double",  "kotlin.Double"],
  ["Float",   "kotlin.Float"],
  ["Boolean", "kotlin.Boolean"],
  ["Char",    "kotlin.Char"],
  ["Byte",    "kotlin.Byte"],
  ["Short",   "kotlin.Short"],
  ["Unit",    "kotlin.Unit"],
  ["Any",     "kotlin.Any"],
  ["Nothing", "kotlin.Nothing"],
  ["List",    "kotlin.collections.List<T>"],
  ["MutableList", "kotlin.collections.MutableList<T>"],
  ["Map",     "kotlin.collections.Map<K,V>"],
  ["Set",     "kotlin.collections.Set<T>"],
  ["Array",   "kotlin.Array<T>"],
  ["Pair",    "kotlin.Pair<A,B>"],
  ["Exception","kotlin.Exception"],
];

const ktSnippets: [string, string, string][] = [
  ["fun main",      "fun main() {\n    ${0:println(\"Hello World!\")}\n}",                        "Función main"],
  ["fun",           "fun ${1:nombre}(${2:parámetros}): ${3:Unit} {\n    ${0:}\n}",               "Función"],
  ["data class",    "data class ${1:Nombre}(\n    val ${2:campo}: ${3:String}\n)",               "Data class"],
  ["class",         "class ${1:Nombre} {\n    ${0:}\n}",                                         "Clase"],
  ["sealed class",  "sealed class ${1:Nombre} {\n    data class ${2:Caso}(val ${3:valor}: ${4:String}) : ${1:Nombre}()\n    ${0:}\n}", "Sealed class"],
  ["enum class",    "enum class ${1:Nombre} {\n    ${2:VALOR1}, ${3:VALOR2}\n}",                 "Enum class"],
  ["interface",     "interface ${1:Nombre} {\n    fun ${0:método}()\n}",                         "Interface"],
  ["object",        "object ${1:Nombre} {\n    ${0:}\n}",                                        "Singleton object"],
  ["companion object", "companion object {\n    ${0:}\n}",                                       "Companion object"],
  ["when",          "when (${1:valor}) {\n    ${2:caso1} -> ${3:resultado1}\n    ${4:caso2} -> ${5:resultado2}\n    else -> ${0:resultado}\n}", "Expresión when"],
  ["for in",        "for (${1:i} in ${2:0 until n}) {\n    ${0:}\n}",                           "Bucle for"],
  ["for each",      "for (${1:item} in ${2:lista}) {\n    ${0:println(item)}\n}",               "For-each"],
  ["while",         "while (${1:condición}) {\n    ${0:}\n}",                                   "Bucle while"],
  ["try/catch",     "try {\n    ${1:}\n} catch (${2:e}: ${3:Exception}) {\n    ${0:println(e.message)}\n}", "Try-catch"],
  ["try/finally",   "try {\n    ${1:}\n} catch (${2:e}: ${3:Exception}) {\n    ${4:}\n} finally {\n    ${0:}\n}", "Try-catch-finally"],
  ["lambda",        "{ ${1:it} -> ${0:} }",                                                     "Lambda"],
  ["?.let",         "${1:variable}?.let { ${2:it} ->\n    ${0:}\n}",                            "Safe let"],
  ["map",           "${1:lista}.map { ${2:it} ->\n    ${0:it}\n}",                              "map"],
  ["filter",        "${1:lista}.filter { ${2:it} ->\n    ${0:true}\n}",                         "filter"],
  ["forEach",       "${1:lista}.forEach { ${2:item} ->\n    ${0:println(item)}\n}",             "forEach"],
  ["readLine int",  "readLine()!!.trim().toInt()",                                               "Leer entero del usuario"],
  ["string template","\"${1:texto} \\${${2:variable}}\"",                                       "String template"],
];

// Snippets shown after "." — method/extension form without the "lista." prefix
const ktMemberSnippets: [string, string, string][] = [
  // Collection lambdas
  ["map",              "map { ${1:it} ->\n    ${0:it}\n}",                     "map { }"],
  ["mapNotNull",       "mapNotNull { ${1:it} ->\n    ${0:it}\n}",              "mapNotNull { }"],
  ["flatMap",          "flatMap { ${1:it} ->\n    ${0:listOf(it)}\n}",         "flatMap { }"],
  ["filter",           "filter { ${1:it} ->\n    ${0:true}\n}",               "filter { }"],
  ["filterNot",        "filterNot { ${1:it} ->\n    ${0:false}\n}",           "filterNot { }"],
  ["forEach",          "forEach { ${1:item} ->\n    ${0:println(item)}\n}",   "forEach { }"],
  ["any",              "any { ${1:it} ->\n    ${0:true}\n}",                  "any { }"],
  ["all",              "all { ${1:it} ->\n    ${0:true}\n}",                  "all { }"],
  ["none",             "none { ${1:it} ->\n    ${0:false}\n}",                "none { }"],
  ["count",            "count { ${1:it} ->\n    ${0:true}\n}",               "count { }"],
  ["find",             "find { ${1:it} ->\n    ${0:true}\n}",                "find { }"],
  ["first",            "first { ${1:it} ->\n    ${0:true}\n}",               "first { }"],
  ["last",             "last { ${1:it} ->\n    ${0:true}\n}",                "last { }"],
  ["sortedBy",         "sortedBy { ${0:it} }",                               "sortedBy { }"],
  ["sortedByDescending","sortedByDescending { ${0:it} }",                    "sortedByDescending { }"],
  ["groupBy",          "groupBy { ${0:it} }",                               "groupBy { }"],
  ["distinctBy",       "distinctBy { ${0:it} }",                            "distinctBy { }"],
  ["sumOf",            "sumOf { ${0:it} }",                                 "sumOf { }"],
  ["maxByOrNull",      "maxByOrNull { ${0:it} }",                           "maxByOrNull { }"],
  ["minByOrNull",      "minByOrNull { ${0:it} }",                           "minByOrNull { }"],
  ["joinToString",     "joinToString(${1:separator = \", \"}) { ${0:it} }", "joinToString"],
  ["reduce",           "reduce { ${1:acc}, ${2:it} -> ${0:acc} }",          "reduce { }"],
  ["fold",             "fold(${1:initial}) { ${2:acc}, ${3:it} -> ${0:acc} }", "fold { }"],
  ["partition",        "partition { ${0:true} }",                           "partition { }"],
  ["associate",        "associate { ${1:it} -> ${2:it} to ${0:it} }",       "associate { }"],
  // Terminal — no lambda
  ["toList",           "toList()",                                          "toList()"],
  ["toSet",            "toSet()",                                           "toSet()"],
  ["toMutableList",    "toMutableList()",                                   "toMutableList()"],
  ["toMutableSet",     "toMutableSet()",                                    "toMutableSet()"],
  ["toMap",            "toMap()",                                           "toMap()"],
  ["toSortedSet",      "toSortedSet()",                                     "toSortedSet()"],
  ["size",             "size",                                              "size property"],
  ["isEmpty",          "isEmpty()",                                         "isEmpty()"],
  ["isNotEmpty",       "isNotEmpty()",                                      "isNotEmpty()"],
  ["contains",         "contains(${0:element})",                           "contains()"],
  ["indexOf",          "indexOf(${0:element})",                            "indexOf()"],
  ["get",              "get(${0:index})",                                  "get()"],
  ["add",              "add(${0:element})",                                "add() – MutableList"],
  ["addAll",           "addAll(${0:elements})",                            "addAll() – MutableList"],
  ["remove",           "remove(${0:element})",                             "remove()"],
  ["clear",            "clear()",                                          "clear()"],
  // Scope functions
  ["let",              "let { ${1:it} ->\n    ${0:}\n}",                   "let { }"],
  ["also",             "also { ${1:it} ->\n    ${0:}\n}",                  "also { }"],
  ["apply",            "apply {\n    ${0:}\n}",                            "apply { }"],
  ["run",              "run {\n    ${0:}\n}",                              "run { }"],
  ["takeIf",           "takeIf { ${1:it} ->\n    ${0:true}\n}",           "takeIf { }"],
  ["takeUnless",       "takeUnless { ${1:it} ->\n    ${0:false}\n}",      "takeUnless { }"],
  // String extensions
  ["trim",             "trim()",                                           "trim() — String"],
  ["trimStart",        "trimStart()",                                      "trimStart() — String"],
  ["trimEnd",          "trimEnd()",                                        "trimEnd() — String"],
  ["uppercase",        "uppercase()",                                      "uppercase() — String"],
  ["lowercase",        "lowercase()",                                      "lowercase() — String"],
  ["split",            "split(\"${0:,}\")",                              "split() — String"],
  ["replace",          "replace(\"${1:old}\", \"${0:new}\")",            "replace() — String"],
  ["startsWith",       "startsWith(\"${0:prefix}\")",                    "startsWith()"],
  ["endsWith",         "endsWith(\"${0:suffix}\")",                      "endsWith()"],
  ["contains",         "contains(\"${0:substring}\")",                  "contains() — String"],
  ["substring",        "substring(${1:start}, ${0:end})",               "substring()"],
  ["length",           "length",                                         "length property — String"],
  ["toInt",            "toInt()",                                        "toInt()"],
  ["toDouble",         "toDouble()",                                     "toDouble()"],
  ["toIntOrNull",      "toIntOrNull()",                                  "toIntOrNull()"],
  ["toDoubleOrNull",   "toDoubleOrNull()",                               "toDoubleOrNull()"],
  ["toString",         "toString()",                                     "toString()"],
];

// ─── Dart ─────────────────────────────────────────────────────────────────────

function registerDartCompletions(monaco: Monaco): void {
  const { CompletionItemKind, CompletionItemInsertTextRule } = monaco.languages;
  const S = CompletionItemInsertTextRule.InsertAsSnippet;

  monaco.languages.registerCompletionItemProvider("dart", {
    triggerCharacters: [".", "("],
    provideCompletionItems(
      model: ME.editor.ITextModel,
      position: ME.Position,
      context: ME.languages.CompletionContext,
    ) {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      if (context.triggerCharacter === '.') {
        return {
          suggestions: dartMemberSnippets.map(([label, insertText, detail]) => ({
            label, detail,
            kind: CompletionItemKind.Snippet,
            insertText, insertTextRules: S, range,
          })),
        };
      }

      const suggestions: ME.languages.CompletionItem[] = [
        ...dartStdlib.map(([label, detail, doc]) => ({
          label, detail, documentation: doc,
          kind: CompletionItemKind.Function,
          insertText: label, range,
        })),
        ...dartKeywords.map((kw) => ({
          label: kw, kind: CompletionItemKind.Keyword,
          insertText: kw, range,
        })),
        ...dartTypes.map(([label, detail]) => ({
          label, detail,
          kind: CompletionItemKind.Class,
          insertText: label, range,
        })),
        ...dartSnippets.map(([label, insertText, detail]) => ({
          label, detail,
          kind: CompletionItemKind.Snippet,
          insertText, insertTextRules: S, range,
        })),
      ];

      return { suggestions };
    },
  });
}

const dartStdlib: [string, string, string][] = [
  ["print",         "print(Object? object)",                  "Imprime el objeto en la consola."],
  ["stdin.readLineSync", "stdin.readLineSync()",              "Lee una línea del input estándar (import 'dart:io')."],
  ["int.parse",     "int.parse(String source)",              "Convierte cadena a int."],
  ["double.parse",  "double.parse(String source)",           "Convierte cadena a double."],
  ["DateTime.now",  "DateTime.now()",                        "Retorna la fecha y hora actual."],
  ["Duration",      "Duration({int seconds=0, int milliseconds=0, ...})", "Representa una duración."],
  ["Future.delayed","Future.delayed(Duration duration, [FutureOr<T> computation()?])", "Ejecuta después de una demora."],
];

const dartKeywords = [
  "abstract", "as", "assert", "async", "await", "break", "case", "catch",
  "class", "const", "continue", "covariant", "default", "deferred", "do",
  "dynamic", "else", "enum", "export", "extends", "extension", "external",
  "factory", "false", "final", "finally", "for", "Function", "get", "if",
  "implements", "import", "in", "interface", "is", "late", "library",
  "mixin", "new", "null", "on", "operator", "part", "required", "rethrow",
  "return", "set", "show", "static", "super", "switch", "sync", "this",
  "throw", "true", "try", "typedef", "var", "void", "while", "with", "yield",
];

const dartTypes: [string, string][] = [
  ["String",   "dart:core String"],
  ["int",      "dart:core int"],
  ["double",   "dart:core double"],
  ["num",      "dart:core num"],
  ["bool",     "dart:core bool"],
  ["List",     "dart:core List<E>"],
  ["Map",      "dart:core Map<K,V>"],
  ["Set",      "dart:core Set<E>"],
  ["Iterable", "dart:core Iterable<E>"],
  ["Future",   "dart:async Future<T>"],
  ["Stream",   "dart:async Stream<T>"],
  ["Duration", "dart:core Duration"],
  ["DateTime", "dart:core DateTime"],
  ["RegExp",   "dart:core RegExp"],
  ["Object",   "dart:core Object"],
  ["dynamic",  "dynamic type"],
  ["void",     "void type"],
  ["never",    "Never type"],
];

const dartSnippets: [string, string, string][] = [
  ["main",           "void main() {\n  ${0:print('Hello World!');}\n}",                       "Función main"],
  ["void main async","void main() async {\n  ${0:await Future.delayed(Duration.zero);}\n}",  "Main async"],
  ["class",          "class ${1:Nombre} {\n  ${2:String} ${3:campo};\n\n  ${1:Nombre}(this.${3:campo});\n\n  ${0:}\n}", "Clase"],
  ["abstract class", "abstract class ${1:Nombre} {\n  ${0:void método();}\n}",               "Clase abstracta"],
  ["mixin",          "mixin ${1:Nombre} on ${2:Clase} {\n  ${0:}\n}",                        "Mixin"],
  ["enum",           "enum ${1:Nombre} {\n  ${2:valor1},\n  ${3:valor2},\n}",                "Enum"],
  ["extension",      "extension ${1:Nombre} on ${2:String} {\n  ${0:}\n}",                  "Extension method"],
  ["for loop",       "for (var ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n  ${0:}\n}",      "Bucle for"],
  ["for in",         "for (final ${1:item} in ${2:lista}) {\n  ${0:print(item);}\n}",       "For-in"],
  ["forEach",        "${1:lista}.forEach((${2:item}) {\n  ${0:print(item);}\n});",           "forEach"],
  ["map",            "${1:lista}.map((${2:item}) => ${0:item}).toList()",                    "map"],
  ["where",          "${1:lista}.where((${2:item}) => ${0:true}).toList()",                  "where (filter)"],
  ["while",          "while (${1:condición}) {\n  ${0:}\n}",                                "Bucle while"],
  ["try/catch",      "try {\n  ${1:}\n} catch (${2:e}) {\n  ${0:print(e);}\n}",            "Try-catch"],
  ["if/else",        "if (${1:condición}) {\n  ${2:}\n} else {\n  ${0:}\n}",               "If-else"],
  ["switch",         "switch (${1:valor}) {\n  case ${2:caso}:\n    ${3:break;}\n  default:\n    ${0:break;}\n}", "Switch"],
  ["async function", "Future<${1:void}> ${2:nombre}() async {\n  ${0:await Future.delayed(Duration.zero);}\n}", "Función async"],
  ["getter",         "${1:String} get ${2:propiedad} => ${0:_campo};",                      "Getter"],
  ["setter",         "set ${1:propiedad}(${2:String} value) {\n  ${0:_campo = value;}\n}", "Setter"],
  ["read int",       "int.parse(stdin.readLineSync()!.trim())",                              "Leer entero (dart:io)"],
];

// Completions shown after "." — method form without the "lista." prefix
const dartMemberSnippets: [string, string, string][] = [
  // Iterable / List
  ["map",           "map((${1:item}) => ${0:item}).toList()",              "map().toList()"],
  ["where",         "where((${1:item}) => ${0:true}).toList()",            "where().toList()"],
  ["forEach",       "forEach((${1:item}) {\n  ${0:print(item)};\n});",    "forEach()"],
  ["any",           "any((${1:item}) => ${0:true})",                      "any()"],
  ["every",         "every((${1:item}) => ${0:true})",                    "every()"],
  ["expand",        "expand((${1:item}) => ${0:[item]}).toList()",        "expand().toList()"],
  ["fold",          "fold(${1:initial}, (${2:acc}, ${3:item}) => ${0:acc})", "fold()"],
  ["reduce",        "reduce((${1:acc}, ${2:item}) => ${0:acc})",          "reduce()"],
  ["toList",        "toList()",                                           "toList()"],
  ["toSet",         "toSet()",                                            "toSet()"],
  ["toMap",         "toMap()",                                            "toMap()"],
  ["length",        "length",                                             "length property"],
  ["isEmpty",       "isEmpty",                                            "isEmpty property"],
  ["isNotEmpty",    "isNotEmpty",                                         "isNotEmpty property"],
  ["first",         "first",                                              "first property"],
  ["last",          "last",                                               "last property"],
  ["contains",      "contains(${0:element})",                            "contains()"],
  ["indexOf",       "indexOf(${0:element})",                             "indexOf()"],
  ["add",           "add(${0:element})",                                 "add() — List"],
  ["addAll",        "addAll(${0:elements})",                             "addAll() — List"],
  ["remove",        "remove(${0:element})",                              "remove() — List"],
  ["removeAt",      "removeAt(${0:index})",                              "removeAt() — List"],
  ["insert",        "insert(${1:index}, ${0:element})",                  "insert() — List"],
  ["clear",         "clear()",                                           "clear() — List"],
  ["sort",          "sort((${1:a}, ${2:b}) => ${0:a.compareTo(b)})",    "sort()"],
  ["join",          "join('${0:, }')",                                   "join() — Iterable"],
  ["take",          "take(${0:n})",                                      "take(n)"],
  ["skip",          "skip(${0:n})",                                      "skip(n)"],
  ["firstWhere",    "firstWhere((${1:item}) => ${0:true})",              "firstWhere()"],
  ["lastWhere",     "lastWhere((${1:item}) => ${0:true})",               "lastWhere()"],
  // String
  ["toUpperCase",   "toUpperCase()",                                     "toUpperCase() — String"],
  ["toLowerCase",   "toLowerCase()",                                     "toLowerCase() — String"],
  ["trim",          "trim()",                                            "trim() — String"],
  ["trimLeft",      "trimLeft()",                                        "trimLeft() — String"],
  ["trimRight",     "trimRight()",                                       "trimRight() — String"],
  ["split",         "split('${0:,}')",                                  "split() — String"],
  ["replaceAll",    "replaceAll('${1:from}', '${0:to}')",              "replaceAll() — String"],
  ["contains",      "contains('${0:substring}')",                      "contains() — String"],
  ["startsWith",    "startsWith('${0:prefix}')",                       "startsWith() — String"],
  ["endsWith",      "endsWith('${0:suffix}')",                         "endsWith() — String"],
  ["substring",     "substring(${1:start}, ${0:end})",                "substring() — String"],
  ["toString",      "toString()",                                       "toString()"],
  // Future
  ["then",          "then((${1:result}) {\n  ${0:print(result)};\n})", "then() — Future"],
  ["catchError",    "catchError((${1:error}) {\n  ${0:print(error)};\n})", "catchError() — Future"],
  ["whenComplete",  "whenComplete(() {\n  ${0:}\n})",                  "whenComplete() — Future"],
];

// ─── Java ─────────────────────────────────────────────────────────────────────

function registerJavaCompletions(monaco: Monaco): void {
  const { CompletionItemKind, CompletionItemInsertTextRule } = monaco.languages;
  const S = CompletionItemInsertTextRule.InsertAsSnippet;

  monaco.languages.registerCompletionItemProvider("java", {
    triggerCharacters: [".", "("],
    provideCompletionItems(
      model: ME.editor.ITextModel,
      position: ME.Position,
      context: ME.languages.CompletionContext,
    ) {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      if (context.triggerCharacter === '.') {
        return {
          suggestions: javaMemberSnippets.map(([label, insertText, detail]) => ({
            label, detail,
            kind: CompletionItemKind.Snippet,
            insertText, insertTextRules: S, range,
          })),
        };
      }

      const suggestions: ME.languages.CompletionItem[] = [
        ...javaClasses.map(([label, detail]) => ({
          label, detail,
          kind: CompletionItemKind.Class,
          insertText: label, range,
        })),
        ...javaKeywords.map((kw) => ({
          label: kw, kind: CompletionItemKind.Keyword,
          insertText: kw, range,
        })),
        ...javaSnippets.map(([label, insertText, detail]) => ({
          label, detail,
          kind: CompletionItemKind.Snippet,
          insertText, insertTextRules: S, range,
        })),
      ];

      return { suggestions };
    },
  });
}

const javaClasses: [string, string][] = [
  ["String",          "java.lang.String"],
  ["Integer",         "java.lang.Integer"],
  ["Double",          "java.lang.Double"],
  ["Boolean",         "java.lang.Boolean"],
  ["Character",       "java.lang.Character"],
  ["Long",            "java.lang.Long"],
  ["Float",           "java.lang.Float"],
  ["Math",            "java.lang.Math"],
  ["System",          "java.lang.System"],
  ["Object",          "java.lang.Object"],
  ["StringBuilder",   "java.lang.StringBuilder"],
  ["ArrayList",       "java.util.ArrayList<T>"],
  ["LinkedList",      "java.util.LinkedList<T>"],
  ["HashMap",         "java.util.HashMap<K,V>"],
  ["HashSet",         "java.util.HashSet<T>"],
  ["TreeMap",         "java.util.TreeMap<K,V>"],
  ["TreeSet",         "java.util.TreeSet<T>"],
  ["Arrays",          "java.util.Arrays"],
  ["Collections",     "java.util.Collections"],
  ["Scanner",         "java.util.Scanner"],
  ["List",            "java.util.List<T>"],
  ["Map",             "java.util.Map<K,V>"],
  ["Set",             "java.util.Set<T>"],
  ["Optional",        "java.util.Optional<T>"],
  ["Stream",          "java.util.stream.Stream<T>"],
  ["Iterator",        "java.util.Iterator<T>"],
  ["Exception",       "java.lang.Exception"],
  ["RuntimeException","java.lang.RuntimeException"],
  ["IllegalArgumentException", "java.lang.IllegalArgumentException"],
];

const javaKeywords = [
  "abstract", "assert", "boolean", "break", "byte", "case", "catch", "char",
  "class", "const", "continue", "default", "do", "double", "else", "enum",
  "extends", "final", "finally", "float", "for", "goto", "if", "implements",
  "import", "instanceof", "int", "interface", "long", "native", "new",
  "package", "private", "protected", "public", "return", "short", "static",
  "strictfp", "super", "switch", "synchronized", "this", "throw", "throws",
  "transient", "try", "var", "void", "volatile", "while", "true", "false", "null",
];

const javaSnippets: [string, string, string][] = [
  ["main",          "public static void main(String[] args) {\n    ${0:System.out.println(\"Hello World!\");}\n}", "Método main"],
  ["class",         "public class ${1:Nombre} {\n    ${0:}\n}",                                              "Clase pública"],
  ["interface",     "public interface ${1:Nombre} {\n    ${0:void método();}\n}",                            "Interface"],
  ["enum",          "public enum ${1:Nombre} {\n    ${2:VALOR1}, ${3:VALOR2};\n}",                           "Enum"],
  ["for",           "for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n    ${0:}\n}",                     "Bucle for"],
  ["for each",      "for (${1:String} ${2:item} : ${3:lista}) {\n    ${0:System.out.println(item);}\n}",    "For-each"],
  ["while",         "while (${1:condición}) {\n    ${0:}\n}",                                               "Bucle while"],
  ["if/else",       "if (${1:condición}) {\n    ${2:}\n} else {\n    ${0:}\n}",                             "If-else"],
  ["switch",        "switch (${1:variable}) {\n    case ${2:valor}:\n        ${3:break;}\n    default:\n        ${0:break;}\n}", "Switch"],
  ["try/catch",     "try {\n    ${1:}\n} catch (${2:Exception} ${3:e}) {\n    ${0:e.printStackTrace();}\n}", "Try-catch"],
  ["try/finally",   "try {\n    ${1:}\n} catch (${2:Exception} ${3:e}) {\n    ${4:e.printStackTrace();}\n} finally {\n    ${0:}\n}", "Try-finally"],
  ["sysout",        "System.out.println(${0:});",                                                            "System.out.println"],
  ["syserr",        "System.err.println(${0:});",                                                            "System.err.println"],
  ["Scanner",       "Scanner ${1:sc} = new Scanner(System.in);\n${2:String} ${3:input} = ${1:sc}.${0:nextLine()};", "Leer input con Scanner"],
  ["ArrayList",     "ArrayList<${1:String}> ${2:lista} = new ArrayList<>();",                                "Crear ArrayList"],
  ["HashMap",       "HashMap<${1:String}, ${2:String}> ${3:mapa} = new HashMap<>();",                       "Crear HashMap"],
  ["method",        "public ${1:void} ${2:nombre}(${3:}) {\n    ${0:}\n}",                                  "Método público"],
  ["constructor",   "public ${1:Nombre}(${2:}) {\n    ${0:}\n}",                                           "Constructor"],
  ["getter",        "public ${1:String} get${2:Campo}() {\n    return ${3:campo};\n}",                      "Getter"],
  ["setter",        "public void set${1:Campo}(${2:String} ${3:valor}) {\n    this.${4:campo} = ${3:valor};\n}", "Setter"],
  ["lambda",        "(${1:param}) -> ${0:resultado}",                                                       "Lambda (Java 8+)"],
  ["stream",        "${1:lista}.stream().${2:filter}(${3:item} -> ${0:true}).collect(Collectors.toList())", "Stream pipeline"],
];

const javaMemberSnippets: [string, string, string][] = [
  // Collection / List
  ["add",           "add(${0:element})",                                         "add() — Collection"],
  ["addAll",        "addAll(${0:collection})",                                   "addAll() — Collection"],
  ["remove",        "remove(${0:element})",                                      "remove() — Collection"],
  ["removeAll",     "removeAll(${0:collection})",                                "removeAll() — Collection"],
  ["get",           "get(${0:index})",                                           "get() — List"],
  ["set",           "set(${1:index}, ${0:element})",                             "set() — List"],
  ["size",          "size()",                                                     "size()"],
  ["isEmpty",       "isEmpty()",                                                  "isEmpty()"],
  ["contains",      "contains(${0:element})",                                    "contains()"],
  ["containsKey",   "containsKey(${0:key})",                                     "containsKey() — Map"],
  ["containsValue", "containsValue(${0:value})",                                 "containsValue() — Map"],
  ["clear",         "clear()",                                                    "clear()"],
  ["indexOf",       "indexOf(${0:element})",                                     "indexOf()"],
  ["lastIndexOf",   "lastIndexOf(${0:element})",                                 "lastIndexOf()"],
  ["subList",       "subList(${1:from}, ${0:to})",                               "subList()"],
  ["toArray",       "toArray()",                                                  "toArray()"],
  ["iterator",      "iterator()",                                                 "iterator()"],
  ["forEach",       "forEach(${1:item} -> {\n    ${0:System.out.println(item)};\n})", "forEach() lambda"],
  ["sort",          "sort(Comparator.comparingInt(${1:item} -> ${0:item.field}))", "sort() with Comparator"],
  // Map
  ["put",           "put(${1:key}, ${0:value})",                                 "put() — Map"],
  ["putIfAbsent",   "putIfAbsent(${1:key}, ${0:value})",                         "putIfAbsent() — Map"],
  ["getOrDefault",  "getOrDefault(${1:key}, ${0:defaultValue})",                 "getOrDefault() — Map"],
  ["keySet",        "keySet()",                                                   "keySet() — Map"],
  ["values",        "values()",                                                   "values() — Map"],
  ["entrySet",      "entrySet()",                                                 "entrySet() — Map"],
  // Stream pipeline
  ["stream",        "stream()",                                                   "stream() — Collection"],
  ["filter",        "filter(${1:item} -> ${0:true})",                            "filter() — Stream"],
  ["map",           "map(${1:item} -> ${0:item})",                               "map() — Stream"],
  ["mapToInt",      "mapToInt(${1:item} -> ${0:item.value})",                    "mapToInt() — Stream"],
  ["collect",       "collect(Collectors.toList())",                              "collect(toList())"],
  ["reduce",        "reduce(${1:0}, (${2:acc}, ${3:item}) -> ${0:acc + item})",  "reduce() — Stream"],
  ["count",         "count()",                                                    "count() — Stream"],
  ["distinct",      "distinct()",                                                 "distinct() — Stream"],
  ["sorted",        "sorted()",                                                   "sorted() — Stream"],
  ["limit",         "limit(${0:n})",                                             "limit() — Stream"],
  ["skip",          "skip(${0:n})",                                              "skip() — Stream"],
  ["anyMatch",      "anyMatch(${1:item} -> ${0:true})",                          "anyMatch() — Stream"],
  ["allMatch",      "allMatch(${1:item} -> ${0:true})",                          "allMatch() — Stream"],
  ["noneMatch",     "noneMatch(${1:item} -> ${0:true})",                         "noneMatch() — Stream"],
  ["findFirst",     "findFirst()",                                                "findFirst() — Stream"],
  ["toList",        "toList()",                                                   "toList() — Stream (Java 16+)"],
  // String
  ["length",        "length()",                                                   "length() — String"],
  ["charAt",        "charAt(${0:index})",                                        "charAt() — String"],
  ["substring",     "substring(${1:start}, ${0:end})",                          "substring() — String"],
  ["indexOf",       "indexOf('${0:char}')",                                      "indexOf() — String"],
  ["startsWith",    "startsWith(\"${0:prefix}\")",                              "startsWith() — String"],
  ["endsWith",      "endsWith(\"${0:suffix}\")",                                "endsWith() — String"],
  ["contains",      "contains(\"${0:substring}\")",                             "contains() — String"],
  ["replace",       "replace('${1:old}', '${0:new}')",                          "replace() — String"],
  ["replaceAll",    "replaceAll(\"${1:regex}\", \"${0:replacement}\")",          "replaceAll() — String"],
  ["split",         "split(\"${0:regex}\")",                                    "split() — String"],
  ["trim",          "trim()",                                                     "trim() — String"],
  ["strip",         "strip()",                                                    "strip() — String (Java 11+)"],
  ["toLowerCase",   "toLowerCase()",                                              "toLowerCase() — String"],
  ["toUpperCase",   "toUpperCase()",                                              "toUpperCase() — String"],
  ["equals",        "equals(${0:other})",                                        "equals() — String"],
  ["equalsIgnoreCase", "equalsIgnoreCase(${0:other})",                           "equalsIgnoreCase() — String"],
  ["compareTo",     "compareTo(${0:other})",                                     "compareTo() — String"],
  ["toCharArray",   "toCharArray()",                                              "toCharArray() — String"],
  ["valueOf",       "valueOf(${0:value})",                                        "valueOf() — String"],
  ["isBlank",       "isBlank()",                                                  "isBlank() — String (Java 11+)"],
  // StringBuilder
  ["append",        "append(${0:value})",                                        "append() — StringBuilder"],
  ["insert",        "insert(${1:offset}, ${0:value})",                           "insert() — StringBuilder"],
  ["delete",        "delete(${1:start}, ${0:end})",                              "delete() — StringBuilder"],
  ["reverse",       "reverse()",                                                  "reverse() — StringBuilder"],
  ["toString",      "toString()",                                                 "toString()"],
  // Optional
  ["isPresent",     "isPresent()",                                                "isPresent() — Optional"],
  ["get",           "get()",                                                      "get() — Optional"],
  ["orElse",        "orElse(${0:defaultValue})",                                 "orElse() — Optional"],
  ["orElseGet",     "orElseGet(() -> ${0:defaultValue})",                        "orElseGet() — Optional"],
  ["orElseThrow",   "orElseThrow(() -> new ${0:RuntimeException(\"msg\")})",     "orElseThrow() — Optional"],
  ["ifPresent",     "ifPresent(${1:value} -> ${0:System.out.println(value)})",   "ifPresent() — Optional"],
  ["map",           "map(${1:value} -> ${0:value})",                             "map() — Optional"],
  ["filter",        "filter(${1:value} -> ${0:true})",                           "filter() — Optional"],
  // Object
  ["hashCode",      "hashCode()",                                                 "hashCode()"],
  ["getClass",      "getClass()",                                                 "getClass()"],
  ["clone",         "clone()",                                                    "clone()"],
];
