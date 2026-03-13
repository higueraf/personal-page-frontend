import { useMemo, useState } from "react";
import hljs from "highlight.js";
import { useTheme } from "../../shared/theme/ThemeProvider";

export default function CodeBlock({
  language,
  code,
  filename,
}: {
  language: string;
  code: string;
  filename?: string;
}) {
  const [copied, setCopied] = useState(false);
  const { theme } = useTheme();

  const highlighted = useMemo(() => {
    try {
      return hljs.highlight(code, { language }).value;
    } catch {
      return hljs.highlightAuto(code).value;
    }
  }, [code, language]);

  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-muted">
        <div className="text-sm opacity-70 text-foreground">{filename ?? language}</div>
        <button onClick={copy} className="text-sm px-2 py-1 rounded border text-foreground">
          {copied ? "¡Copiado!" : "Copiar"}
        </button>
      </div>
      <pre className={`p-3 overflow-x-auto ${theme === "dark" ? "bg-[#0d1117]" : "bg-white"}`}>
        <code dangerouslySetInnerHTML={{ __html: highlighted }} />
      </pre>
    </div>
  );
}
