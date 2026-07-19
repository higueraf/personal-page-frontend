export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

export const API_URL: string =
  import.meta.env.VITE_API_URL ?? API_BASE_URL.replace(/\/api$/, "") ?? "http://localhost:8000";
