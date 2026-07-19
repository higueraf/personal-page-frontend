import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { usePlaygroundStore } from "../store/playgroundStore";
import { buildFlutterBundle } from "../runners/flutterBundler";

interface FlutterPreviewPanelProps {
  /** Incremented externally (▶ Run button) to push the latest code to DartPad */
  refreshKey?: number;
}

const DARTPAD_URL =
  "https://dartpad.dev/embed-flutter.html?theme=dark&split=0&run=true&null_safety=true";

export default function FlutterPreviewPanel({ refreshKey = 0 }: FlutterPreviewPanelProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Changing localKey recreates the iframe (full reload of DartPad)
  const [localKey, setLocalKey] = useState(0);

  // ── Send code to DartPad via postMessage ─────────────────────────────────────
  // Reads from usePlaygroundStore.getState() so it always gets the latest files
  // even if called from a stale closure (e.g. inside setTimeout).
  const sendCode = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;

    const { files } = usePlaygroundStore.getState();
    const code = buildFlutterBundle(files);

    iframe.contentWindow.postMessage(
      { type: "sourceCode", sourceCode: code },
      "https://dartpad.dev"
    );
  }, []);

  // ── When ▶ Run is clicked, push the latest code to DartPad ──────────────────
  useEffect(() => {
    if (refreshKey === 0) return; // skip initial mount — onLoad handles it
    sendCode();
  }, [refreshKey, sendCode]);

  // ── After DartPad iframe loads, wait for its JS runtime to init ──────────────
  const handleIframeLoad = useCallback(() => {
    // DartPad needs ~1.5 s after the iframe `load` event to finish bootstrapping
    // its own JS and become ready to receive postMessage source code.
    setTimeout(sendCode, 1500);
  }, [sendCode]);

  // combinedKey reloads the iframe only when the Refresh button is clicked.
  // refreshKey changes don't reload — they just re-send via postMessage.
  const combinedKey = `flutter-iframe-${localKey}`;

  return (
    <div className="flex flex-col h-full bg-[#0d1117]">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#161b22] border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm">📱</span>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
            Flutter Preview
          </span>
        </div>
        <button
          onClick={() => setLocalKey((k) => k + 1)}
          title="Recargar preview de Flutter (DartPad)"
          className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-white/10 transition-colors"
        >
          <RefreshCw size={13} />
        </button>
      </div>

      {/* ── Phone frame area ── */}
      <div className="flex-1 overflow-auto flex items-center justify-center bg-[#0d1117] py-6">
        {/* Outer phone shell */}
        <div
          className="relative flex-shrink-0"
          style={{
            width: 290,
            height: 600,
            borderRadius: 44,
            background:
              "linear-gradient(145deg, #2e2e2e 0%, #1e1e1e 50%, #111 100%)",
            boxShadow:
              "0 0 0 2px #444, 0 0 0 4px #222, " +
              "inset 0 2px 4px rgba(255,255,255,0.08), " +
              "0 28px 64px rgba(0,0,0,0.85)",
            padding: "12px 8px 20px",
          }}
        >
          {/* Volume up */}
          <div
            style={{
              position: "absolute", left: -4, top: 100,
              width: 4, height: 28, borderRadius: "2px 0 0 2px",
              background: "linear-gradient(to right,#333,#555)",
              boxShadow: "-1px 0 4px rgba(0,0,0,0.6)",
            }}
          />
          {/* Volume down */}
          <div
            style={{
              position: "absolute", left: -4, top: 138,
              width: 4, height: 28, borderRadius: "2px 0 0 2px",
              background: "linear-gradient(to right,#333,#555)",
              boxShadow: "-1px 0 4px rgba(0,0,0,0.6)",
            }}
          />
          {/* Power button */}
          <div
            style={{
              position: "absolute", right: -4, top: 120,
              width: 4, height: 52, borderRadius: "0 2px 2px 0",
              background: "linear-gradient(to left,#333,#555)",
              boxShadow: "1px 0 4px rgba(0,0,0,0.6)",
            }}
          />

          {/* Screen */}
          <div
            style={{
              width: "100%", height: "100%",
              borderRadius: 36, overflow: "hidden",
              background: "#000", position: "relative",
            }}
          >
            {/* Status bar overlay (sits on top of the iframe) */}
            <div
              style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 44,
                background: "rgba(0,0,0,0.72)", zIndex: 10,
                display: "flex", alignItems: "flex-end",
                justifyContent: "space-between",
                padding: "0 20px 6px",
                color: "#fff", fontSize: 11, fontWeight: 600,
                fontFamily: "system-ui,-apple-system,sans-serif",
                pointerEvents: "none",
              }}
            >
              <span>9:41</span>

              {/* Dynamic Island */}
              <div
                style={{
                  position: "absolute", top: 10, left: "50%",
                  transform: "translateX(-50%)",
                  width: 100, height: 28,
                  background: "#000", borderRadius: 20,
                  border: "1.5px solid #2a2a2a",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.95)",
                }}
              />

              {/* Signal + battery icons */}
              <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                {/* Signal bars */}
                <svg width="14" height="10" viewBox="0 0 14 10" fill="white">
                  <rect x="0"    y="6" width="2.5" height="4"  rx="0.5" opacity="0.4" />
                  <rect x="3.5"  y="4" width="2.5" height="6"  rx="0.5" opacity="0.65" />
                  <rect x="7"    y="2" width="2.5" height="8"  rx="0.5" opacity="0.85" />
                  <rect x="10.5" y="0" width="2.5" height="10" rx="0.5" />
                </svg>
                {/* Battery */}
                <svg width="22" height="11" viewBox="0 0 22 11" fill="none">
                  <rect x="0.5" y="0.5" width="18" height="10" rx="3" stroke="white" strokeOpacity="0.7" />
                  <rect x="2"   y="2"   width="13" height="7"  rx="1.5" fill="white" />
                  <path d="M19.5 3.5v4a1.5 1.5 0 1 0 0-4z" fill="white" fillOpacity="0.4" />
                </svg>
              </div>
            </div>

            {/* DartPad embed iframe */}
            <iframe
              key={combinedKey}
              ref={iframeRef}
              src={DARTPAD_URL}
              title="Flutter Preview — DartPad"
              onLoad={handleIframeLoad}
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              style={{ width: "100%", height: "100%", border: "none", background: "#fff" }}
            />

            {/* Home indicator */}
            <div
              style={{
                position: "absolute", bottom: 6,
                left: "50%", transform: "translateX(-50%)",
                width: 100, height: 4, borderRadius: 2,
                background: "rgba(255,255,255,0.35)",
                zIndex: 10, pointerEvents: "none",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
