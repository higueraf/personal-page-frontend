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

// ─── React ────────────────────────────────────────────────────────────────────

function buildReactPreview(files: VirtualFile[]): string {
  const appFile = files.find(
    (f) =>
      f.name.endsWith(".jsx") ||
      f.name === "App.js" ||
      f.name === "index.js"
  );
  if (!appFile) {
    return errorPage("No se encontró App.jsx o App.js");
  }

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
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8f9fa; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    ${appFile.content}

    const rootEl = document.getElementById("root");
    const root = ReactDOM.createRoot(rootEl);
    root.render(React.createElement(App));
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
