/// <reference types="vite/client" />

declare module '*.svg' {
  const content: string;
  export default content;
}

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_DEFAULT_ROLE_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
