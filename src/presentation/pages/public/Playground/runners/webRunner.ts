import type { VirtualFile, Language } from "../store/playgroundStore";

/** Builds the srcdoc HTML string for the iframe preview */
export function buildIframeSrcdoc(
  files: VirtualFile[],
  language: Language
): string {
  switch (language) {
    case "html":
      return buildHtmlPreview(files);
    case "react":
      return buildReactPreview(files);
    case "vue":
      return buildVuePreview(files);
    case "angular":
      return buildAngularPreview(files);
    default:
      return buildHtmlPreview(files);
  }
}

// ─── HTML / CSS / JS ──────────────────────────────────────────────────────────

function buildHtmlPreview(files: VirtualFile[]): string {
  const htmlFile = files.find((f) => f.name.endsWith(".html"));
  if (!htmlFile) {
    return errorPage("No se encontró un archivo .html en el proyecto");
  }

  let content = htmlFile.content;

  // Inline each linked CSS file
  files
    .filter((f) => f.name.endsWith(".css") && !f.is_folder)
    .forEach((cssFile) => {
      const regex = new RegExp(
        `<link[^>]*href=["'][^"']*${escapeRegex(cssFile.name)}["'][^>]*>`,
        "g"
      );
      content = content.replace(regex, `<style>\n${cssFile.content}\n</style>`);
    });

  // Inline each linked JS file
  files
    .filter((f) => f.name.endsWith(".js") && !f.is_folder)
    .forEach((jsFile) => {
      const regex = new RegExp(
        `<script[^>]*src=["'][^"']*${escapeRegex(jsFile.name)}["'][^>]*></script>`,
        "g"
      );
      content = content.replace(
        regex,
        `<script>\n${jsFile.content}\n</script>`
      );
    });

  return content;
}

// ─── React (multi-file TypeScript mini-bundler) ───────────────────────────────
//
// Strategy: all .tsx/.ts/.jsx/.js files are embedded into the iframe as a
// JSON virtual-file-system. A tiny CJS-style require() runtime runs inside the
// iframe, transpiling each file on-demand with Babel standalone (which ships
// the React and TypeScript presets). CSS imports are intercepted and injected
// as <style> tags. External packages are limited to react / react-dom which
// are already loaded as UMD globals.

function buildReactPreview(files: VirtualFile[]): string {
  // Collect JS/TS source files
  const sourceFiles = files.filter(
    (f) => !f.is_folder && /\.(tsx?|jsx?)$/.test(f.name)
  );
  if (sourceFiles.length === 0) {
    return errorPage("No se encontraron archivos .tsx, .ts, .jsx o .js en el proyecto");
  }

  // Normalize paths: strip leading '/' so keys look like  src/App.tsx
  const vfs = Object.fromEntries(
    sourceFiles.map((f) => [f.path.replace(/^\//, ""), f.content])
  );

  // Also add CSS files to the VFS so CSS imports work
  files
    .filter((f) => !f.is_folder && f.name.endsWith(".css"))
    .forEach((f) => { vfs[f.path.replace(/^\//, "")] = f.content; });

  // Determine entry point (priority list mirrors create-react-app / Vite conventions)
  const entryPriority = [
    "src/main.tsx", "src/main.ts",
    "src/index.tsx", "src/index.ts",
    "src/App.tsx",  "src/App.jsx",
    "App.tsx", "App.jsx", "index.jsx", "App.js", "index.js",
  ];
  const normalizedPaths = new Set(Object.keys(vfs));
  const entryPath =
    entryPriority.find((p) => normalizedPaths.has(p)) ??
    sourceFiles[0].path.replace(/^\//, "");

  const vfsJson = JSON.stringify(vfs);
  const entryJson = JSON.stringify("./" + entryPath);

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>React Preview</title>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    #__err {
      display: none; position: fixed; inset: 0; background: #1a1a2e; color: #f87171;
      font-family: monospace; font-size: 13px; padding: 2rem;
      overflow: auto; white-space: pre-wrap; z-index: 9999;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <div id="__err"></div>
  <script>
  (function () {
    function showError(msg) {
      var el = document.getElementById('__err');
      el.style.display = 'block';
      el.textContent = '\\u26a0\\ufe0f Error\\n\\n' + msg;
    }

    if (!window.Babel)    { showError('Babel no pudo cargarse. Verifica tu conexi\\u00f3n a internet.'); return; }
    if (!window.React)    { showError('React no pudo cargarse. Verifica tu conexi\\u00f3n a internet.'); return; }
    if (!window.ReactDOM) { showError('ReactDOM no pudo cargarse. Verifica tu conexi\\u00f3n a internet.'); return; }

    // ── Virtual File System ─────────────────────────────────────────────────
    var VFS = ${vfsJson};
    var cache = {};   // path -> module.exports (prevents duplicate execution)

    // Resolve "src/components" + "../utils/helper" → "src/utils/helper"
    function joinPath(dir, rel) {
      var parts = (dir + '/' + rel).split('/');
      var out = [];
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        if (p === '..') out.pop();
        else if (p && p !== '.') out.push(p);
      }
      return out.join('/');
    }

    // Try exact path, then common extensions, then /index variants
    function resolveFile(path) {
      if (VFS[path] !== undefined) return path;
      var exts = ['.tsx', '.ts', '.jsx', '.js'];
      for (var i = 0; i < exts.length; i++) {
        if (VFS[path + exts[i]] !== undefined) return path + exts[i];
        var idx = path + '/index' + exts[i];
        if (VFS[idx] !== undefined) return idx;
      }
      return null;
    }

    // Factory: returns a require() scoped to a specific file's directory
    function makeRequire(fromPath) {
      var fromDir = fromPath.includes('/')
        ? fromPath.substring(0, fromPath.lastIndexOf('/'))
        : '';

      return function require(specifier) {
        // ── Built-in packages ──────────────────────────────────────────────
        if (specifier === 'react')  return window.React;
        if (specifier === 'react-dom' || specifier === 'react-dom/client') return window.ReactDOM;

        if (!specifier.startsWith('.')) {
          throw new Error(
            'Paquete externo no disponible: "' + specifier + '".' +
            ' En el preview solo est\\u00e1n disponibles react y react-dom.'
          );
        }

        // ── CSS import → inject <style> ────────────────────────────────────
        if (specifier.endsWith('.css')) {
          var cssResolved = joinPath(fromDir, specifier);
          var cssKey = 'css:' + cssResolved;
          if (!cache[cssKey]) {
            cache[cssKey] = true;
            var cssSource = VFS[cssResolved] || '';
            var styleEl = document.createElement('style');
            styleEl.textContent = cssSource;
            document.head.appendChild(styleEl);
          }
          return {};
        }

        // ── JS / TS module ─────────────────────────────────────────────────
        var resolved = joinPath(fromDir, specifier);
        var filePath = resolveFile(resolved);
        if (!filePath) {
          throw new Error(
            'M\\u00f3dulo no encontrado: "' + specifier + '" (buscado como: ' + resolved + ').' +
            ' Verifica el nombre y la ruta del archivo.'
          );
        }

        // Return cached exports (also handles circular deps gracefully)
        if (cache[filePath] !== undefined) return cache[filePath];

        // Transpile with Babel (JSX + TypeScript)
        var source = VFS[filePath];
        var transpiled;
        try {
          transpiled = Babel.transform(source, {
            presets: [
              ['react', { runtime: 'classic' }],
              'typescript'
            ],
            plugins: ['transform-modules-commonjs'],
            filename: filePath,
          }).code;
        } catch (e) {
          throw new Error('Error de sintaxis en ' + filePath + ':\\n' + e.message);
        }

        // Execute module in a CommonJS wrapper
        var mod = { exports: {} };
        cache[filePath] = mod.exports; // seed cache before execution (circular deps)
        try {
          // eslint-disable-next-line no-new-func
          new Function('require', 'module', 'exports', transpiled)(
            makeRequire(filePath), mod, mod.exports
          );
        } catch (e) {
          delete cache[filePath];
          throw new Error('Error en tiempo de ejecuci\\u00f3n en ' + filePath + ':\\n' + e.message);
        }

        cache[filePath] = mod.exports;
        return mod.exports;
      };
    }

    // ── Bootstrap ───────────────────────────────────────────────────────────
    try {
      makeRequire('')(${entryJson});
    } catch (e) {
      showError(e.message);
      console.error(e);
    }
  })();
  </script>
</body>
</html>`;
}

// ─── Vue ──────────────────────────────────────────────────────────────────────

function buildVuePreview(files: VirtualFile[]): string {
  const appFile = files.find(
    (f) =>
      f.name === "App.js" ||
      f.name === "main.js" ||
      f.name.endsWith(".vue")
  );
  if (!appFile) {
    return errorPage("No se encontró App.js o main.js");
  }

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vue Preview</title>
  <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f0f4f8; }
  </style>
</head>
<body>
  <div id="app"></div>
  <script>
    try {
      ${appFile.content}
    } catch(e) {
      document.body.innerHTML = '<div style="color:red; padding:1rem; font-family:monospace;">Error: ' + e.message + '</div>';
    }
  </script>
</body>
</html>`;
}

// ─── Angular (Web Components) ─────────────────────────────────────────────────

function buildAngularPreview(files: VirtualFile[]): string {
  const appFile = files.find((f) => f.name.endsWith(".ts"));
  if (!appFile) {
    return errorPage("No se encontró app.ts");
  }

  // Strip TypeScript type annotations for browser execution
  const jsCode = stripTypeScript(appFile.content);

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Angular Preview</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8f9fa; }
  </style>
</head>
<body>
  <script>
    try {
      ${jsCode}
    } catch(e) {
      document.body.innerHTML = '<div style="color:red; padding:1rem; font-family:monospace;">Error: ' + e.message + '</div>';
    }
  </script>
</body>
</html>`;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stripTypeScript(code: string): string {
  return (
    code
      // Remove import/export statements (not needed in browser)
      .replace(/^import\s.*$/gm, "")
      .replace(/^export\s+default\s+/gm, "")
      .replace(/^export\s+/gm, "")
      // Remove type annotations: param: Type
      .replace(/:\s*[A-Z][A-Za-z<>\[\]|&{},\s?]*(?=[,)=;{}\n])/g, "")
      // Remove generic type params <T>
      .replace(/<[A-Z][A-Za-z,\s]*>/g, "")
      // Remove access modifiers
      .replace(/\b(private|public|protected|readonly|abstract|override)\s+/g, "")
      // Remove interface declarations
      .replace(/interface\s+\w+\s*\{[^}]*\}/gs, "")
      // Remove type aliases
      .replace(/type\s+\w+\s*=\s*[^;]+;/g, "")
  );
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function errorPage(message: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><style>
  body { font-family: monospace; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #1a1a2e; }
  .box { color: #ef4444; padding: 2rem; text-align: center; }
  .icon { font-size: 3rem; margin-bottom: 1rem; }
</style></head>
<body><div class="box"><div class="icon">⚠️</div><p>${message}</p></div></body>
</html>`;
}
