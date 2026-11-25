interface ResizeHandleProps {
  direction: "horizontal" | "vertical";
  /** When true, dragging toward negative direction grows the panel */
  inverted?: boolean;
  currentSize: number;
  setSize: (s: number) => void;
  min?: number;
  max?: number;
}

export default function ResizeHandle({
  direction,
  inverted = false,
  currentSize,
  setSize,
  min = 100,
  max = 800,
}: ResizeHandleProps) {
  const isH = direction === "horizontal";

  function handleMouseDown(e: React.MouseEvent) {
    e.preventDefault();
    const startPos = isH ? e.clientX : e.clientY;
    const startSize = currentSize;

    function onMove(ev: MouseEvent) {
      const pos = isH ? ev.clientX : ev.clientY;
      const delta = inverted ? startPos - pos : pos - startPos;
      setSize(Math.max(min, Math.min(max, startSize + delta)));
    }

    function onUp() {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    }

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  return (
    <div
      onMouseDown={handleMouseDown}
      title="Arrastrar para redimensionar"
      className={[
        "flex-shrink-0 group relative flex items-center justify-center",
        "bg-black/[0.04] dark:bg-white/[0.04] hover:bg-blue-500/30 active:bg-blue-500/50",
        "transition-colors duration-100 select-none",
        isH
          ? "w-[5px] cursor-col-resize"
          : "h-[5px] cursor-row-resize",
      ].join(" ")}
    >
      {/* Wider invisible hit-area so tiny handles are still easy to grab */}
      <div
        className={
          isH
            ? "absolute inset-y-0 -left-2 -right-2"
            : "absolute inset-x-0 -top-2 -bottom-2"
        }
      />
      {/* Grip dots */}
      <div
        className={[
          "flex gap-[3px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none",
          isH ? "flex-col" : "flex-row",
        ].join(" ")}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-[3px] h-[3px] rounded-full bg-gray-500/60 dark:bg-white/60"
          />
        ))}
      </div>
    </div>
  );
}
