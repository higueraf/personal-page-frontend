/** Extrae un mensaje legible de un error de Axios (o cualquier error desconocido). */
export function parseApiError(err: unknown, fallback = "Ocurrió un error inesperado"): string {
  const anyErr = err as any;
  return (
    anyErr?.response?.data?.message ??
    anyErr?.response?.data?.detail ??
    anyErr?.message ??
    fallback
  );
}
