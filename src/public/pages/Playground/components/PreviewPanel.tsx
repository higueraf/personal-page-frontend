import { useEffect, useRef, useState } from "react";
import { RefreshCw, ExternalLink, Monitor, Smartphone, Tablet } from "lucide-react";
import { usePlaygroundStore } from "../store/playgroundStore";
import { buildIframeSrcdoc } from "../runners/webRunner";

type ViewportSize = "desktop" | "tablet" | "mobile";

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

  const srcdoc = buildIframeSrcdoc(files, language);
  const combinedKey = `${refreshKey}-${localKey}`;

  useEffect(() => {
    // Auto-refresh when files change (debounced)
    const timer = setTimeout(() => {
      setLocalKey((k) => k + 1);
    }, 600);
    return () => clearTimeout(timer);
  }, [files]);

  return (
    <div className="flex flex-col h-full bg-[#f8f9fc] dark:bg-[#0d1117]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-gray-100 dark:bg-[#161b22] border-b border-black/10 dark:border-white/10 flex-shrink-0">
        <span className="text-[10px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-widest">
          Preview
        </span>

        {/* Viewport switcher */}
        <div className="flex items-center gap-1">
          {(["desktop", "tablet", "mobile"] as ViewportSize[]).map((v) => {
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

      {/* Preview area */}
      <div className="flex-1 overflow-auto bg-gray-200 dark:bg-[#1a1a2e] flex justify-center">
        <div
          style={{ width: VIEWPORT[viewport].w }}
          className="h-full transition-all duration-300"
        >
          <iframe
            key={combinedKey}
            ref={iframeRef}
            srcDoc={srcdoc}
            title="Web Preview"
            sandbox="allow-scripts allow-same-origin allow-modals allow-forms"
            className="w-full h-full border-0 bg-white"
          />
        </div>
      </div>
    </div>
  );
}
