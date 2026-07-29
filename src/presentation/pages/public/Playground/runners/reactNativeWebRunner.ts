import type { VirtualFile } from "../store/playgroundStore";

// ─── React Native (via react-native-web, multi-file ESM mini-bundler) ────────
//
// Strategy: unlike the CJS/UMD bundler used for the web-React preview
// (`webRunner.ts` → buildReactPreview), react-native-web ships as an ES module
// graph, so it can't be loaded as a `window.ReactNativeWeb` UMD global. Instead:
//   - An HTML <script type="importmap"> pins the bare specifiers "react",
//     "react-dom", "react-dom/client" and "react-native" to specific esm.sh
//     URLs. Because react-native-web's own esm.sh bundle is built with
//     `?external=react,react-dom`, it imports those same bare specifiers
//     internally — so the browser's module cache guarantees a single shared
//     React instance (no "Invalid hook call" from duplicate React copies).
//   - Each project file is transpiled on-demand with Babel standalone
//     (JSX + TypeScript, keeping native ESM import/export syntax — no
//     transform-modules-commonjs). Relative import specifiers are rewritten
//     in-place to Blob URLs (recursing into sibling/child files); bare
//     specifiers are left untouched so they resolve via the import map.
//   - The final entry file's Blob URL is loaded with a native `import()`.

export function buildReactNativeWebPreview(files: VirtualFile[]): string {
  const sourceFiles = files.filter(
    (f) => !f.is_folder && /\.(tsx?|jsx?)$/.test(f.name)
  );
  if (sourceFiles.length === 0) {
    return errorPage("No se encontraron archivos .tsx, .ts, .jsx o .js en el proyecto");
  }

  // Normalize paths: strip leading '/' so keys look like  src/screens/Tareas.tsx
  const vfs: Record<string, string> = {};
  for (const f of sourceFiles) {
    vfs[f.path.replace(/^\//, "")] = f.content;
  }

  // Entry point priority: React Native convention, root App.tsx first.
  const entryPriority = ["App.tsx", "App.jsx", "src/App.tsx", "index.tsx", "index.jsx"];
  const normalizedPaths = new Set(Object.keys(vfs));
  const entryPath =
    entryPriority.find((p) => normalizedPaths.has(p)) ??
    sourceFiles[0].path.replace(/^\//, "");

  const vfsJson = JSON.stringify(vfs);
  const entryJson = JSON.stringify(entryPath);

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>React Native Preview</title>
  <script type="importmap">
  {
    "imports": {
      "react": "https://esm.sh/react@18.3.1",
      "react/jsx-runtime": "https://esm.sh/react@18.3.1/jsx-runtime",
      "react-dom": "https://esm.sh/react-dom@18.3.1",
      "react-dom/client": "https://esm.sh/react-dom@18.3.1/client",
      "react-native": "https://esm.sh/react-native-web@0.19.13?external=react,react-dom"
    }
  }
  </script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    * { box-sizing: border-box; }
    html, body, #root { height: 100%; }
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #fff; }
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
  <script type="module">
    function showError(msg) {
      var el = document.getElementById('__err');
      el.style.display = 'block';
      el.textContent = '\\u26a0\\ufe0f Error\\n\\n' + msg;
    }

    window.addEventListener('error', function (e) {
      showError(e.error ? (e.error.stack || e.error.message) : e.message);
    });
    window.addEventListener('unhandledrejection', function (e) {
      var reason = e.reason;
      showError(reason && reason.stack ? reason.stack : String(reason));
    });

    if (!window.Babel) {
      showError('Babel no pudo cargarse. Verifica tu conexi\\u00f3n a internet.');
    } else {
      run();
    }

    function run() {
      // ── Virtual File System ─────────────────────────────────────────────
      var VFS = ${vfsJson};
      var blobCache = {}; // filePath -> blob: URL (avoids re-processing shared modules)

      // Resolve "src/screens" + "../styles" → "src/styles"
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

      // Matches: import ... from "spec" / export ... from "spec" / import "spec"
      var SPECIFIER_RE = /((?:from|import)\\s*)(['"])([^'"]+)\\2/g;

      // Matches: import Default, { A, B } from "./relative"  /  import { A, B } from "./relative"
      var NAMED_IMPORT_RE = /import\\s+(?:([\\w$]+)\\s*,\\s*)?\\{([^}]*)\\}\\s*from\\s*(['"])(\\.[^'"]+)\\3/g;

      var moduleExportsCache = {}; // filePath -> { [exportedName]: true }

      // Scans a transpiled file's *runtime* exports (const/let/var/function/class
      // declarations and export lists). TypeScript interface/type declarations
      // compile away to nothing, so they never show up here — that's exactly
      // what lets us detect "phantom" named imports below.
      function getExportedNames(code) {
        var names = {};
        var m;
        var re1 = /export\\s+(?:const|let|var|function\\*?|class|async\\s+function)\\s+([A-Za-z0-9_$]+)/g;
        while ((m = re1.exec(code))) names[m[1]] = true;
        var re2 = /export\\s*\\{([^}]*)\\}/g;
        while ((m = re2.exec(code))) {
          m[1].split(',').forEach(function (part) {
            var piece = part.trim();
            if (!piece) return;
            var asMatch = piece.match(/^([A-Za-z0-9_$]+)\\s+as\\s+([A-Za-z0-9_$]+)$/);
            names[asMatch ? asMatch[2] : piece] = true;
          });
        }
        return names;
      }

      // Transpiles a file, rewrites its relative import specifiers to Blob
      // URLs (recursing into each), and returns a Blob URL for the file itself.
      function processFile(filePath) {
        if (blobCache[filePath]) return blobCache[filePath];

        var source = VFS[filePath];
        var fromDir = filePath.includes('/')
          ? filePath.substring(0, filePath.lastIndexOf('/'))
          : '';

        var transpiled;
        try {
          transpiled = Babel.transform(source, {
            presets: [
              ['react', { runtime: 'automatic' }],
              'typescript',
            ],
            filename: filePath,
          }).code;
        } catch (e) {
          throw new Error('Error de sintaxis en ' + filePath + ':\\n' + e.message);
        }

        moduleExportsCache[filePath] = getExportedNames(transpiled);

        // Pass 1: named imports from relative files — prune specifiers that
        // reference TypeScript types Babel failed to elide (they don't exist
        // as runtime exports of the target module) before rewriting the URL.
        var pruned = transpiled.replace(NAMED_IMPORT_RE, function (match, defaultName, namedList, quote, spec) {
          var resolved = joinPath(fromDir, spec);
          var childPath = resolveFile(resolved);
          if (!childPath) {
            throw new Error(
              'M\\u00f3dulo no encontrado: "' + spec + '" (buscado como: ' + resolved + ').' +
              ' Verifica el nombre y la ruta del archivo.'
            );
          }
          var childUrl = processFile(childPath);
          var childExports = moduleExportsCache[childPath] || {};
          var kept = namedList
            .split(',')
            .map(function (p) { return p.trim(); })
            .filter(function (p) {
              if (!p) return false;
              var asMatch = p.match(/^([A-Za-z0-9_$]+)\\s+as\\s+([A-Za-z0-9_$]+)$/);
              var localSource = asMatch ? asMatch[1] : p;
              return !!childExports[localSource];
            });
          var namedClause = kept.length ? ('{ ' + kept.join(', ') + ' }') : '{}';
          var defaultClause = defaultName ? (defaultName + ', ') : '';
          return 'import ' + defaultClause + namedClause + ' from ' + quote + childUrl + quote;
        });

        // Pass 2: everything else (default-only imports, namespace imports,
        // bare side-effect imports, dynamic import()). Blob URLs from pass 1
        // don't start with "." so they're left untouched here.
        var rewritten = pruned.replace(SPECIFIER_RE, function (match, kw, quote, spec) {
          if (!spec.startsWith('.')) return match; // bare specifier → import map handles it
          var resolved = joinPath(fromDir, spec);
          var childPath = resolveFile(resolved);
          if (!childPath) {
            throw new Error(
              'M\\u00f3dulo no encontrado: "' + spec + '" (buscado como: ' + resolved + ').' +
              ' Verifica el nombre y la ruta del archivo.'
            );
          }
          var childUrl = processFile(childPath);
          return kw + quote + childUrl + quote;
        });

        var blob = new Blob([rewritten], { type: 'text/javascript' });
        var url = URL.createObjectURL(blob);
        blobCache[filePath] = url;
        return url;
      }

      // ── Bootstrap ─────────────────────────────────────────────────────────
      (async function () {
        try {
          var entryUrl = processFile(${entryJson});
          var [{ default: App }, React, { createRoot }] = await Promise.all([
            import(entryUrl),
            import('react'),
            import('react-dom/client'),
          ]);
          if (!App) {
            throw new Error('El archivo de entrada (' + ${entryJson} + ') no tiene un "export default".');
          }
          createRoot(document.getElementById('root')).render(React.createElement(App));
        } catch (e) {
          showError(e && e.stack ? e.stack : (e && e.message) || String(e));
          console.error(e);
        }
      })();
    }
  </script>
</body>
</html>`;
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
