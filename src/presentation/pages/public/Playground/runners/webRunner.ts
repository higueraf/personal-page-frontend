import type { VirtualFile, Language } from "../store/playgroundStore";

// ─── Error/console reporting ──────────────────────────────────────────────────
//
// Injected into every generated preview document so runtime errors, unhandled
// promise rejections and console.* calls are forwarded to the parent window
// via postMessage. The parent (PreviewPanel) surfaces them in a "Consola" tab
// so a blank/broken preview always has somewhere to look for the cause.

const ERROR_REPORTING_SCRIPT = `<script>
(function () {
  function post(type, message) {
    try {
      window.parent.postMessage({ __playgroundPreview: true, type: type, message: String(message) }, '*');
    } catch (e) {}
  }
  window.addEventListener('error', function (e) {
    var loc = e.filename ? ' (' + e.filename + (e.lineno ? ':' + e.lineno : '') + ')' : '';
    post('error', (e.message || 'Error') + loc);
  });
  window.addEventListener('unhandledrejection', function (e) {
    var reason = e.reason;
    post('error', 'Promesa rechazada sin manejar: ' + (reason && reason.message ? reason.message : reason));
  });
  var origLog = console.log, origWarn = console.warn, origError = console.error;
  function toStr(args) {
    try {
      return Array.prototype.slice.call(args).map(function (a) {
        return typeof a === 'string' ? a : JSON.stringify(a);
      }).join(' ');
    } catch (e) { return Array.prototype.slice.call(args).join(' '); }
  }
  console.log = function () { post('log', toStr(arguments)); origLog.apply(console, arguments); };
  console.warn = function () { post('warn', toStr(arguments)); origWarn.apply(console, arguments); };
  console.error = function () { post('error', toStr(arguments)); origError.apply(console, arguments); };
})();
</script>`;

/** Injects the error/console reporting script as early as possible in a full HTML document. */
function injectErrorReporting(html: string): string {
  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head[^>]*>/i, (m) => `${m}${ERROR_REPORTING_SCRIPT}`);
  }
  if (/<html[^>]*>/i.test(html)) {
    return html.replace(/<html[^>]*>/i, (m) => `${m}${ERROR_REPORTING_SCRIPT}`);
  }
  return ERROR_REPORTING_SCRIPT + html;
}

// ─── Full-screen error overlay (shared by the bundled previews) ───────────────

const ERROR_OVERLAY_STYLE = `
  * { box-sizing: border-box; }
  body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  #__err {
    display: none; position: fixed; inset: 0; background: #1a1a2e; color: #f87171;
    font-family: monospace; font-size: 13px; padding: 2rem;
    overflow: auto; white-space: pre-wrap; z-index: 9999;
  }`;

const ERROR_OVERLAY_SCRIPT = `<script>
function __showPreviewError(msg) {
  var el = document.getElementById('__err');
  if (el) {
    el.style.display = 'block';
    el.textContent = '\\u26a0\\ufe0f Error\\n\\n' + msg;
  }
  console.error(msg);
}
</script>`;

// ─── Virtual module runtime (shared by the React and Angular previews) ────────
//
// Both previews ship the project as a JSON virtual file system and resolve
// imports inside the iframe with a tiny CommonJS-style `require()`. Only two
// things differ between them: how each source file is transpiled (Babel for
// React's JSX, the TypeScript compiler for Angular's decorators) and which
// external packages are available. Everything else — path resolution, module
// caching, CSS imports, error messages — lives here, once.

const MODULE_RUNTIME_SCRIPT = `<script>
/** Resolves "src/components" + "../utils/helper" to "src/utils/helper". */
function __joinPath(dir, rel) {
  var parts = (dir + '/' + rel).split('/');
  var out = [];
  for (var i = 0; i < parts.length; i++) {
    var p = parts[i];
    if (p === '..') out.pop();
    else if (p && p !== '.') out.push(p);
  }
  return out.join('/');
}

/** Directory part of a virtual file path ('' for files at the root). */
function __dirOf(path) {
  return path.indexOf('/') >= 0 ? path.substring(0, path.lastIndexOf('/')) : '';
}

/**
 * Builds the module system for a preview.
 *
 * config = {
 *   vfs:         { 'src/App.tsx': '…' }  virtual file system (sources + .css/.html)
 *   extensions:  ['.tsx', '.ts']          tried when an import has no extension
 *   packages:    { react: window.React }  external packages available to the project
 *   transpile:   function (source, path) -> CommonJS source
 * }
 *
 * Returns makeRequire(fromPath): a require() scoped to that file's directory.
 */
function __createModuleSystem(config) {
  var vfs = config.vfs;
  var cache = {};

  function resolveFile(path) {
    if (vfs[path] !== undefined) return path;
    for (var i = 0; i < config.extensions.length; i++) {
      var ext = config.extensions[i];
      if (vfs[path + ext] !== undefined) return path + ext;
      var idx = path + '/index' + ext;
      if (vfs[idx] !== undefined) return idx;
    }
    return null;
  }

  function makeRequire(fromPath) {
    var fromDir = __dirOf(fromPath);

    return function require(specifier) {
      // ── External packages ──────────────────────────────────────────────
      if (Object.prototype.hasOwnProperty.call(config.packages, specifier)) {
        return config.packages[specifier];
      }

      if (specifier.charAt(0) !== '.') {
        throw new Error(
          'Paquete externo no disponible: "' + specifier + '".' +
          ' En el preview solo est\\u00e1n disponibles: ' +
          Object.keys(config.packages).join(', ') + '.'
        );
      }

      // ── CSS import -> inject a <style> tag ─────────────────────────────
      if (/\\.css$/.test(specifier)) {
        var cssResolved = __joinPath(fromDir, specifier);
        var cssKey = 'css:' + cssResolved;
        if (!cache[cssKey]) {
          cache[cssKey] = true;
          var styleEl = document.createElement('style');
          styleEl.textContent = vfs[cssResolved] || '';
          document.head.appendChild(styleEl);
        }
        return {};
      }

      // ── JS / TS module ─────────────────────────────────────────────────
      var resolved = __joinPath(fromDir, specifier);
      var filePath = resolveFile(resolved);
      if (!filePath) {
        throw new Error(
          'M\\u00f3dulo no encontrado: "' + specifier + '" (buscado como: ' + resolved + ').' +
          ' Verifica el nombre y la ruta del archivo.'
        );
      }

      // Return cached exports (also handles circular deps gracefully)
      if (cache[filePath] !== undefined) return cache[filePath];

      var transpiled;
      try {
        transpiled = config.transpile(vfs[filePath], filePath);
      } catch (e) {
        throw new Error('Error de sintaxis en ' + filePath + ':\\n' + e.message);
      }

      // Execute the module in a CommonJS wrapper
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

  return makeRequire;
}
</script>`;

/** Builds the srcdoc HTML string for the iframe preview */
export function buildIframeSrcdoc(
  files: VirtualFile[],
  language: Language
): string {
  switch (language) {
    case "html":
    case "html-array":
      return buildHtmlPreview(files);
    case "react":
    case "react-crud":
    case "react-cypress":
      return buildReactPreview(files);
    case "vue":
      return buildVuePreview(files);
    case "angular":
      return buildAngularPreview(files);
    default:
      return buildHtmlPreview(files);
  }
}

// ─── Virtual file system helpers (build time) ─────────────────────────────────

/**
 * JSON literal safe to inline inside a <script> tag: an HTML parser ends the script
 * at the first `</` sequence, so a project file containing `</script>` would otherwise
 * cut the preview document in half.
 */
function scriptJson(value: unknown): string {
  return JSON.stringify(value).replace(/<\//g, "<\\/");
}

/** Strips the leading '/' so VFS keys look like `src/App.tsx`. */
function vfsKey(path: string): string {
  return path.replace(/^\//, "");
}

/**
 * Collects the project into a `{ path: content }` map: every source file matching
 * `sourceRe` plus every asset (CSS, and HTML templates for Angular) so imports of
 * those can be resolved inside the iframe.
 */
function collectVfs(
  files: VirtualFile[],
  sourceRe: RegExp,
  assetRe: RegExp
): { vfs: Record<string, string>; sourcePaths: string[] } {
  const vfs: Record<string, string> = {};
  const sourcePaths: string[] = [];

  files
    .filter((f) => !f.is_folder)
    .forEach((f) => {
      if (sourceRe.test(f.name)) {
        vfs[vfsKey(f.path)] = f.content;
        sourcePaths.push(vfsKey(f.path));
      } else if (assetRe.test(f.name)) {
        vfs[vfsKey(f.path)] = f.content;
      }
    });

  return { vfs, sourcePaths };
}

/** First existing path of `priority`, falling back to the project's first source file. */
function pickEntry(
  vfs: Record<string, string>,
  priority: string[],
  sourcePaths: string[]
): string {
  return priority.find((p) => vfs[p] !== undefined) ?? sourcePaths[0];
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

  return injectErrorReporting(content);
}

// ─── React (multi-file TypeScript mini-bundler) ───────────────────────────────
//
// All .tsx/.ts/.jsx/.js files are embedded into the iframe as a JSON virtual
// file system and resolved by the shared module runtime, transpiling each file
// on-demand with Babel standalone (which ships the React and TypeScript
// presets). External packages are limited to react / react-dom, already loaded
// as UMD globals.

function buildReactPreview(files: VirtualFile[]): string {
  const { vfs, sourcePaths } = collectVfs(files, /\.(tsx?|jsx?)$/, /\.css$/);
  if (sourcePaths.length === 0) {
    return errorPage("No se encontraron archivos .tsx, .ts, .jsx o .js en el proyecto");
  }

  // Entry point priority mirrors create-react-app / Vite conventions
  const entryPath = pickEntry(
    vfs,
    [
      "src/main.tsx", "src/main.ts",
      "src/index.tsx", "src/index.ts",
      "src/App.tsx",  "src/App.jsx",
      "App.tsx", "App.jsx", "index.jsx", "App.js", "index.js",
    ],
    sourcePaths
  );

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>React Preview</title>
  ${ERROR_REPORTING_SCRIPT}
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>${ERROR_OVERLAY_STYLE}</style>
  ${ERROR_OVERLAY_SCRIPT}
  ${MODULE_RUNTIME_SCRIPT}
</head>
<body>
  <div id="root"></div>
  <div id="__err"></div>
  <script>
  (function () {
    if (!window.Babel)    { __showPreviewError('Babel no pudo cargarse. Verifica tu conexi\\u00f3n a internet.'); return; }
    if (!window.React)    { __showPreviewError('React no pudo cargarse. Verifica tu conexi\\u00f3n a internet.'); return; }
    if (!window.ReactDOM) { __showPreviewError('ReactDOM no pudo cargarse. Verifica tu conexi\\u00f3n a internet.'); return; }

    var makeRequire = __createModuleSystem({
      vfs: ${scriptJson(vfs)},
      extensions: ['.tsx', '.ts', '.jsx', '.js'],
      packages: {
        'react': window.React,
        'react-dom': window.ReactDOM,
        'react-dom/client': window.ReactDOM
      },
      transpile: function (source, filePath) {
        return Babel.transform(source, {
          presets: [['react', { runtime: 'classic' }], 'typescript'],
          plugins: ['transform-modules-commonjs'],
          filename: filePath
        }).code;
      }
    });

    try {
      makeRequire('')(${scriptJson("./" + entryPath)});
    } catch (e) {
      __showPreviewError(e.message);
      console.error(e);
    }
  })();
  </script>
</body>
</html>`;
}

// ─── Angular (JIT in the browser) ─────────────────────────────────────────────
//
// Angular ships no UMD bundles, so its packages are loaded as ES modules from
// esm.sh through an import map. The `*` prefix externalizes every dependency,
// which is what guarantees a SINGLE instance of @angular/core across packages —
// without it each package bundles its own copy and dependency injection fails
// with NG0203 / NullInjectorError.
//
// Project sources are transpiled with the real TypeScript compiler (not Babel)
// because Angular's constructor injection needs `emitDecoratorMetadata`, which
// only tsc emits — plus `reflect-metadata` so that metadata is actually stored.

const NG_VERSIONS = {
  angular: "19.2.14",
  rxjs: "7.8.2",
  tslib: "2.8.1",
  zone: "0.15.0",
  reflectMetadata: "0.2.2",
  typescript: "5.6.3",
};

/** Angular packages are externalized (`*`); the rest are served pre-bundled. */
function ngImportMap(): string {
  const ng = (name: string) =>
    `https://esm.sh/*@angular/${name}@${NG_VERSIONS.angular}`;

  // Each Angular package also needs a trailing-slash entry: once externalized,
  // its own internal chunks (e.g. "@angular/router/fesm2022/router-xxxx") are
  // imported as bare specifiers too.
  const angularEntries = ["core", "common", "compiler", "platform-browser", "forms", "router"]
    .flatMap((name) => [
      [`@angular/${name}`, ng(name)],
      [`@angular/${name}/`, `${ng(name)}/`],
    ]);

  return JSON.stringify({
    imports: Object.fromEntries([
      ...angularEntries,
      ["@angular/common/http", `${ng("common")}/http`],
      ["rxjs", `https://esm.sh/rxjs@${NG_VERSIONS.rxjs}`],
      ["rxjs/", `https://esm.sh/rxjs@${NG_VERSIONS.rxjs}/`],
      ["tslib", `https://esm.sh/tslib@${NG_VERSIONS.tslib}`],
      ["zone.js", `https://esm.sh/zone.js@${NG_VERSIONS.zone}`],
      ["reflect-metadata", `https://esm.sh/reflect-metadata@${NG_VERSIONS.reflectMetadata}`],
      ["typescript", `https://esm.sh/typescript@${NG_VERSIONS.typescript}`],
    ]),
  }, null, 2);
}

/**
 * In a sandboxed iframe without `allow-same-origin` the document has an opaque
 * origin and `history.pushState`/`replaceState` throw a SecurityError. Angular's
 * router calls them on every navigation (bootstrap included), so we fall back to
 * a plain fragment change, which the hash location strategy listens to anyway.
 */
const HISTORY_FALLBACK_SCRIPT = `<script>
(function () {
  var push = history.pushState.bind(history);
  var replace = history.replaceState.bind(history);
  function toHash(url) {
    var str = String(url == null ? '' : url);
    var i = str.indexOf('#');
    return i >= 0 ? str.slice(i) : '';
  }
  function fallback(url) {
    var hash = toHash(url);
    if (!hash || location.hash === hash) return;
    location.hash = hash;
  }
  history.pushState = function (state, title, url) {
    try { push(state, title, url); } catch (e) { fallback(url); }
  };
  history.replaceState = function (state, title, url) {
    try { replace(state, title, url); } catch (e) { fallback(url); }
  };
})();
</script>`;

/** Body of the project's index.html, or the conventional Angular root element. */
function ngRootMarkup(files: VirtualFile[]): string {
  const indexHtml = files.find((f) => !f.is_folder && f.name === "index.html");
  const body = indexHtml?.content.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1];
  const markup = body?.replace(/<script[\s\S]*?<\/script>/gi, "").trim();
  return markup && markup.length > 0 ? markup : "<app-root></app-root>";
}

function buildAngularPreview(files: VirtualFile[]): string {
  const { vfs, sourcePaths } = collectVfs(files, /\.(ts|js)$/, /\.(css|html)$/);
  if (sourcePaths.length === 0) {
    return errorPage("No se encontraron archivos .ts en el proyecto");
  }

  const entryPath = pickEntry(
    vfs,
    ["src/main.ts", "main.ts", "src/app/main.ts", "src/index.ts", "index.ts"],
    sourcePaths
  );

  // Angular CLI projects declare global styles in angular.json, not in an
  // import — so the preview injects them itself when the file exists.
  const globalStyles = ["src/styles.css", "styles.css"].find((p) => vfs[p] !== undefined);

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Angular Preview</title>
  ${ERROR_REPORTING_SCRIPT}
  ${HISTORY_FALLBACK_SCRIPT}
  <script type="importmap">${ngImportMap()}</script>
  <style>${ERROR_OVERLAY_STYLE}</style>
  ${ERROR_OVERLAY_SCRIPT}
  ${MODULE_RUNTIME_SCRIPT}
  <script>
  /**
   * JIT has no resource loader, so templateUrl / styleUrl(s) are inlined from
   * the virtual file system before the file reaches the compiler.
   */
  function __inlineAngularResources(vfs, source, filePath) {
    var dir = __dirOf(filePath);
    function read(url) {
      return vfs[__joinPath(dir, url)];
    }
    return source
      .replace(/templateUrl\\s*:\\s*['"]([^'"]+)['"]/g, function (match, url) {
        var html = read(url);
        return html === undefined ? match : 'template: ' + JSON.stringify(html);
      })
      .replace(/styleUrls?\\s*:\\s*(\\[[^\\]]*\\]|['"][^'"]+['"])/g, function (match, value) {
        var urls = value.match(/['"][^'"]+['"]/g) || [];
        var contents = [];
        for (var i = 0; i < urls.length; i++) {
          var css = read(urls[i].slice(1, -1));
          if (css === undefined) return match;
          contents.push(css);
        }
        return 'styles: ' + JSON.stringify(contents);
      });
  }
  </script>
</head>
<body>
  ${ngRootMarkup(files)}
  <div id="__err"></div>
  <script type="module">
  const VFS = ${scriptJson(vfs)};

  try {
    const tsModule = await import('typescript');
    const ts = tsModule.default ?? tsModule;

    // Order matters: reflect-metadata must be in place before any decorator runs,
    // zone.js before Angular bootstraps, and @angular/compiler before JIT compiles.
    await import('reflect-metadata');
    await import('zone.js');

    const [compiler, core, common, http, forms, router, platformBrowser, rxjs, rxjsOperators] =
      await Promise.all([
        import('@angular/compiler'),
        import('@angular/core'),
        import('@angular/common'),
        import('@angular/common/http'),
        import('@angular/forms'),
        import('@angular/router'),
        import('@angular/platform-browser'),
        import('rxjs'),
        import('rxjs/operators'),
      ]);

    // The XHR backend needs platform providers this standalone setup does not
    // install, so the preview always runs HttpClient on the fetch backend.
    const httpWithFetch = {
      ...http,
      provideHttpClient: (...features) =>
        http.provideHttpClient(
          ...(features.some((f) => f && f['ɵkind'] === http.HttpFeatureKind.Fetch)
            ? features
            : [...features, http.withFetch()])
        ),
    };

    const makeRequire = __createModuleSystem({
      vfs: VFS,
      extensions: ['.ts', '.js'],
      packages: {
        '@angular/core': core,
        '@angular/common': common,
        '@angular/common/http': httpWithFetch,
        '@angular/compiler': compiler,
        '@angular/forms': forms,
        '@angular/router': router,
        '@angular/platform-browser': platformBrowser,
        'rxjs': rxjs,
        'rxjs/operators': rxjsOperators,
      },
      transpile: (source, filePath) =>
        ts.transpileModule(__inlineAngularResources(VFS, source, filePath), {
          fileName: filePath,
          compilerOptions: {
            target: ts.ScriptTarget.ES2022,
            module: ts.ModuleKind.CommonJS,
            experimentalDecorators: true,
            emitDecoratorMetadata: true,
            esModuleInterop: true,
            useDefineForClassFields: false,
          },
        }).outputText,
    });

    const require = makeRequire('');
    ${globalStyles ? `require(${scriptJson("./" + globalStyles)});` : ""}
    require(${scriptJson("./" + entryPath)});
  } catch (e) {
    __showPreviewError(e && e.message ? e.message : String(e));
    console.error(e);
  }
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
  ${ERROR_REPORTING_SCRIPT}
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
      console.error(e.message);
    }
  </script>
</body>
</html>`;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function errorPage(message: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8">${ERROR_REPORTING_SCRIPT}<style>
  body { font-family: monospace; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #1a1a2e; }
  .box { color: #ef4444; padding: 2rem; text-align: center; }
  .icon { font-size: 3rem; margin-bottom: 1rem; }
</style></head>
<body><div class="box"><div class="icon">⚠️</div><p>${message}</p></div>
<script>console.error(${scriptJson(message)});</script>
</body>
</html>`;
}
