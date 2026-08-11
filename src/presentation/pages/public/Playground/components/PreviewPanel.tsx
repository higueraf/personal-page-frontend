import { useEffect, useRef, useState } from "react";
import {
  RefreshCw,
  ExternalLink,
  Monitor,
  Smartphone,
  Tablet,
  Terminal,
  Trash2,
} from "lucide-react";
import { usePlaygroundStore } from "../store/playgroundStore";
import { buildIframeSrcdoc } from "../runners/webRunner";

type ViewportSize = "desktop" | "tablet" | "mobile";
type PanelTab = "preview" | "console";

interface ConsoleLog {
  type: "log" | "warn" | "error";
  message: string;
  time: string;
}

const VIEWPORT: Record<ViewportSize, { w: string; label: string }> = {
  desktop: { w: "100%", label: "Escritorio" },
  tablet: { w: "768px", label: "Tablet" },
  mobile: { w: "375px", label: "Móvil" },
};

interface PreviewPanelProps {
  /** Incremented externally to trigger a refresh */
  refreshKey?: number;
}

export default function PreviewPanel({ refreshKey = 0 }: PreviewPanelProps) {
  const { files, language } = usePlaygroundStore();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [viewport, setViewport] = useState<ViewportSize>("desktop");
  const [localKey, setLocalKey] = useState(0);
  const [tab, setTab] = useState<PanelTab>("preview");
  const [logs, setLogs] = useState<ConsoleLog[]>([]);

  const srcdoc = buildIframeSrcdoc(files, language);
  const combinedKey = `${refreshKey}-${localKey}`;

  useEffect(() => {
    // Auto-refresh when files change (debounced)
    const timer = setTimeout(() => {
      setLocalKey((k) => k + 1);
    }, 600);
    return () => clearTimeout(timer);
  }, [files]);

  // Reset console logs on every new preview build (new iframe document)
  useEffect(() => {
    setLogs([]);
  }, [combinedKey]);

  // Listen for error/console messages forwarded from the sandboxed iframe
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.source !== iframeRef.current?.contentWindow) return;
      const data = event.data;
      if (!data || data.__playgroundPreview !== true) return;
      const type: ConsoleLog["type"] =
        data.type === "error" || data.type === "warn" ? data.type : "log";
      setLogs((prev) => [
        ...prev,
        {
          type,
          message: String(data.message ?? ""),
          time: new Date().toLocaleTimeString(),
        },
      ]);
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const errorCount = logs.filter((l) => l.type === "error").length;

  return (
    <div className="flex flex-col h-full bg-[#f8f9fc] dark:bg-[#0d1117]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-gray-100 dark:bg-[#161b22] border-b border-black/10 dark:border-white/10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setTab("preview")}
            className={`text-[10px] font-semibold uppercase tracking-widest transition-colors ${
              tab === "preview"
                ? "text-gray-700 dark:text-slate-200"
                : "text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300"
            }`}
          >
            Preview
          </button>
          <button
            onClick={() => setTab("console")}
            className={`flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest transition-colors ${
              tab === "console"
                ? "text-gray-700 dark:text-slate-200"
                : "text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300"
            }`}
          >
            <Terminal size={11} />
            Consola
            {errorCount > 0 && (
              <span className="ml-0.5 px-1 rounded-full bg-red-500 text-white text-[9px] leading-4 font-bold">
                {errorCount}
              </span>
            )}
          </button>
        </div>

        {/* Viewport switcher */}
        <div className="flex items-center gap-1">
          {tab === "preview" &&
            (["desktop", "tablet", "mobile"] as ViewportSize[]).map((v) => {
              const Icon =
                v === "desktop" ? Monitor : v === "tablet" ? Tablet : Smartphone;
              return (
                <button
                  key={v}
                  onClick={() => setViewport(v)}
                  title={VIEWPORT[v].label}
                  className={`p-1 rounded transition-colors ${
                    viewport === v
                      ? "text-blue-500 dark:text-blue-400 bg-blue-500/20"
                      : "text-gray-500 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 hover:bg-black/10 dark:hover:bg-white/10"
                  }`}
                >
                  <Icon size={13} />
                </button>
              );
            })}

          {tab === "console" && logs.length > 0 && (
            <button
              onClick={() => setLogs([])}
              title="Limpiar consola"
              className="p-1 rounded text-gray-500 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            >
              <Trash2 size={13} />
            </button>
          )}

          <div className="w-px h-4 bg-black/10 dark:bg-white/10 mx-1" />

          <button
            onClick={() => setLocalKey((k) => k + 1)}
            title="Recargar preview"
            className="p-1 rounded text-gray-500 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          >
            <RefreshCw size={13} />
          </button>

          <button
            onClick={() => {
              const blob = new Blob([srcdoc], { type: "text/html" });
              const url = URL.createObjectURL(blob);
              window.open(url, "_blank");
            }}
            title="Abrir en nueva pestaña"
            className="p-1 rounded text-gray-500 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          >
            <ExternalLink size={13} />
          </button>
        </div>
      </div>

      {/* Preview area (kept mounted so the iframe/JS keep running and forwarding logs even when the Consola tab is active) */}
      <div
        className={`flex-1 overflow-auto bg-gray-200 dark:bg-[#1a1a2e] flex justify-center ${
          tab === "preview" ? "" : "hidden"
        }`}
      >
        <div
          style={{ width: VIEWPORT[viewport].w }}
          className="h-full transition-all duration-300"
        >
          <iframe
            key={combinedKey}
            ref={iframeRef}
            srcDoc={srcdoc}
            title="Web Preview"
            // No "allow-same-origin": with it, Chrome treats a srcDoc iframe's
            // document URL as identical to the parent page's real URL, so any
            // in-app hash link (e.g. our React exams' custom hash router) resolves
            // to a real, same-origin, servable URL and triggers a genuine
            // navigation instead of an internal fragment change — loading the
            // actual host app (nested) inside the preview. Without this flag the
            // iframe gets an opaque origin, so "#/ruta" stays a harmless internal
            // fragment navigation. Not needed anyway: the bundler only touches its
            // own DOM/head, never cookies/localStorage/parent access.
            sandbox="allow-scripts allow-modals allow-forms"
            className="w-full h-full border-0 bg-white"
          />
        </div>
      </div>

      {/* Console area */}
      {tab === "console" && (
        <div className="flex-1 overflow-auto font-mono text-xs">
          {logs.length === 0 ? (
            <div className="p-4 text-gray-400 dark:text-slate-500">
              Sin mensajes de consola. Los errores, advertencias y{" "}
              <code>console.log</code> del preview aparecerán aquí.
            </div>
          ) : (
            logs.map((l, i) => (
              <div
                key={i}
                className={`flex gap-2 px-3 py-1.5 border-b border-black/5 dark:border-white/5 ${
                  l.type === "error"
                    ? "bg-red-500/10 text-red-600 dark:text-red-400"
                    : l.type === "warn"
                      ? "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
                      : "text-gray-700 dark:text-slate-300"
                }`}
              >
                <span className="text-gray-400 dark:text-slate-500 flex-shrink-0">
                  {l.time}
                </span>
                <span className="whitespace-pre-wrap break-all">{l.message}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
