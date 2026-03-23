/**
 * Pagination.tsx
 * Componente de paginación reutilizable para todas las listas del sitio.
 *
 * Props:
 *   page        — página actual (1-indexed)
 *   totalPages  — total de páginas
 *   onPageChange — callback al cambiar de página
 *   total       — (opcional) total de ítems, para mostrar contador
 *   itemLabel   — (opcional) etiqueta del ítem, p.ej. "proyectos"
 */

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  total?: number;
  itemLabel?: string;
}

export default function Pagination({
  page,
  totalPages,
  onPageChange,
  total,
  itemLabel,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = buildPageRange(page, totalPages);

  const btnBase: React.CSSProperties = {
    minWidth: 34,
    height: 34,
    padding: "0 10px",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-md)",
    background: "var(--color-bg-muted)",
    color: "var(--color-text)",
    fontSize: ".82rem",
    cursor: "pointer",
    transition: "border-color .15s, background .15s",
    fontFamily: "var(--font-body)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const btnActive: React.CSSProperties = {
    ...btnBase,
    background: "var(--color-primary)",
    borderColor: "var(--color-primary)",
    color: "#fff",
    fontWeight: 700,
    cursor: "default",
  };

  const btnDisabled: React.CSSProperties = {
    ...btnBase,
    opacity: 0.38,
    cursor: "not-allowed",
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        justifyContent: "center",
        marginTop: 36,
        flexWrap: "wrap",
      }}
    >
      {/* ← Anterior */}
      <button
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        style={page <= 1 ? btnDisabled : btnBase}
        onMouseEnter={e => {
          if (page > 1) {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-primary)";
          }
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-border)";
        }}
      >
        ← Anterior
      </button>

      {/* Números de página */}
      {pages.map((p, i) =>
        p === "..." ? (
          <span
            key={`ellipsis-${i}`}
            style={{
              minWidth: 34,
              textAlign: "center",
              fontSize: ".82rem",
              color: "var(--color-text-muted)",
            }}
          >
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => p !== page && onPageChange(p as number)}
            style={p === page ? btnActive : btnBase}
            onMouseEnter={e => {
              if (p !== page) {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-primary)";
              }
            }}
            onMouseLeave={e => {
              if (p !== page) {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-border)";
              }
            }}
          >
            {p}
          </button>
        )
      )}

      {/* Siguiente → */}
      <button
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        style={page >= totalPages ? btnDisabled : btnBase}
        onMouseEnter={e => {
          if (page < totalPages) {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-primary)";
          }
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-border)";
        }}
      >
        Siguiente →
      </button>

      {/* Contador total opcional */}
      {total !== undefined && itemLabel && (
        <span
          style={{
            marginLeft: 8,
            fontSize: ".78rem",
            color: "var(--color-text-muted)",
          }}
        >
          · {total.toLocaleString()} {itemLabel}
        </span>
      )}
    </div>
  );
}

/**
 * Genera el rango de páginas a mostrar:
 *   [1] … [current-1] [current] [current+1] … [last]
 * Siempre muestra primera, última, y ventana de ±1 alrededor de la actual.
 */
function buildPageRange(current: number, total: number): (number | "...")[] {
  const range: (number | "...")[] = [];
  const delta = 1;

  let left = Math.max(1, current - delta);
  let right = Math.min(total, current + delta);

  // Ampliar si estamos cerca de los extremos para evitar [1] … [2]
  if (current <= 3) right = Math.min(total, 4);
  if (current >= total - 2) left = Math.max(1, total - 3);

  if (left > 1) {
    range.push(1);
    if (left > 2) range.push("...");
  }

  for (let i = left; i <= right; i++) range.push(i);

  if (right < total) {
    if (right < total - 1) range.push("...");
    range.push(total);
  }

  return range;
}
